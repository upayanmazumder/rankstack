"""Login/logout backed by Redis `session:<sessionId>` TTL keys."""

from typing import Annotated

from fastapi import APIRouter, HTTPException, Path
from pydantic import BaseModel, ConfigDict

from api import redis_ops
from api.config import settings
from api.db import get_db
from api.models.common import oid, serialize_doc
from api.models.users import UserOut
from api.security import new_session_token, verify_password

router = APIRouter(prefix="/sessions", tags=["sessions"])


class LoginRequest(BaseModel):
    model_config = ConfigDict(
        json_schema_extra={
            "examples": [
                {"email": "ada@example.com", "password": "correct-horse-battery"}
            ]
        }
    )

    email: str
    password: str


class LoginResponse(BaseModel):
    model_config = ConfigDict(
        json_schema_extra={
            "examples": [
                {
                    "sessionId": "opaque-session-token",
                    "userId": "507f1f77bcf86cd799439011",
                    "expiresInSeconds": 86400,
                }
            ]
        }
    )

    sessionId: str
    userId: str
    expiresInSeconds: int


class SessionDetail(BaseModel):
    model_config = ConfigDict(
        json_schema_extra={
            "examples": [
                {
                    "sessionId": "opaque-session-token",
                    "user": {
                        "id": "507f1f77bcf86cd799439011",
                        "name": "Ada Lovelace",
                        "email": "ada@example.com",
                        "role": "participant",
                        "totalScore": 250,
                        "teamIds": [],
                        "createdAt": "2026-10-01T12:00:00Z",
                    },
                }
            ]
        }
    )

    sessionId: str
    user: UserOut


@router.post(
    "",
    response_model=LoginResponse,
    status_code=201,
    summary="Create a session",
    description="Authenticate with an email and password and return an opaque session ID, user ID, and TTL. Returns 201; errors: 401 when credentials are invalid.",
)
def login(payload: LoginRequest):
    """Authenticate a user and issue a time-limited session token."""
    db = get_db()
    user = db["users"].find_one({"email": payload.email})
    if user is None or not verify_password(payload.password, user["passwordHash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    token = new_session_token()
    redis_ops.create_session(token, str(user["_id"]))
    return LoginResponse(
        sessionId=token,
        userId=str(user["_id"]),
        expiresInSeconds=settings.session_ttl_seconds,
    )


@router.get(
    "/{session_id}",
    response_model=SessionDetail,
    summary="Get the session profile",
    description="Validate and refresh a session, then return its user profile. Treat `session_id` as a secret credential. Returns 200; errors: 404 when the session is missing or expired.",
)
def get_session(
    session_id: Annotated[
        str, Path(description="Opaque session ID returned at login.")
    ],
):
    """Validate a session token and return its public user profile."""
    user_id = redis_ops.get_session_user(session_id)
    if user_id is None:
        raise HTTPException(status_code=404, detail="Session not found or expired")
    redis_ops.touch_session(session_id)
    db = get_db()
    user = db["users"].find_one({"_id": oid(user_id)})
    return {"sessionId": session_id, "user": serialize_doc(user)}


@router.delete(
    "/{session_id}",
    status_code=204,
    summary="Delete a session",
    description="Revoke the session identified by its opaque ID. Returns 204 with no response body.",
)
def logout(
    session_id: Annotated[str, Path(description="Opaque session ID to revoke.")],
):
    """Revoke a session token; successful logout has no response body."""
    redis_ops.delete_session(session_id)
