"""CRUD routes for `submissions`, backed by the create/status-update transactions
and Redis rate limiting / leaderboard sync."""

from fastapi import APIRouter, HTTPException, Query

from api import redis_ops, services
from api.db import get_db
from api.dependencies import CurrentUser
from api.models.common import oid, serialize_doc
from api.models.submissions import (
    SubmissionCreate,
    SubmissionOut,
    SubmissionStatusUpdate,
)

router = APIRouter(prefix="/submissions", tags=["submissions"])


@router.post("", response_model=SubmissionOut, status_code=201)
def create_submission(payload: SubmissionCreate, current: CurrentUser):
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

    services.validate_submission_problem(db, contest_id, problem_id, payload.answer)
    allowed, count = redis_ops.check_and_increment_rate_limit(str(current["_id"]))
    if not allowed:
        raise HTTPException(
            status_code=429,
            detail=f"Rate limit exceeded ({count} submissions in the current window)",
        )
    doc = services.create_submission(
        db,
        contest_id,
        problem_id,
        {"refType": payload.submittedBy.refType, "refId": submitter_id},
        payload.answer,
    )
    return serialize_doc(doc)


@router.get("", response_model=list[SubmissionOut])
def list_submissions(
    contestId: str | None = None,
    userId: str | None = None,
    status: str | None = None,
    limit: int = Query(default=100, ge=1, le=300),
    offset: int = Query(default=0, ge=0),
):
    db = get_db()
    query: dict = {}
    if contestId:
        query["contestId"] = oid(contestId)
    if userId:
        query["submittedBy.refId"] = oid(userId)
    if status:
        query["status"] = status
    docs = (
        db["submissions"].find(query).sort("submittedAt", -1).skip(offset).limit(limit)
    )
    return [serialize_doc(d) for d in docs]


@router.get("/{submission_id}", response_model=SubmissionOut)
def get_submission(submission_id: str):
    db = get_db()
    doc = db["submissions"].find_one({"_id": oid(submission_id)})
    if doc is None:
        raise HTTPException(status_code=404, detail="Submission not found")
    return serialize_doc(doc)


@router.patch("/{submission_id}/status", response_model=SubmissionOut)
def update_status(
    submission_id: str,
    payload: SubmissionStatusUpdate,
    current: CurrentUser,
):
    if current.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin privileges required")
    db = get_db()
    sub_id = oid(submission_id)
    existing = db["submissions"].find_one({"_id": sub_id}, {"score": 1})
    if existing is None:
        raise HTTPException(status_code=404, detail="Submission not found")
    old_score = existing.get("score", 0)
    doc = services.update_submission_status(db, sub_id, payload.status, payload.score)
    delta = payload.score - old_score
    if (
        delta != 0
        and db["dirty_leaderboards"].find_one({"_id": doc["contestId"]}, {"_id": 1})
        is None
    ):
        redis_ops.update_leaderboard_score(
            str(doc["contestId"]), str(doc["submittedBy"]["refId"]), delta
        )
    return serialize_doc(doc)


@router.delete("/{submission_id}", status_code=204)
def delete_submission(submission_id: str, current: CurrentUser):
    db = get_db()
    sub_id = oid(submission_id)
    submission = db["submissions"].find_one({"_id": sub_id})
    if submission is None:
        raise HTTPException(status_code=404, detail="Submission not found")
    submitted_by = submission["submittedBy"]
    is_owner = (
        submitted_by["refType"] == "user" and submitted_by["refId"] == current["_id"]
    )
    is_team_member = (
        submitted_by["refType"] == "team"
        and db["teams"].find_one(
            {"_id": submitted_by["refId"], "memberIds": current["_id"]}, {"_id": 1}
        )
        is not None
    )
    if current.get("role") != "admin" and not is_owner and not is_team_member:
        raise HTTPException(status_code=403, detail="Cannot delete this submission")
    if services.delete_submission_transaction(db, sub_id) is None:
        raise HTTPException(status_code=404, detail="Submission not found")
