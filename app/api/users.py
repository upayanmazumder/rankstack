"""CRUD routes for `users`."""

from fastapi import APIRouter, HTTPException
from pymongo import ReturnDocument
from pymongo.errors import DuplicateKeyError

from app.db import get_db
from app.models.common import oid, serialize_doc, utcnow
from app.models.users import UserCreate, UserOut, UserUpdate
from app.security import hash_password

router = APIRouter(prefix="/users", tags=["users"])


@router.post("", response_model=UserOut, status_code=201)
def create_user(payload: UserCreate):
    db = get_db()
    doc = {
        "name": payload.name,
        "email": payload.email,
        "passwordHash": hash_password(payload.password),
        "role": payload.role,
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
def list_users(role: str | None = None, limit: int = 50):
    db = get_db()
    query = {"role": role} if role else {}
    docs = db["users"].find(query).limit(min(limit, 200))
    return [serialize_doc(d) for d in docs]


@router.get("/{user_id}", response_model=UserOut)
def get_user(user_id: str):
    db = get_db()
    doc = db["users"].find_one({"_id": oid(user_id)})
    if doc is None:
        raise HTTPException(status_code=404, detail="User not found")
    return serialize_doc(doc)


@router.patch("/{user_id}", response_model=UserOut)
def update_user(user_id: str, payload: UserUpdate):
    db = get_db()
    updates = {k: v for k, v in payload.model_dump(exclude_unset=True).items()}
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
def delete_user(user_id: str):
    db = get_db()
    result = db["users"].delete_one({"_id": oid(user_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
