"""CRUD routes for the polymorphic `problems` collection."""

from fastapi import APIRouter, HTTPException
from pymongo import ReturnDocument

from api.db import get_db
from api.models.common import oid, serialize_doc, utcnow
from api.models.problems import ProblemCreate, ProblemOut, ProblemUpdate

router = APIRouter(prefix="/problems", tags=["problems"])


@router.post("", response_model=ProblemOut, status_code=201)
def create_problem(payload: ProblemCreate):
    db = get_db()
    body = payload.model_dump()
    contest_id = oid(body.pop("contestId"))
    doc = {**body, "contestId": contest_id, "attemptCount": 0, "createdAt": utcnow()}
    result = db["problems"].insert_one(doc)
    doc["_id"] = result.inserted_id
    db["contests"].update_one({"_id": contest_id}, {"$addToSet": {"problemIds": doc["_id"]}})
    return serialize_doc(doc)


@router.get("", response_model=list[ProblemOut])
def list_problems(contestId: str | None = None, limit: int = 100):
    db = get_db()
    query = {"contestId": oid(contestId)} if contestId else {}
    docs = db["problems"].find(query).limit(min(limit, 300))
    return [serialize_doc(d) for d in docs]


@router.get("/{problem_id}", response_model=ProblemOut)
def get_problem(problem_id: str):
    db = get_db()
    doc = db["problems"].find_one({"_id": oid(problem_id)})
    if doc is None:
        raise HTTPException(status_code=404, detail="Problem not found")
    return serialize_doc(doc)


@router.patch("/{problem_id}", response_model=ProblemOut)
def update_problem(problem_id: str, payload: ProblemUpdate):
    db = get_db()
    updates = payload.model_dump(exclude_unset=True, exclude_none=True)
    if "testCases" in updates:
        updates["testCases"] = [tc if isinstance(tc, dict) else tc.model_dump() for tc in updates["testCases"]]
    if not updates:
        doc = db["problems"].find_one({"_id": oid(problem_id)})
    else:
        doc = db["problems"].find_one_and_update(
            {"_id": oid(problem_id)}, {"$set": updates}, return_document=ReturnDocument.AFTER
        )
    if doc is None:
        raise HTTPException(status_code=404, detail="Problem not found")
    return serialize_doc(doc)


@router.delete("/{problem_id}", status_code=204)
def delete_problem(problem_id: str):
    db = get_db()
    pid = oid(problem_id)
    doc = db["problems"].find_one({"_id": pid})
    if doc is None:
        raise HTTPException(status_code=404, detail="Problem not found")
    db["problems"].delete_one({"_id": pid})
    db["contests"].update_one({"_id": doc["contestId"]}, {"$pull": {"problemIds": pid}})
