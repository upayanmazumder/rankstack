"""Request/response models for the `submissions` collection."""

from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel

SubmissionStatus = Literal["pending", "correct", "incorrect", "partial"]
RefType = Literal["user", "team"]


class SubmittedBy(BaseModel):
    refType: RefType
    refId: str


class SubmissionCreate(BaseModel):
    contestId: str
    problemId: str
    submittedBy: SubmittedBy
    answer: Any


class SubmissionStatusUpdate(BaseModel):
    status: SubmissionStatus
    score: float = 0


class SubmissionOut(BaseModel):
    id: str
    contestId: str
    problemId: str
    submittedBy: SubmittedBy
    answer: Any
    status: SubmissionStatus
    score: float
    submittedAt: datetime
