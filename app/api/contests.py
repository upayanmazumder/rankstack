"""CRUD routes for `contests`, plus status transitions and participant adds."""

from fastapi import APIRouter, HTTPException
from pymongo import ReturnDocument

from app import redis_ops
from app.db import get_db
from app.models.common import oid, serialize_doc, utcnow
from app.models.contests import (
    ContestAddParticipant,
    ContestCreate,
    ContestOut,
    ContestStatusUpdate,
    ContestUpdate,
)

router = APIRouter(prefix="/contests", tags=["contests"])


@router.post("", response_model=ContestOut, status_code=201)
def create_contest(payload: ContestCreate):
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
def update_contest(contest_id: str, payload: ContestUpdate):
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
def update_status(contest_id: str, payload: ContestStatusUpdate):
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
def add_participant(contest_id: str, payload: ContestAddParticipant):
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
    """Fast-path leaderboard read from the Redis sorted set."""
    return {"contestId": contest_id, "leaderboard": redis_ops.get_leaderboard(contest_id, top)}


@router.delete("/{contest_id}", status_code=204)
def delete_contest(contest_id: str):
    db = get_db()
    result = db["contests"].delete_one({"_id": oid(contest_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Contest not found")
