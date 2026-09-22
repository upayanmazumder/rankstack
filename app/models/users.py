"""Request/response models for the `users` collection."""

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, EmailStr, Field

Role = Literal["participant", "admin"]


class UserCreate(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    email: EmailStr
    password: str = Field(min_length=6, max_length=200)
    role: Role = "participant"


class UserUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=120)
    email: EmailStr | None = None
    role: Role | None = None


class UserOut(BaseModel):
    id: str
    name: str
    email: str
    role: Role
    totalScore: float = 0
    teamIds: list[str] = []
    createdAt: datetime
