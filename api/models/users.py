"""Request/response models for the `users` collection."""

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field

Role = Literal["participant", "admin"]


class UserCreate(BaseModel):
    model_config = ConfigDict(
        json_schema_extra={
            "examples": [
                {
                    "name": "Ada Lovelace",
                    "email": "ada@example.com",
                    "password": "correct-horse-battery",
                    "role": "participant",
                }
            ]
        }
    )

    name: str = Field(min_length=1, max_length=120)
    email: EmailStr
    password: str = Field(min_length=6, max_length=200)
    role: Role = "participant"


class UserUpdate(BaseModel):
    model_config = ConfigDict(
        json_schema_extra={"examples": [{"name": "Ada Lovelace"}]}
    )

    name: str | None = Field(default=None, min_length=1, max_length=120)
    email: EmailStr | None = None
    role: Role | None = None


class UserOut(BaseModel):
    model_config = ConfigDict(
        json_schema_extra={
            "examples": [
                {
                    "id": "507f1f77bcf86cd799439011",
                    "name": "Ada Lovelace",
                    "email": "ada@example.com",
                    "role": "participant",
                    "totalScore": 250,
                    "teamIds": [],
                    "createdAt": "2026-10-01T12:00:00Z",
                }
            ]
        }
    )

    id: str
    name: str
    email: str
    role: Role
    totalScore: float = 0
    teamIds: list[str] = []
    createdAt: datetime
