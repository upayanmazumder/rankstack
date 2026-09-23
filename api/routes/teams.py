"""CRUD routes for `teams`, plus member add/remove via atomic transactions."""

from fastapi import APIRouter, HTTPException
from pymongo import ReturnDocument

from api import services
from api.db import get_db
from api.models.common import oid, serialize_doc, utcnow
from api.models.teams import TeamCreate, TeamMemberOp, TeamOut, TeamUpdate

router = APIRouter(prefix="/teams", tags=["teams"])


@router.post("", response_model=TeamOut, status_code=201)
def create_team(payload: TeamCreate):
    db = get_db()
    doc = {
        "name": payload.name,
        "memberIds": [oid(m) for m in payload.memberIds],
        "totalScore": 0,
        "createdAt": utcnow(),
    }
    result = db["teams"].insert_one(doc)
    doc["_id"] = result.inserted_id
    for member_id in doc["memberIds"]:
        db["users"].update_one({"_id": member_id}, {"$addToSet": {"teamIds": doc["_id"]}})
    return serialize_doc(doc)


@router.get("", response_model=list[TeamOut])
def list_teams(limit: int = 50):
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
def update_team(team_id: str, payload: TeamUpdate):
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
def add_member(team_id: str, payload: TeamMemberOp):
    db = get_db()
    team = services.add_team_member(db, oid(team_id), oid(payload.userId))
    if team is None:
        raise HTTPException(status_code=404, detail="Team not found")
    return serialize_doc(team)


@router.delete("/{team_id}/members/{user_id}", response_model=TeamOut)
def remove_member(team_id: str, user_id: str):
    db = get_db()
    team = services.remove_team_member(db, oid(team_id), oid(user_id))
    if team is None:
        raise HTTPException(status_code=404, detail="Team not found")
    return serialize_doc(team)


@router.delete("/{team_id}", status_code=204)
def delete_team(team_id: str):
    db = get_db()
    result = db["teams"].delete_one({"_id": oid(team_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Team not found")
