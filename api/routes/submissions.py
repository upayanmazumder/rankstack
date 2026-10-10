"""CRUD routes for `submissions`, backed by the create/status-update transactions
and Redis rate limiting / leaderboard sync."""

from typing import Annotated

from fastapi import APIRouter, HTTPException, Path, Query

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


@router.post(
    "",
    response_model=SubmissionOut,
    status_code=201,
    summary="Create a submission",
    description="Submit an answer for a contest problem as the authenticated user or a team they belong to. Requires a Bearer token. Returns 201; errors: 400 for invalid IDs or answers, 401/403 for authentication or submitter authorization, 404 when the contest or problem does not exist, and 429 when rate limited.",
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


@router.get(
    "",
    response_model=list[SubmissionOut],
    summary="List submissions",
    description="List submissions, optionally filtered by contest, user, or status. `limit` defaults to 100 and is capped at 300. Returns 200; errors: 400 for an invalid ID filter.",
)
def list_submissions(
    contestId: str | None = Query(default=None, description="Filter by contest ID."),
    userId: str | None = Query(
        default=None, description="Filter by submitter user or team ID."
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
    """List submissions matching the supplied filters."""
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


@router.get(
    "/{submission_id}",
    response_model=SubmissionOut,
    summary="Get a submission",
    description="Return the submission identified by `submission_id`. Returns 200; errors: 400 for an invalid ID and 404 when no submission exists.",
)
def get_submission(
    submission_id: Annotated[
        str, Path(description="Unique ID of the submission to retrieve.")
    ],
):
    """Fetch one submission by ID."""
    db = get_db()
    doc = db["submissions"].find_one({"_id": oid(submission_id)})
    if doc is None:
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
