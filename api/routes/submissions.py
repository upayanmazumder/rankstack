"""CRUD routes for `submissions`, backed by the create/status-update transactions
and Redis rate limiting / leaderboard sync."""

import logging
from typing import Annotated

from bson import ObjectId
from fastapi import APIRouter, HTTPException, Path, Query
from redis.exceptions import RedisError

from api import redis_ops, services
from api.db import get_db
from api.dependencies import CurrentUser
from api.models.common import oid, paginate_collection, serialize_doc
from api.models.submissions import (
    SubmissionCreate,
    SubmissionOut,
    SubmissionStatusUpdate,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/submissions", tags=["submissions"])


@router.post(
    "",
    response_model=SubmissionOut,
    status_code=201,
    summary="Create a submission",
    description="Submit an answer for a contest problem as the authenticated user or a team they belong to. The contest must be live and the submitter must have joined it. Requires a Bearer token. Returns 201; errors: 400 for invalid IDs or answers, 401/403 for authentication, submitter, or participation authorization, 404 when the contest or problem does not exist, 409 when the contest is not live, and 429 when rate limited.",
)
def create_submission(payload: SubmissionCreate, current: CurrentUser):
    """Create an authorized submission and enforce the per-user rate limit."""
    db = get_db()
    contest_id = oid(payload.contestId)
    problem_id = oid(payload.problemId)
    submitter_id = oid(payload.submittedBy.refId)
    if payload.submittedBy.refType == "user":
        if submitter_id != current["_id"]:
            raise HTTPException(
                status_code=403, detail="Cannot submit for another user"
            )
    elif (
        db["teams"].find_one(
            {"_id": submitter_id, "memberIds": current["_id"]}, {"_id": 1}
        )
        is None
    ):
        raise HTTPException(status_code=403, detail="Team membership required")

    submitted_by = {"refType": payload.submittedBy.refType, "refId": submitter_id}
    services.assert_contest_open_for(db, contest_id, submitted_by)
    services.validate_submission_problem(db, contest_id, problem_id, payload.answer)
    allowed, count, window_token = redis_ops.check_and_increment_rate_limit(
        str(current["_id"])
    )
    if not allowed:
        raise HTTPException(
            status_code=429,
            detail=f"Rate limit exceeded ({count} submissions in the current window)",
        )
    try:
        doc = services.create_submission(
            db,
            contest_id,
            problem_id,
            submitted_by,
            payload.answer,
        )
    except Exception:
        try:
            redis_ops.decrement_rate_limit(str(current["_id"]), window_token)
        except RedisError:
            pass  # Best-effort refund; the submission error still takes priority.
        raise
    return serialize_doc(doc)


def _visible_ref_ids(db, user_id: ObjectId) -> list[ObjectId]:
    """Return the submitter IDs the current user may read: themself and their teams."""
    team_ids = [
        team["_id"] for team in db["teams"].find({"memberIds": user_id}, {"_id": 1})
    ]
    return [user_id, *team_ids]


def _can_view_submission(db, doc: dict, current: dict) -> bool:
    """Allow administrators, the submitting user, and members of the submitting team."""
    if current.get("role") == "admin":
        return True
    submitted_by = doc["submittedBy"]
    if submitted_by["refType"] == "user":
        return submitted_by["refId"] == current["_id"]
    return (
        db["teams"].find_one(
            {"_id": submitted_by["refId"], "memberIds": current["_id"]}, {"_id": 1}
        )
        is not None
    )


@router.get(
    "",
    response_model=list[SubmissionOut],
    summary="List submissions",
    description="List the current user's submissions and submissions of their teams, optionally filtered by contest or status. Administrators see every submission and may filter by `userId`. Requires a Bearer token. `limit` defaults to 100 and is capped at 300. Returns 200; errors: 400 for an invalid ID filter and 401 for an invalid session.",
)
def list_submissions(
    current: CurrentUser,
    contestId: str | None = Query(default=None, description="Filter by contest ID."),
    userId: str | None = Query(
        default=None,
        description="Filter by submitter user or team ID. Administrators only; ignored for other callers.",
    ),
    status: str | None = Query(
        default=None, description="Filter by evaluation status."
    ),
    limit: int = Query(
        default=100,
        ge=1,
        le=300,
        description="Maximum results to return; capped at 300.",
    ),
    offset: int = Query(default=0, ge=0, description="Number of submissions to skip."),
):
    """List submissions matching the supplied filters with a stable sort, scoped to the caller."""
    db = get_db()
    query: dict = {}
    if contestId:
        query["contestId"] = oid(contestId)
    if status:
        query["status"] = status
    if current.get("role") == "admin":
        if userId:
            query["submittedBy.refId"] = oid(userId)
    else:
        query["submittedBy.refId"] = {"$in": _visible_ref_ids(db, current["_id"])}
    docs = paginate_collection(
        db["submissions"],
        query=query,
        limit=limit,
        offset=offset,
        sort=[("submittedAt", -1), ("_id", -1)],
    )
    return [serialize_doc(d) for d in docs]


@router.get(
    "/{submission_id}",
    response_model=SubmissionOut,
    summary="Get a submission",
    description="Return the submission identified by `submission_id` when the caller owns it, belongs to the submitting team, or is an administrator. Requires a Bearer token. Returns 200; errors: 400 for an invalid ID and 401/404 for authentication or when the submission is missing or not visible to the caller.",
)
def get_submission(
    submission_id: Annotated[
        str, Path(description="Unique ID of the submission to retrieve.")
    ],
    current: CurrentUser,
):
    """Fetch one submission by ID, scoped to the caller."""
    db = get_db()
    doc = db["submissions"].find_one({"_id": oid(submission_id)})
    if doc is None or not _can_view_submission(db, doc, current):
        raise HTTPException(status_code=404, detail="Submission not found")
    return serialize_doc(doc)


@router.patch(
    "/{submission_id}/status",
    response_model=SubmissionOut,
    summary="Update submission status",
    description="Set a submission's evaluation status and score. Requires an administrator Bearer token. Returns 200; errors: 400 for an invalid ID, 401/403 for authentication or authorization, and 404 when no submission exists.",
)
def update_status(
    submission_id: Annotated[
        str, Path(description="Unique ID of the submission to score.")
    ],
    payload: SubmissionStatusUpdate,
    current: CurrentUser,
):
    """Update a submission's evaluation result; only administrators may score it."""
    if current.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin privileges required")
    db = get_db()
    sub_id = oid(submission_id)
    result = services.update_submission_status(
        db, sub_id, payload.status, payload.score
    )
    if result is None:
        raise HTTPException(status_code=404, detail="Submission not found")
    doc, delta = result
    if delta != 0:
        contest_id_str = str(doc["contestId"])
        member_id_str = str(doc["submittedBy"]["refId"])
        marker = db["dirty_leaderboards"].find_one({"_id": doc["contestId"]})
        version = marker["version"] if marker is not None else 0
        try:
            applied = redis_ops.update_leaderboard_score(
                contest_id_str, member_id_str, delta, version
            )
        except RedisError as exc:
            applied = None
            # Mongo already has the correct score; mark the leaderboard dirty
            # so a later read rebuilds the ZSET from Mongo instead of
            # serving a Redis score that silently missed this delta.
            logger.warning(
                "Redis leaderboard update failed for contest %s, member %s: %s",
                doc["contestId"],
                doc["submittedBy"]["refId"],
                exc,
            )
            db["dirty_leaderboards"].update_one(
                {"_id": doc["contestId"]},
                {"$set": {"dirty": True}},
                upsert=True,
            )
        if applied is not None:
            # The direct write landed and now matches `version`: resolve the
            # marker so the next read takes the fast Redis path instead of
            # re-aggregating MongoDB for no reason.
            db["dirty_leaderboards"].update_one(
                {"_id": doc["contestId"], "version": version},
                {"$set": {"reconciledVersion": version}},
            )
        # `applied is None` without a RedisError means either the
        # leaderboard was never built (a lone delta would leave it
        # incomplete -- see redis_ops.update_leaderboard_score) or a
        # concurrent rebuild already captured this exact revision from
        # MongoDB and double-applying it here would double-count the
        # delta. Either way the marker is already pending, or was just
        # reconciled by that rebuild, so there's nothing more to do.
    return serialize_doc(doc)


@router.delete(
    "/{submission_id}",
    status_code=204,
    summary="Delete a submission",
    description="Delete a submission owned by the current user, their team, or an administrator. Requires a Bearer token. Returns 204; errors: 400 for an invalid ID, 401/403 for authentication or ownership, and 404 when no submission exists.",
)
def delete_submission(
    submission_id: Annotated[
        str, Path(description="Unique ID of the submission to delete.")
    ],
    current: CurrentUser,
):
    """Delete a submission when the caller owns it or is an administrator."""
    db = get_db()
    sub_id = oid(submission_id)
    submission = db["submissions"].find_one({"_id": sub_id})
    if submission is None:
        raise HTTPException(status_code=404, detail="Submission not found")
    if not _can_view_submission(db, submission, current):
        raise HTTPException(status_code=403, detail="Cannot delete this submission")
    if services.delete_submission_transaction(db, sub_id) is None:
        raise HTTPException(status_code=404, detail="Submission not found")
