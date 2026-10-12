"""CRUD routes for `contests`, plus status transitions and participant adds."""

from typing import Annotated

from fastapi import APIRouter, HTTPException, Path, Query
from pymongo import ReturnDocument
from redis.exceptions import RedisError

from api import redis_ops, services
from api.aggregations.pipelines import leaderboard_for_contest
from api.config import settings
from api.db import get_db
from api.dependencies import AdminUser, CurrentUser
from api.models.common import oid, paginate_collection, serialize_doc, utcnow
from api.models.contests import (
    ContestAddParticipant,
    ContestCreate,
    ContestOut,
    ContestStatusUpdate,
    ContestUpdate,
)

router = APIRouter(prefix="/contests", tags=["contests"])


@router.post(
    "",
    response_model=ContestOut,
    status_code=201,
    summary="Create a contest",
    description="Create a contest with its schedule and problem IDs. Requires an administrator Bearer token. Returns 201; errors: 400 for invalid IDs or dates, 401/403 for authentication or authorization, and 404 if the creator does not exist.",
)
def create_contest(payload: ContestCreate, _: AdminUser):
    """Create a contest; returns 201 or a documented validation, auth, or not-found error."""
    db = get_db()
    creator_id = oid(payload.createdBy)
    if db["users"].find_one({"_id": creator_id}, {"_id": 1}) is None:
        raise HTTPException(status_code=404, detail="Contest creator not found")
    doc = {
        "title": payload.title,
        "description": payload.description,
        "startTime": payload.startTime,
        "endTime": payload.endTime,
        "status": "upcoming",
        "createdBy": creator_id,
        "problemIds": [oid(p) for p in payload.problemIds],
        "participants": [],
        "createdAt": utcnow(),
    }
    result = db["contests"].insert_one(doc)
    doc["_id"] = result.inserted_id
    return serialize_doc(doc)


@router.get(
    "",
    response_model=list[ContestOut],
    summary="List contests",
    description="List contests, optionally filtered by status. `limit` defaults to 50 and is capped at 200. Returns 200.",
)
def list_contests(
    status: str | None = Query(default=None, description="Filter by contest status."),
    limit: int = Query(
        default=50, ge=1, le=200, description="Maximum results to return."
    ),
    offset: int = Query(default=0, ge=0, description="Number of contests to skip."),
):
    """List contests with optional status filtering and a stable bounded page."""
    db = get_db()
    query = {"status": status} if status else {}
    docs = paginate_collection(
        db["contests"],
        query=query,
        limit=limit,
        offset=offset,
        sort=[("_id", 1)],
    )
    return [serialize_doc(d) for d in docs]


@router.get(
    "/{contest_id}",
    response_model=ContestOut,
    summary="Get a contest",
    description="Return the contest identified by `contest_id`. Returns 200; errors: 400 for an invalid ID and 404 when no contest exists.",
)
def get_contest(
    contest_id: Annotated[
        str, Path(description="Unique ID of the contest to retrieve.")
    ],
):
    """Fetch one contest by ID; returns 404 when it does not exist."""
    db = get_db()
    doc = db["contests"].find_one({"_id": oid(contest_id)})
    if doc is None:
        raise HTTPException(status_code=404, detail="Contest not found")
    return serialize_doc(doc)


@router.patch(
    "/{contest_id}",
    response_model=ContestOut,
    summary="Update a contest",
    description="Partially update a contest's title, description, or schedule. Requires an administrator Bearer token. Returns 200; errors: 400 for an invalid ID or schedule, 401/403 for authentication or authorization, and 404 when no contest exists.",
)
def update_contest(
    contest_id: Annotated[str, Path(description="Unique ID of the contest to update.")],
    payload: ContestUpdate,
    _: AdminUser,
):
    """Apply supplied contest fields; schedule end time must remain after start time."""
    db = get_db()
    contest_oid = oid(contest_id)
    updates = payload.model_dump(exclude_unset=True, exclude_none=True)
    if not updates:
        doc = db["contests"].find_one({"_id": contest_oid})
    else:
        query = {"_id": contest_oid}
        if "startTime" in updates and "endTime" not in updates:
            query["endTime"] = {"$gt": updates["startTime"]}
        elif "endTime" in updates and "startTime" not in updates:
            query["startTime"] = {"$lt": updates["endTime"]}
        doc = db["contests"].find_one_and_update(
            query, {"$set": updates}, return_document=ReturnDocument.AFTER
        )
    if doc is None:
        if ("startTime" in updates or "endTime" in updates) and db["contests"].find_one(
            {"_id": contest_oid}, {"_id": 1}
        ):
            raise HTTPException(
                status_code=400, detail="startTime must be before endTime"
            )
        raise HTTPException(status_code=404, detail="Contest not found")
    return serialize_doc(doc)


