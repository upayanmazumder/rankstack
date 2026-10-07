"""Request/response models for the `contests` collection."""

from datetime import datetime, timezone
from typing import Literal

from fastapi import HTTPException
from pydantic import BaseModel, Field, model_validator

Status = Literal["upcoming", "live", "ended"]
RefType = Literal["user", "team"]

def _validate_date_range(start: datetime, end: datetime) -> None:
    start_utc = start.replace(tzinfo=timezone.utc) if start.utcoffset() is None else start
    end_utc = end.replace(tzinfo=timezone.utc) if end.utcoffset() is None else end
    if start_utc >= end_utc:
        raise HTTPException(status_code=400, detail="startTime must be before endTime")


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

    @model_validator(mode="after")
    def validate_dates(self) -> "ContestCreate":
        _validate_date_range(self.startTime, self.endTime)
        return self


class ContestUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=200)
    description: str | None = None
    startTime: datetime | None = None
    endTime: datetime | None = None

    @model_validator(mode="after")
    def validate_dates(self) -> "ContestUpdate":
        if self.startTime is not None and self.endTime is not None:
            _validate_date_range(self.startTime, self.endTime)
        return self


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
