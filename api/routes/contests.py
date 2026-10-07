"""CRUD routes for `contests`, plus status transitions and participant adds."""

from fastapi import APIRouter, HTTPException
from pymongo import ReturnDocument
from redis.exceptions import RedisError

from api import redis_ops, services
from api.db import get_db
from api.dependencies import AdminUser
from api.models.common import oid, serialize_doc, utcnow
from api.models.contests import (
    ContestAddParticipant,
    ContestCreate,
    ContestOut,
    ContestStatusUpdate,
    ContestUpdate,
)

router = APIRouter(prefix="/contests", tags=["contests"])


@router.post("", response_model=ContestOut, status_code=201)
def create_contest(payload: ContestCreate, _: AdminUser):
    db = get_db()
    doc = {
        "title": payload.title,
        "description": payload.description,
        "startTime": payload.startTime,
        "endTime": payload.endTime,
        "status": "upcoming",
        "createdBy": oid(payload.createdBy),
        "problemIds": [oid(p) for p in payload.problemIds],
        "participants": [],
        "createdAt": utcnow(),
    }
    result = db["contests"].insert_one(doc)
    doc["_id"] = result.inserted_id
    return serialize_doc(doc)


@router.get("", response_model=list[ContestOut])
def list_contests(status: str | None = None, limit: int = 50):
    db = get_db()
    query = {"status": status} if status else {}
    docs = db["contests"].find(query).limit(min(limit, 200))
    return [serialize_doc(d) for d in docs]


@router.get("/{contest_id}", response_model=ContestOut)
def get_contest(contest_id: str):
    db = get_db()
    doc = db["contests"].find_one({"_id": oid(contest_id)})
    if doc is None:
        raise HTTPException(status_code=404, detail="Contest not found")
    return serialize_doc(doc)


@router.patch("/{contest_id}", response_model=ContestOut)
def update_contest(contest_id: str, payload: ContestUpdate, _: AdminUser):
    db = get_db()
    updates = payload.model_dump(exclude_unset=True)
    if not updates:
        doc = db["contests"].find_one({"_id": oid(contest_id)})
    else:
        doc = db["contests"].find_one_and_update(
            {"_id": oid(contest_id)}, {"$set": updates}, return_document=ReturnDocument.AFTER
        )
    if doc is None:
        raise HTTPException(status_code=404, detail="Contest not found")
    return serialize_doc(doc)


@router.patch("/{contest_id}/status", response_model=ContestOut)
def update_status(contest_id: str, payload: ContestStatusUpdate, _: AdminUser):
    db = get_db()
    doc = db["contests"].find_one_and_update(
        {"_id": oid(contest_id)},
        {"$set": {"status": payload.status}},
        return_document=ReturnDocument.AFTER,
    )
    if doc is None:
        raise HTTPException(status_code=404, detail="Contest not found")
    return serialize_doc(doc)


@router.post("/{contest_id}/participants", response_model=ContestOut)
def add_participant(contest_id: str, payload: ContestAddParticipant, _: AdminUser):
    db = get_db()
    entry = {"refType": payload.refType, "refId": oid(payload.refId)}
    doc = db["contests"].find_one_and_update(
        {"_id": oid(contest_id)},
        {"$addToSet": {"participants": entry}},
        return_document=ReturnDocument.AFTER,
    )
    if doc is None:
        raise HTTPException(status_code=404, detail="Contest not found")
    return serialize_doc(doc)


@router.get("/{contest_id}/leaderboard")
def get_leaderboard(contest_id: str, top: int = 10):
    """Read MongoDB after deletions and repair Redis when it becomes available."""
    db = get_db()
    contest_oid = oid(contest_id)
    marker = db["dirty_leaderboards"].find_one({"_id": contest_oid})
    if marker:
        pending = (
            "reconciledVersion" not in marker
            or marker.get("reconciledVersion") != marker.get("version")
        )
        exists = db["contests"].find_one({"_id": contest_oid}, {"_id": 1}) is not None
        rows = []
        if exists:
            pipeline = [
                {"$match": {"contestId": contest_oid, "score": {"$exists": True, "$ne": 0}}},
                {"$group": {"_id": "$submittedBy.refId", "score": {"$sum": "$score"}}},
                {"$sort": {"score": -1, "_id": -1}},
            ]
            if not pending:
                pipeline.append({"$limit": max(top, 1)})
            rows = list(db["submissions"].aggregate(pipeline))
        if pending:
            try:
                redis_ops.replace_leaderboard(
                    contest_id, {str(row["_id"]): row["score"] for row in rows}
                )
            except RedisError:
                pass  # Keep the marker pending and serve MongoDB data.
            else:
                db["dirty_leaderboards"].update_one(
                    {
                        "_id": contest_oid,
                        "version": marker.get("version", {"$exists": False}),
                    },
                    {"$set": {"reconciledVersion": marker.get("version")}},
                )
        if not exists:
            raise HTTPException(status_code=404, detail="Contest not found")
        leaderboard = [
            {"memberId": str(row["_id"]), "score": row["score"], "rank": rank}
            for rank, row in enumerate(rows, 1)
        ][: max(top, 0)]
    else:
        leaderboard = redis_ops.get_leaderboard(contest_id, top)
    return {"contestId": contest_id, "leaderboard": leaderboard}


@router.delete("/{contest_id}", status_code=204)
def delete_contest(contest_id: str, _: AdminUser):
    db = get_db()
    if services.delete_contest_transaction(db, oid(contest_id)) is None:
        raise HTTPException(status_code=404, detail="Contest not found")