@router.patch(
    "/{contest_id}/status",
    response_model=ContestOut,
    summary="Change contest status",
    description="Set a contest to `upcoming`, `live`, or `ended`. Requires an administrator Bearer token. Returns 200; errors: 400 for an invalid ID, 401/403 for authentication or authorization, and 404 when no contest exists.",
)
def update_status(
    contest_id: Annotated[str, Path(description="Unique ID of the contest to update.")],
    payload: ContestStatusUpdate,
    _: AdminUser,
):
    """Set a contest status; only administrators may perform this transition."""
    db = get_db()
    doc = db["contests"].find_one_and_update(
        {"_id": oid(contest_id)},
        {"$set": {"status": payload.status}},
        return_document=ReturnDocument.AFTER,
    )
    if doc is None:
        raise HTTPException(status_code=404, detail="Contest not found")
    try:
        # Re-read status as late as possible instead of trusting `payload`:
        # a concurrent status change (e.g. this request ending a contest
        # racing another reopening it) must win if it lands first, so the
        # cache's TTL always reflects whichever status is current, not
        # necessarily this request's own.
        current = db["contests"].find_one({"_id": oid(contest_id)}, {"status": 1})
        if current is not None and current.get("status") == "ended":
            redis_ops.expire_leaderboard(
                contest_id, settings.leaderboard_ended_ttl_seconds
            )
        elif current is not None:
            redis_ops.persist_leaderboard(contest_id)
    except RedisError:
        pass  # Best-effort: the cache still works, just without a TTL yet.
    return serialize_doc(doc)


@router.post(
    "/{contest_id}/participants",
    response_model=ContestOut,
    summary="Join a contest",
    description="Add the authenticated user to a contest, or let an administrator add a user or team. Requires a Bearer token. Returns 200; errors: 400 for an invalid ID, 401 for an invalid session, 403 for a disallowed team operation, 404 when no contest exists, and 409 when a participant tries to join an ended contest.",
)
def add_participant(
    contest_id: Annotated[str, Path(description="Unique ID of the contest to join.")],
    payload: ContestAddParticipant,
    user: CurrentUser,
):
    """Add the current user or an administrator-selected participant to a contest."""
    db = get_db()
    if user.get("role") == "admin":
        entry = {"refType": payload.refType, "refId": oid(payload.refId)}
    else:
        if payload.refType != "user":
            raise HTTPException(
                status_code=403, detail="Only administrators can add teams"
            )
        entry = {"refType": "user", "refId": user["_id"]}
    contest_oid = oid(contest_id)
    query = {"_id": contest_oid}
    if user.get("role") != "admin":
        query["status"] = {"$in": ["upcoming", "live"]}
    doc = db["contests"].find_one_and_update(
        query,
        {"$addToSet": {"participants": entry}},
        return_document=ReturnDocument.AFTER,
    )
    if doc is None:
        if user.get("role") != "admin" and db["contests"].find_one(
            {"_id": contest_oid}, {"_id": 1}
        ):
            raise HTTPException(status_code=409, detail="Contest has ended")
        raise HTTPException(status_code=404, detail="Contest not found")
    return serialize_doc(doc)


