"""CRUD routes for the polymorphic `problems` collection."""

from typing import Annotated

from fastapi import APIRouter, HTTPException, Path, Query
from pymongo import ReturnDocument

from api import services
from api.db import get_db
from api.dependencies import AdminUser, OptionalUser
from api.models.common import oid, serialize_doc, utcnow
from api.models.problems import ProblemCreate, ProblemOut, ProblemUpdate

router = APIRouter(prefix="/problems", tags=["problems"])


@router.post(
    "",
    response_model=ProblemOut,
    status_code=201,
    summary="Create a problem",
    description="Create a multiple-choice, coding, or subjective problem. Requires an administrator Bearer token. Returns 201; errors: 400 for invalid IDs, 401/403 for authentication or authorization, and 404 when the contest does not exist.",
)
def create_problem(payload: ProblemCreate, _: AdminUser):
    """Create a typed problem attached to an existing contest."""
    db = get_db()
    body = payload.model_dump()
    contest_id = oid(body.pop("contestId"))
    doc = {**body, "contestId": contest_id, "attemptCount": 0, "createdAt": utcnow()}
    created = services.create_problem(db, contest_id, doc)
    if created is None:
        raise HTTPException(status_code=404, detail="Contest not found")
    return serialize_doc(created)


@router.get(
    "",
    response_model=list[ProblemOut],
    response_model_exclude_none=True,
    summary="List problems",
    description="List problems, optionally filtered by `contestId`. Administrators receive full problem data; unauthenticated and participant responses omit answers and evaluation details. `limit` defaults to 100 and is capped at 300. Returns 200; errors: 400 for an invalid contest ID.",
)
def list_problems(
    user: OptionalUser,
    contestId: str | None = Query(default=None, description="Filter by contest ID."),
    limit: int = Query(
        default=100, description="Maximum results to return; capped at 300."
    ),
):
    """List problems while withholding answer and evaluation fields from non-admins."""
    db = get_db()
    query = {"contestId": oid(contestId)} if contestId else {}
    admin = user is not None and user.get("role") == "admin"
    projection = (
        None
        if admin
        else {
            "contestId": 1,
            "type": 1,
            "title": 1,
            "difficulty": 1,
            "points": 1,
            "attemptCount": 1,
            "createdAt": 1,
        }
    )
    docs = db["problems"].find(query, projection).limit(min(limit, 300))
    return [serialize_doc(d) for d in docs]


@router.get(
    "/{problem_id}",
    response_model=ProblemOut,
    response_model_exclude_none=True,
    summary="Get a problem",
    description="Return a problem by ID. Non-admins cannot view answers or evaluation details, and upcoming contests keep problems locked. Returns 200; errors: 400 for an invalid ID, 403 while the contest is upcoming, and 404 when the problem or contest does not exist.",
)
def get_problem(
    problem_id: Annotated[
        str, Path(description="Unique ID of the problem to retrieve.")
    ],
    user: OptionalUser,
):
    """Fetch one problem, hiding restricted fields unless the caller is an administrator."""
    db = get_db()
    doc = db["problems"].find_one({"_id": oid(problem_id)})
    if doc is None:
        raise HTTPException(status_code=404, detail="Problem not found")
    if user is None or user.get("role") != "admin":
        contest = db["contests"].find_one({"_id": doc["contestId"]}, {"status": 1})
        if contest is None:
            raise HTTPException(status_code=404, detail="Contest not found")
        if contest["status"] == "upcoming":
            raise HTTPException(
                status_code=403, detail="Problems unlock when the contest is live"
            )
        for field in ("correctAnswer", "testCases", "evaluationRubric"):
            doc.pop(field, None)
    return serialize_doc(doc)


@router.patch(
    "/{problem_id}",
    response_model=ProblemOut,
    summary="Update a problem",
    description="Partially update a problem's prompt, scoring, or type-specific evaluation fields. Requires an administrator Bearer token. Returns 200; errors: 400 for an invalid ID, 401/403 for authentication or authorization, and 404 when no problem exists.",
)
def update_problem(
    problem_id: Annotated[str, Path(description="Unique ID of the problem to update.")],
    payload: ProblemUpdate,
    _: AdminUser,
):
    """Update supplied problem fields; omitted fields remain unchanged."""
    db = get_db()
    updates = payload.model_dump(exclude_unset=True, exclude_none=True)
    if "testCases" in updates:
        updates["testCases"] = [
            tc if isinstance(tc, dict) else tc.model_dump()
            for tc in updates["testCases"]
        ]
    if not updates:
        doc = db["problems"].find_one({"_id": oid(problem_id)})
    else:
        doc = db["problems"].find_one_and_update(
            {"_id": oid(problem_id)},
            {"$set": updates},
            return_document=ReturnDocument.AFTER,
        )
    if doc is None:
        raise HTTPException(status_code=404, detail="Problem not found")
    return serialize_doc(doc)


@router.delete(
    "/{problem_id}",
    status_code=204,
    summary="Delete a problem",
    description="Delete a problem and its dependent submissions. Requires an administrator Bearer token. Returns 204; errors: 400 for an invalid ID, 401/403 for authentication or authorization, and 404 when no problem exists.",
)
def delete_problem(
    problem_id: Annotated[str, Path(description="Unique ID of the problem to delete.")],
    _: AdminUser,
):
    """Delete a problem and dependent submissions; successful deletion has no body."""
    db = get_db()
    if services.delete_problem_transaction(db, oid(problem_id)) is None:
        raise HTTPException(status_code=404, detail="Problem not found")
