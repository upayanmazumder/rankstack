"""CRUD routes for `teams`, plus member add/remove via atomic transactions."""

from fastapi import APIRouter, HTTPException
from pymongo import ReturnDocument

from api import services
from api.db import get_db
from api.dependencies import AdminUser, CurrentUser, TeamMemberOrAdmin
from api.models.common import oid, serialize_doc, utcnow
from api.models.teams import TeamCreate, TeamMemberOp, TeamOut, TeamUpdate

router = APIRouter(prefix="/teams", tags=["teams"])


@router.post("", response_model=TeamOut, status_code=201)
def create_team(payload: TeamCreate, current: CurrentUser):
    db = get_db()
    requested_members = [oid(member_id) for member_id in payload.memberIds]
    if current.get("role") != "admin" and any(
        member_id != current["_id"] for member_id in requested_members
    ):
        raise HTTPException(status_code=403, detail="Admin privileges required to add members")
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
        db["users"].update_one({"_id": member_id}, {"$addToSet": {"teamIds": doc["_id"]}})
    return serialize_doc(doc)


@router.get("", response_model=list[TeamOut])
def list_teams(_: CurrentUser, limit: int = 50):
    db = get_db()
    docs = db["teams"].find().limit(min(limit, 200))
    return [serialize_doc(d) for d in docs]


@router.get("/{team_id}", response_model=TeamOut)
def get_team(team_id: str):
    db = get_db()
    doc = db["teams"].find_one({"_id": oid(team_id)})
    if doc is None:
        raise HTTPException(status_code=404, detail="Team not found")
    return serialize_doc(doc)


@router.patch("/{team_id}", response_model=TeamOut)
def update_team(team_id: str, payload: TeamUpdate, _: TeamMemberOrAdmin):
    db = get_db()
    updates = payload.model_dump(exclude_unset=True)
    if not updates:
        doc = db["teams"].find_one({"_id": oid(team_id)})
    else:
        doc = db["teams"].find_one_and_update(
            {"_id": oid(team_id)}, {"$set": updates}, return_document=ReturnDocument.AFTER
        )
    if doc is None:
        raise HTTPException(status_code=404, detail="Team not found")
    return serialize_doc(doc)


@router.post("/{team_id}/members", response_model=TeamOut)
def add_member(team_id: str, payload: TeamMemberOp, _: AdminUser):
    db = get_db()
    team = services.add_team_member(db, oid(team_id), oid(payload.userId))
    if team is None:
        raise HTTPException(status_code=404, detail="Team not found")
    return serialize_doc(team)


@router.delete("/{team_id}/members/{user_id}", response_model=TeamOut)
def remove_member(team_id: str, user_id: str, _: TeamMemberOrAdmin):
    db = get_db()
    try:
        team = services.remove_team_member(db, oid(team_id), oid(user_id))
    except services.LastTeamMemberError:
        raise HTTPException(status_code=409, detail="A team must have at least one member")
    if team is None:
        raise HTTPException(status_code=404, detail="Team not found")
    return serialize_doc(team)


@router.delete("/{team_id}", status_code=204)
def delete_team(team_id: str, _: TeamMemberOrAdmin):
    db = get_db()
    if services.delete_team_transaction(db, oid(team_id)) is None:
        raise HTTPException(status_code=404, detail="Team not found")
