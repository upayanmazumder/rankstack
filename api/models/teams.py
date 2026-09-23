"""Request/response models for the `teams` collection."""

from datetime import datetime

from pydantic import BaseModel, Field


class TeamCreate(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    memberIds: list[str] = []


class TeamUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=120)


class TeamMemberOp(BaseModel):
    userId: str


class TeamOut(BaseModel):
    id: str
    name: str
    memberIds: list[str]
    totalScore: float = 0
    createdAt: datetime
