"""Login/logout backed by Redis `session:<sessionId>` TTL keys."""

from typing import Annotated

from fastapi import APIRouter, HTTPException, Path, Request
from pydantic import BaseModel, ConfigDict

from api import redis_ops
from api.config import settings
from api.db import get_db
from api.models.common import oid, serialize_doc
from api.models.users import UserOut
from api.security import DUMMY_PASSWORD_HASH, new_session_token, verify_password

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
    description="Authenticate with an email and password and return an opaque session ID, user ID, and TTL. Returns 201; errors: 401 when credentials are invalid and 429 when throttled.",
)
def login(payload: LoginRequest, request: Request):
    """Authenticate a user and issue a time-limited session token."""
    # app/src/app/api/session/route.ts calls this server-side without
    # forwarding the browser's address, so every login proxied through the
    # Next.js app shares one IP bucket there. The API is also reachable
    # directly (see k8s/chart/templates/api.yaml's Ingress), so a
    # client-supplied forwarded-for header cannot be trusted here without a
    # real trusted-proxy allowlist; the per-email limit still throttles
    # credential stuffing against one account regardless of this gap.
    client_ip = request.client.host if request.client else "unknown"
    allowed, _ = redis_ops.check_and_increment_login_attempts(payload.email, client_ip)
    if not allowed:
        raise HTTPException(
            status_code=429,
            detail="Too many login attempts. Try again later.",
            headers={"Retry-After": str(settings.login_rate_limit_window_seconds)},
        )
    db = get_db()
    user = db["users"].find_one({"email": payload.email})
    stored_hash = user["passwordHash"] if user is not None else DUMMY_PASSWORD_HASH
    password_ok = verify_password(payload.password, stored_hash)
    if user is None or not password_ok:
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
    db = get_db()
    user = db["users"].find_one({"_id": oid(user_id)})
    if user is None:
        raise HTTPException(status_code=404, detail="Session not found or expired")
    redis_ops.touch_session(session_id)
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
