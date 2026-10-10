"""CRUD routes for `teams`, plus member add/remove via atomic transactions."""

from typing import Annotated

from fastapi import APIRouter, HTTPException, Path, Query
from pymongo import ReturnDocument

from api import services
from api.db import get_db
from api.dependencies import AdminUser, CurrentUser, TeamMemberOrAdmin
from api.models.common import oid, serialize_doc, utcnow
from api.models.teams import TeamCreate, TeamMemberOp, TeamOut, TeamUpdate

router = APIRouter(prefix="/teams", tags=["teams"])


@router.post(
    "",
    response_model=TeamOut,
    status_code=201,
    summary="Create a team",
    description="Create a team containing the authenticated user and optional requested members. Requires a Bearer token; only administrators may add other users. Returns 201; errors: 400 for invalid member IDs, 401/403 for authentication or authorization.",
)
def create_team(payload: TeamCreate, current: CurrentUser):
    """Create a team with the current user as a member."""
    db = get_db()
    requested_members = [oid(member_id) for member_id in payload.memberIds]
    if current.get("role") != "admin" and any(
        member_id != current["_id"] for member_id in requested_members
    ):
        raise HTTPException(
            status_code=403, detail="Admin privileges required to add members"
        )
    member_ids = list(dict.fromkeys([current["_id"], *requested_members]))
    doc = {
        "name": payload.name,
        "memberIds": member_ids,
        "totalScore": 0,
        "createdAt": utcnow(),
    }
    result = db["teams"].insert_one(doc)
    doc["_id"] = result.inserted_id
    for member_id in doc["memberIds"]:
        db["users"].update_one(
            {"_id": member_id}, {"$addToSet": {"teamIds": doc["_id"]}}
        )
    return serialize_doc(doc)


@router.get(
    "",
    response_model=list[TeamOut],
    summary="List teams",
    description="List teams visible to the authenticated user. `limit` defaults to 50 and is capped at 200. Requires a Bearer token. Returns 200; errors: 401 for an invalid session.",
)
def list_teams(
    _: CurrentUser,
    limit: int = Query(
        default=50, description="Maximum results to return; capped at 200."
    ),
):
    """List teams for an authenticated caller."""
    db = get_db()
    docs = db["teams"].find().limit(min(limit, 200))
    return [serialize_doc(d) for d in docs]


@router.get(
    "/{team_id}",
    response_model=TeamOut,
    summary="Get a team",
    description="Return the team identified by `team_id`. Returns 200; errors: 400 for an invalid ID and 404 when no team exists.",
)
def get_team(
    team_id: Annotated[str, Path(description="Unique ID of the team to retrieve.")],
):
    """Fetch one team by ID."""
    db = get_db()
    doc = db["teams"].find_one({"_id": oid(team_id)})
    if doc is None:
        raise HTTPException(status_code=404, detail="Team not found")
    return serialize_doc(doc)


@router.patch(
    "/{team_id}",
    response_model=TeamOut,
    summary="Update a team",
    description="Update a team's name. Requires a Bearer token from a team member or administrator. Returns 200; errors: 400 for an invalid ID, 401/403 for authentication or authorization, and 404 when no team exists.",
)
def update_team(
    team_id: Annotated[str, Path(description="Unique ID of the team to update.")],
    payload: TeamUpdate,
    _: TeamMemberOrAdmin,
):
    """Update a team's editable fields for an authorized team member or administrator."""
    db = get_db()
    updates = payload.model_dump(exclude_unset=True)
    if not updates:
        doc = db["teams"].find_one({"_id": oid(team_id)})
    else:
        doc = db["teams"].find_one_and_update(
            {"_id": oid(team_id)},
            {"$set": updates},
            return_document=ReturnDocument.AFTER,
        )
    if doc is None:
        raise HTTPException(status_code=404, detail="Team not found")
    return serialize_doc(doc)


@router.post(
    "/{team_id}/members",
    response_model=TeamOut,
    summary="Add a team member",
    description="Add a user to a team. Requires an administrator Bearer token. Returns 200; errors: 400 for invalid IDs, 401/403 for authentication or authorization, and 404 when the team or user does not exist.",
)
def add_member(
    team_id: Annotated[str, Path(description="Unique ID of the team to update.")],
    payload: TeamMemberOp,
    _: AdminUser,
):
    """Add a user to a team; only administrators may add members."""
    db = get_db()
    team = services.add_team_member(db, oid(team_id), oid(payload.userId))
    if team is None:
        raise HTTPException(status_code=404, detail="Team not found")
    return serialize_doc(team)


@router.delete(
    "/{team_id}/members/{user_id}",
    response_model=TeamOut,
    summary="Remove a team member",
    description="Remove a user from a team. Requires a Bearer token from a team member or administrator. Returns 200; errors: 400 for invalid IDs, 401/403 for authentication or authorization, 404 when no team exists, and 409 when removing the final member.",
)
def remove_member(
    team_id: Annotated[str, Path(description="Unique ID of the team to update.")],
    user_id: Annotated[str, Path(description="Unique ID of the member to remove.")],
    _: TeamMemberOrAdmin,
):
    """Remove a member while preserving the team's required final member."""
    db = get_db()
    try:
        team = services.remove_team_member(db, oid(team_id), oid(user_id))
    except services.LastTeamMemberError:
        raise HTTPException(
            status_code=409, detail="A team must have at least one member"
        )
    if team is None:
        raise HTTPException(status_code=404, detail="Team not found")
    return serialize_doc(team)


@router.delete(
    "/{team_id}",
    status_code=204,
    summary="Delete a team",
    description="Delete a team and update its members' team references. Requires a Bearer token from a team member or administrator. Returns 204; errors: 400 for an invalid ID, 401/403 for authentication or authorization, and 404 when no team exists.",
)
def delete_team(
    team_id: Annotated[str, Path(description="Unique ID of the team to delete.")],
    _: TeamMemberOrAdmin,
):
    """Delete a team and its membership references."""
    db = get_db()
    if services.delete_team_transaction(db, oid(team_id)) is None:
        raise HTTPException(status_code=404, detail="Team not found")
