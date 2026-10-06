"""Authentication and authorization dependencies for API routes."""

from typing import Any

from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from api import redis_ops
from api.db import get_db
from api.models.common import oid

bearer_scheme = HTTPBearer(auto_error=False)


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
) -> dict[str, Any]:
    if credentials is None:
        raise HTTPException(status_code=401, detail="Invalid or expired session")

    user_id = redis_ops.get_session_user(credentials.credentials)
    if user_id is None:
        raise HTTPException(status_code=401, detail="Invalid or expired session")

    user = get_db()["users"].find_one({"_id": oid(user_id)})
    if user is None:
        raise HTTPException(status_code=401, detail="Invalid or expired session")

    redis_ops.touch_session(credentials.credentials)
    return user


def get_admin_user(user: dict[str, Any] = Depends(get_current_user)) -> dict[str, Any]:
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin privileges required")
    return user
