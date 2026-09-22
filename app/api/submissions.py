"""CRUD routes for `submissions`, backed by the create/status-update transactions
and Redis rate limiting / leaderboard sync."""

from fastapi import APIRouter, HTTPException

from app import redis_ops, services
from app.db import get_db
from app.models.common import oid, serialize_doc
from app.models.submissions import SubmissionCreate, SubmissionOut, SubmissionStatusUpdate

router = APIRouter(prefix="/submissions", tags=["submissions"])


@router.post("", response_model=SubmissionOut, status_code=201)
def create_submission(payload: SubmissionCreate):
    db = get_db()
    allowed, count = redis_ops.check_and_increment_rate_limit(payload.submittedBy.refId)
    if not allowed:
        raise HTTPException(
            status_code=429,
            detail=f"Rate limit exceeded ({count} submissions in the current window)",
        )
    doc = services.create_submission(
        db,
        oid(payload.contestId),
        oid(payload.problemId),
        {"refType": payload.submittedBy.refType, "refId": oid(payload.submittedBy.refId)},
        payload.answer,
    )
    return serialize_doc(doc)


@router.get("", response_model=list[SubmissionOut])
def list_submissions(
    contestId: str | None = None,
    userId: str | None = None,
    status: str | None = None,
    limit: int = 100,
):
    db = get_db()
    query: dict = {}
    if contestId:
        query["contestId"] = oid(contestId)
    if userId:
        query["submittedBy.refId"] = oid(userId)
    if status:
        query["status"] = status
    docs = db["submissions"].find(query).limit(min(limit, 300))
    return [serialize_doc(d) for d in docs]


@router.get("/{submission_id}", response_model=SubmissionOut)
def get_submission(submission_id: str):
    db = get_db()
    doc = db["submissions"].find_one({"_id": oid(submission_id)})
    if doc is None:
        raise HTTPException(status_code=404, detail="Submission not found")
    return serialize_doc(doc)


@router.patch("/{submission_id}/status", response_model=SubmissionOut)
def update_status(submission_id: str, payload: SubmissionStatusUpdate):
    db = get_db()
    sub_id = oid(submission_id)
    existing = db["submissions"].find_one({"_id": sub_id}, {"score": 1})
    if existing is None:
        raise HTTPException(status_code=404, detail="Submission not found")
    old_score = existing.get("score", 0)
    doc = services.update_submission_status(db, sub_id, payload.status, payload.score)
    delta = payload.score - old_score
    if delta != 0:
        redis_ops.update_leaderboard_score(
            str(doc["contestId"]), str(doc["submittedBy"]["refId"]), delta
        )
    return serialize_doc(doc)


@router.delete("/{submission_id}", status_code=204)
def delete_submission(submission_id: str):
    db = get_db()
    result = db["submissions"].delete_one({"_id": oid(submission_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Submission not found")
