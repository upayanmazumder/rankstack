"""CRUD routes for `users`."""

from fastapi import APIRouter, HTTPException, Query
from pymongo import ReturnDocument
from pymongo.errors import DuplicateKeyError

from api.db import get_db
from api.dependencies import CurrentUser
from api.models.common import oid, serialize_doc, utcnow
from api.models.users import UserCreate, UserOut, UserUpdate
from api.security import hash_password

router = APIRouter(prefix="/users", tags=["users"])


@router.post("", response_model=UserOut, status_code=201)
def create_user(payload: UserCreate):
    db = get_db()
    doc = {
        "name": payload.name,
        "email": payload.email,
        "passwordHash": hash_password(payload.password),
        "role": "participant",
        "totalScore": 0,
        "teamIds": [],
        "createdAt": utcnow(),
    }
    try:
        result = db["users"].insert_one(doc)
    except DuplicateKeyError:
        raise HTTPException(status_code=409, detail="Email already registered")
    doc["_id"] = result.inserted_id
    return serialize_doc(doc)


@router.get("", response_model=list[UserOut])
def list_users(
    role: str | None = None,
    limit: int | None = Query(default=None, ge=1, le=200),
):
    db = get_db()
    query = {"role": role} if role else {}
    docs = db["users"].find(query)
    if limit is not None:
        docs = docs.limit(limit)
    return [serialize_doc(d) for d in docs]


@router.get("/{user_id}", response_model=UserOut)
def get_user(user_id: str):
    db = get_db()
    doc = db["users"].find_one({"_id": oid(user_id)})
    if doc is None:
        raise HTTPException(status_code=404, detail="User not found")
    return serialize_doc(doc)


@router.patch("/{user_id}", response_model=UserOut)
def update_user(user_id: str, payload: UserUpdate, current: CurrentUser):
    db = get_db()
    target_id = oid(user_id)
    if current.get("role") != "admin" and current["_id"] != target_id:
        raise HTTPException(status_code=403, detail="Cannot update another user")
    updates = payload.model_dump(exclude_unset=True)
    if "role" in updates and current.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin privileges required")
    if not updates:
        doc = db["users"].find_one({"_id": oid(user_id)})
    else:
        try:
            doc = db["users"].find_one_and_update(
                {"_id": oid(user_id)},
                {"$set": updates},
                return_document=ReturnDocument.AFTER,
            )
        except DuplicateKeyError:
            raise HTTPException(status_code=409, detail="Email already registered")
    if doc is None:
        raise HTTPException(status_code=404, detail="User not found")
    return serialize_doc(doc)


@router.delete("/{user_id}", status_code=204)
def delete_user(user_id: str, current: CurrentUser):
    db = get_db()
    target_id = oid(user_id)
    if current.get("role") != "admin" and current["_id"] != target_id:
        raise HTTPException(status_code=403, detail="Cannot delete another user")
    result = db["users"].delete_one({"_id": target_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
