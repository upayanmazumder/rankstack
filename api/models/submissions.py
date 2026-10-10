"""Request/response models for the `submissions` collection."""

from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, ConfigDict

SubmissionStatus = Literal["pending", "correct", "incorrect", "partial"]
RefType = Literal["user", "team"]


class SubmittedBy(BaseModel):
    model_config = ConfigDict(
        json_schema_extra={
            "examples": [{"refType": "user", "refId": "507f1f77bcf86cd799439011"}]
        }
    )

    refType: RefType
    refId: str


class SubmissionCreate(BaseModel):
    model_config = ConfigDict(
        json_schema_extra={
            "examples": [
                {
                    "contestId": "507f1f77bcf86cd799439013",
                    "problemId": "507f1f77bcf86cd799439014",
                    "submittedBy": {
                        "refType": "user",
                        "refId": "507f1f77bcf86cd799439011",
                    },
                    "answer": "200",
                }
            ]
        }
    )

    contestId: str
    problemId: str
    submittedBy: SubmittedBy
    answer: Any


class SubmissionStatusUpdate(BaseModel):
    model_config = ConfigDict(
        json_schema_extra={"examples": [{"status": "correct", "score": 100}]}
    )

    status: SubmissionStatus
    score: float = 0


class SubmissionOut(BaseModel):
    model_config = ConfigDict(
        json_schema_extra={
            "examples": [
                {
                    "id": "507f1f77bcf86cd799439016",
                    "contestId": "507f1f77bcf86cd799439013",
                    "problemId": "507f1f77bcf86cd799439014",
                    "submittedBy": {
                        "refType": "user",
                        "refId": "507f1f77bcf86cd799439011",
                    },
                    "answer": "200",
                    "status": "correct",
                    "score": 100,
                    "submittedAt": "2026-10-11T09:30:00Z",
                }
            ]
        }
    )

    id: str
    contestId: str
    problemId: str
    submittedBy: SubmittedBy
    answer: Any
    status: SubmissionStatus
    score: float
    submittedAt: datetime
