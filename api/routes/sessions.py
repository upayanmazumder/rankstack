"""Login/logout backed by Redis `session:<sessionId>` TTL keys."""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from api import redis_ops
from api.config import settings
from api.db import get_db
from api.models.common import oid, serialize_doc
from api.security import new_session_token, verify_password

router = APIRouter(prefix="/sessions", tags=["sessions"])


class LoginRequest(BaseModel):
    email: str
    password: str


class LoginResponse(BaseModel):
    sessionId: str
    userId: str
    expiresInSeconds: int


@router.post("", response_model=LoginResponse, status_code=201)
def login(payload: LoginRequest):
    db = get_db()
    user = db["users"].find_one({"email": payload.email})
    if user is None or not verify_password(payload.password, user["passwordHash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    token = new_session_token()
    redis_ops.create_session(token, str(user["_id"]))
    return LoginResponse(
        sessionId=token, userId=str(user["_id"]), expiresInSeconds=settings.session_ttl_seconds
    )


@router.get("/{session_id}")
def get_session(session_id: str):
    user_id = redis_ops.get_session_user(session_id)
    if user_id is None:
        raise HTTPException(status_code=404, detail="Session not found or expired")
    redis_ops.touch_session(session_id)
    db = get_db()
    user = db["users"].find_one({"_id": oid(user_id)})
    return {"sessionId": session_id, "user": serialize_doc(user)}


@router.delete("/{session_id}", status_code=204)
def logout(session_id: str):
    redis_ops.delete_session(session_id)
