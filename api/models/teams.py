"""Request/response models for the `teams` collection."""

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class TeamCreate(BaseModel):
    model_config = ConfigDict(
        json_schema_extra={
            "examples": [
                {
                    "name": "Runtime Terrors",
                    "memberIds": ["507f1f77bcf86cd799439012"],
                }
            ]
        }
    )

    name: str = Field(min_length=1, max_length=120)
    memberIds: list[str] = []


class TeamUpdate(BaseModel):
    model_config = ConfigDict(
        json_schema_extra={"examples": [{"name": "Runtime Terrors 2.0"}]}
    )

    name: str | None = Field(default=None, min_length=1, max_length=120)


class TeamMemberOp(BaseModel):
    model_config = ConfigDict(
        json_schema_extra={"examples": [{"userId": "507f1f77bcf86cd799439012"}]}
    )

    userId: str


class TeamOut(BaseModel):
    model_config = ConfigDict(
        json_schema_extra={
            "examples": [
                {
                    "id": "507f1f77bcf86cd799439015",
                    "name": "Runtime Terrors",
                    "memberIds": ["507f1f77bcf86cd799439011"],
                    "totalScore": 340,
                    "createdAt": "2026-10-01T12:00:00Z",
                }
            ]
        }
    )

    id: str
    name: str
    memberIds: list[str]
    totalScore: float = 0
    createdAt: datetime
