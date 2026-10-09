"""Authentication and authorization dependencies for API routes."""

from typing import Annotated, Any

from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from api import redis_ops
from api.db import get_db
from api.models.common import oid

bearer_scheme = HTTPBearer(auto_error=False)


def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(bearer_scheme)],
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


CurrentUser = Annotated[dict[str, Any], Depends(get_current_user)]


def get_optional_user(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(bearer_scheme)],
) -> dict[str, Any] | None:
    if credentials is None:
        return None
    try:
        return get_current_user(credentials)
    except HTTPException:
        return None


OptionalUser = Annotated[dict[str, Any] | None, Depends(get_optional_user)]


def get_admin_user(user: CurrentUser) -> dict[str, Any]:
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin privileges required")
    return user


AdminUser = Annotated[dict[str, Any], Depends(get_admin_user)]


def get_team_member_or_admin(team_id: str, user: CurrentUser) -> dict[str, Any]:
    """Require an administrator or a member of the requested team."""
    if user.get("role") == "admin":
        return user

    team = get_db()["teams"].find_one(
        {"_id": oid(team_id), "memberIds": user["_id"]}, {"_id": 1}
    )
    if team is None:
        raise HTTPException(status_code=403, detail="Team membership required")
    return user


TeamMemberOrAdmin = Annotated[dict[str, Any], Depends(get_team_member_or_admin)]