@router.get(
    "/{contest_id}/leaderboard",
    summary="Get a contest leaderboard",
    description="Return ranked participant scores and submission counts. `top` defaults to 10 and must be between 1 and 100. Returns 200; errors: 400 for an invalid ID and 404 when no contest exists.",
    responses={
        200: {
            "content": {
                "application/json": {
                    "example": {
                        "contestId": "507f1f77bcf86cd799439013",
                        "leaderboard": [
                            {
                                "memberId": "507f1f77bcf86cd799439011",
                                "participantName": "Ada Lovelace",
                                "score": 250,
                                "rank": 1,
                                "submissionCount": 4,
                            }
                        ],
                    }
                }
            }
        }
    },
)
def get_leaderboard(
    contest_id: Annotated[str, Path(description="Unique ID of the contest.")],
    top: int = Query(
        default=10,
        ge=1,
        le=100,
        description="Maximum number of ranked participants to return.",
    ),
):
    """Serve the live Redis leaderboard; rebuild from MongoDB when Redis has
    lost its revision (restart, eviction, never-seeded), a delete or grade
    left it pending, or Redis itself is unreachable."""
    db = get_db()
    contest_oid = oid(contest_id)
    if db["contests"].find_one({"_id": contest_oid}, {"_id": 1}) is None:
        raise HTTPException(status_code=404, detail="Contest not found")

    marker = db["dirty_leaderboards"].find_one({"_id": contest_oid})
    pending = marker is not None and marker.get("reconciledVersion") != marker.get(
        "version"
    )
    try:
        built = redis_ops.leaderboard_exists(contest_id)
    except RedisError:
        # Can't trust Redis right now; rebuild straight from MongoDB below.
        built = False
    needs_rebuild = pending or not built

    if needs_rebuild:
        version = marker.get("version", 0) if marker is not None else 0
        # Always pull every ranked submitter, not just `top`: the snapshot
        # below replaces the *entire* cached ZSET, so a `top`-limited fetch
        # would silently truncate it for every future read until a later
        # rebuild happened to use a larger `top`.
        rows = leaderboard_for_contest(db, contest_oid, limit=None)
        try:
            replaced = redis_ops.replace_leaderboard(
                contest_id,
                {str(row["refId"]): row["totalScore"] for row in rows},
                version,
            )
        except RedisError:
            replaced = False  # Keep the marker pending and serve MongoDB data.
        if replaced and marker is not None:
            db["dirty_leaderboards"].update_one(
                {"_id": contest_oid, "version": version},
                {"$set": {"reconciledVersion": version}},
            )
        if replaced:
            # Re-read status as late as possible instead of trusting a value
            # read before the aggregation above: a status change racing this
            # rebuild (e.g. a reopen landing mid-rebuild) must win, or the
            # leaderboard just rebuilt for a live contest could be handed a
            # stale "ended" TTL here.
            current = db["contests"].find_one({"_id": contest_oid}, {"status": 1})
            if current is not None and current.get("status") == "ended":
                try:
                    redis_ops.expire_leaderboard(
                        contest_id, settings.leaderboard_ended_ttl_seconds
                    )
                except RedisError:
                    pass
        leaderboard = [
            {
                "memberId": str(row["refId"]),
                "score": row["totalScore"],
                "rank": rank,
            }
            for rank, row in enumerate(rows, 1)
        ][: max(top, 0)]
    else:
        try:
            leaderboard = redis_ops.get_leaderboard(contest_id, top)
        except RedisError:
            # Redis died between the exists() check above and this read;
            # serve this one request from MongoDB without touching the
            # marker -- a transient blip, not evidence the cache is stale.
            rows = leaderboard_for_contest(db, contest_oid, limit=max(top, 1))
            leaderboard = [
                {
                    "memberId": str(row["refId"]),
                    "score": row["totalScore"],
                    "rank": rank,
                }
                for rank, row in enumerate(rows, 1)
            ]
    member_ids = [row["memberId"] for row in leaderboard]
    counts = (
        {
            str(row["_id"]): row["count"]
            for row in db["submissions"].aggregate(
                [
                    {
                        "$match": {
                            "contestId": contest_oid,
                            "submittedBy.refId": {
                                "$in": [oid(member_id) for member_id in member_ids]
                            },
                        }
                    },
                    {"$group": {"_id": "$submittedBy.refId", "count": {"$sum": 1}}},
                ]
            )
        }
        if member_ids
        else {}
    )
    names = (
        {
            str(user["_id"]): user["name"]
            for user in db["users"].find(
                {"_id": {"$in": [oid(member_id) for member_id in member_ids]}},
                {"name": 1},
            )
        }
        if member_ids
        else {}
    )
    team_names = (
        {
            str(team["_id"]): team["name"]
            for team in db["teams"].find(
                {"_id": {"$in": [oid(member_id) for member_id in member_ids]}},
                {"name": 1},
            )
        }
        if member_ids
        else {}
    )
    for row in leaderboard:
        row["participantName"] = names.get(
            row["memberId"], team_names.get(row["memberId"], row["memberId"])
        )
        row["submissionCount"] = counts.get(row["memberId"], 0)
    return {"contestId": contest_id, "leaderboard": leaderboard}


@router.delete(
    "/{contest_id}",
    status_code=204,
    summary="Delete a contest",
    description="Delete a contest and its dependent data. Requires an administrator Bearer token. Returns 204; errors: 400 for an invalid ID, 401/403 for authentication or authorization, and 404 when no contest exists.",
)
def delete_contest(
    contest_id: Annotated[str, Path(description="Unique ID of the contest to delete.")],
    _: AdminUser,
):
    """Delete a contest and related records; successful deletion has no response body."""
    db = get_db()
    if services.delete_contest_transaction(db, oid(contest_id)) is None:
        raise HTTPException(status_code=404, detail="Contest not found")
