"""CRUD routes for `users`."""

from typing import Annotated

from fastapi import APIRouter, HTTPException, Path, Query
from pymongo import ReturnDocument
from pymongo.errors import DuplicateKeyError

from api import services
from api.db import get_db
from api.dependencies import CurrentUser, OptionalUser
from api.models.common import oid, serialize_doc, utcnow
from api.models.users import UserCreate, UserOut, UserUpdate
from api.security import hash_password

router = APIRouter(prefix="/users", tags=["users"])


@router.post(
    "",
    response_model=UserOut,
    status_code=201,
    summary="Create a user",
    description="Register a participant account. The role is always set to `participant`, regardless of the submitted role field. Returns 201; errors: 409 when the email is already registered and 422 for invalid input.",
)
def create_user(payload: UserCreate):
    """Register a participant account; duplicate email addresses return 409."""
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


def _visible_user(doc: dict, viewer: dict | None) -> dict:
    """Redact `email` unless the viewer is the profile owner or an administrator."""
    is_self = viewer is not None and viewer["_id"] == doc["_id"]
    is_admin = viewer is not None and viewer.get("role") == "admin"
    if not is_self and not is_admin:
        doc = {**doc, "email": None}
    return doc


@router.get(
    "",
    response_model=list[UserOut],
    response_model_exclude_none=True,
    summary="List users",
    description="List user profiles, optionally filtered by role. Only the caller's own profile and administrators include `email`. `limit` is capped at 200. Returns 200.",
)
def list_users(
    viewer: OptionalUser,
    role: str | None = Query(
        default=None, description="Filter by participant or administrator role."
    ),
    limit: int | None = Query(
        default=None,
        ge=1,
        le=200,
        description="Maximum results to return; capped at 200.",
    ),
):
    """List user profiles with optional role filtering and a bounded result limit."""
    db = get_db()
    query = {"role": role} if role else {}
    docs = db["users"].find(query)
    if limit is not None:
        docs = docs.limit(limit)
    return [serialize_doc(_visible_user(d, viewer)) for d in docs]


@router.get(
    "/{user_id}",
    response_model=UserOut,
    response_model_exclude_none=True,
    summary="Get a user",
    description="Return the public profile for `user_id`. `email` is included only for the profile owner and administrators. Returns 200; errors: 400 for an invalid ID and 404 when no user exists.",
)
def get_user(
    user_id: Annotated[str, Path(description="Unique ID of the user to retrieve.")],
    viewer: OptionalUser,
):
    """Fetch one public user profile by ID."""
    db = get_db()
    doc = db["users"].find_one({"_id": oid(user_id)})
    if doc is None:
        raise HTTPException(status_code=404, detail="User not found")
    return serialize_doc(_visible_user(doc, viewer))


@router.patch(
    "/{user_id}",
    response_model=UserOut,
    summary="Update a user",
    description="Partially update a user profile. Requires a Bearer token; participants may update only themselves and only administrators may change roles. Returns 200; errors: 400 for an invalid ID, 401/403 for authentication or authorization, 404 when no user exists, and 409 for a duplicate email.",
)
def update_user(
    user_id: Annotated[str, Path(description="Unique ID of the user to update.")],
    payload: UserUpdate,
    current: CurrentUser,
):
    """Update a user's profile, enforcing owner and administrator permissions."""
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


@router.delete(
    "/{user_id}",
    status_code=204,
    summary="Delete a user",
    description="Delete a user account and cascade the deletion to their team membership, contest participation, their own submissions, and their active sessions. Requires a Bearer token; participants may delete only themselves. Returns 204; errors: 400 for an invalid ID, 401/403 for authentication or authorization, and 404 when no user exists.",
)
def delete_user(
    user_id: Annotated[str, Path(description="Unique ID of the user to delete.")],
    current: CurrentUser,
):
    """Delete the current user's account or, for administrators, the target account."""
    db = get_db()
    target_id = oid(user_id)
    if current.get("role") != "admin" and current["_id"] != target_id:
        raise HTTPException(status_code=403, detail="Cannot delete another user")
    if services.delete_user_transaction(db, target_id) is None:
        raise HTTPException(status_code=404, detail="User not found")
