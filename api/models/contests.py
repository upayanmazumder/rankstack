"""Request/response models for the `contests` collection."""

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field

Status = Literal["upcoming", "live", "ended"]
RefType = Literal["user", "team"]


class ParticipantRef(BaseModel):
    refType: RefType
    refId: str


class ContestCreate(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    description: str = ""
    startTime: datetime
    endTime: datetime
    createdBy: str
    problemIds: list[str] = []


class ContestUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=200)
    description: str | None = None
    startTime: datetime | None = None
    endTime: datetime | None = None


class ContestStatusUpdate(BaseModel):
    status: Status


class ContestAddParticipant(BaseModel):
    refType: RefType
    refId: str


class ContestOut(BaseModel):
    id: str
    title: str
    description: str
    startTime: datetime
    endTime: datetime
    status: Status
    createdBy: str
    problemIds: list[str] = []
    participants: list[ParticipantRef] = []
    createdAt: datetime
