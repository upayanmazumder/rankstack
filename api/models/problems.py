"""Request/response models for the polymorphic `problems` collection.

`ProblemCreate` is a discriminated union on `type`; FastAPI validates the
right shape (mcq / coding / subjective) directly from the request body.
"""

from datetime import datetime
from typing import Annotated, Literal

from pydantic import BaseModel, ConfigDict, Field

Difficulty = Literal["easy", "medium", "hard"]
ProblemType = Literal["mcq", "coding", "subjective"]


class ProblemBase(BaseModel):
    model_config = ConfigDict(
        json_schema_extra={
            "examples": [
                {
                    "contestId": "507f1f77bcf86cd799439013",
                    "title": "Two Sum",
                    "description": "Find the two values that sum to the target.",
                    "difficulty": "easy",
                    "points": 100,
                }
            ]
        }
    )

    contestId: str
    title: str = Field(min_length=1, max_length=200)
    description: str = ""
    difficulty: Difficulty
    points: float = Field(gt=0)


class MCQProblemCreate(ProblemBase):
    model_config = ConfigDict(
        json_schema_extra={
            "examples": [
                {
                    "type": "mcq",
                    "contestId": "507f1f77bcf86cd799439013",
                    "title": "HTTP status",
                    "description": "Which status means the request succeeded?",
                    "difficulty": "easy",
                    "points": 10,
                    "options": ["200", "301", "404"],
                    "correctAnswer": "200",
                }
            ]
        }
    )

    type: Literal["mcq"] = "mcq"
    options: list[str] = Field(min_length=2)
    correctAnswer: str


class CodingTestCase(BaseModel):
    model_config = ConfigDict(
        json_schema_extra={"examples": [{"input": "2 3", "output": "5"}]}
    )

    input: str
    output: str


class CodingProblemCreate(ProblemBase):
    model_config = ConfigDict(
        json_schema_extra={
            "examples": [
                {
                    "type": "coding",
                    "contestId": "507f1f77bcf86cd799439013",
                    "title": "Add two numbers",
                    "description": "Read two integers and print their sum.",
                    "difficulty": "easy",
                    "points": 100,
                    "inputFormat": "Two space-separated integers.",
                    "constraints": "-10^9 <= a, b <= 10^9",
                    "testCases": [{"input": "2 3", "output": "5"}],
                }
            ]
        }
    )

    type: Literal["coding"] = "coding"
    inputFormat: str = ""
    constraints: str = ""
    testCases: list[CodingTestCase] = Field(min_length=1)


class SubjectiveProblemCreate(ProblemBase):
    model_config = ConfigDict(
        json_schema_extra={
            "examples": [
                {
                    "type": "subjective",
                    "contestId": "507f1f77bcf86cd799439013",
                    "title": "Explain eventual consistency",
                    "description": "Describe the concept and its trade-offs.",
                    "difficulty": "medium",
                    "points": 100,
                    "wordLimit": 500,
                    "evaluationRubric": "Define the concept and discuss one trade-off.",
                }
            ]
        }
    )

    type: Literal["subjective"] = "subjective"
    wordLimit: int = 500
    evaluationRubric: str


ProblemCreate = Annotated[
    MCQProblemCreate | CodingProblemCreate | SubjectiveProblemCreate,
    Field(discriminator="type"),
]


class ProblemUpdate(BaseModel):
    """Partial update; only fields relevant to the stored `type` should be sent."""

    model_config = ConfigDict(
        json_schema_extra={
            "examples": [{"title": "Revised problem title", "points": 120}]
        }
    )

    title: str | None = None
    description: str | None = None
    difficulty: Difficulty | None = None
    points: float | None = None
    options: list[str] | None = None
    correctAnswer: str | None = None
    inputFormat: str | None = None
    constraints: str | None = None
    testCases: list[CodingTestCase] | None = None
    wordLimit: int | None = None
    evaluationRubric: str | None = None


class ProblemOut(BaseModel):
    model_config = ConfigDict(
        json_schema_extra={
            "examples": [
                {
                    "id": "507f1f77bcf86cd799439014",
                    "contestId": "507f1f77bcf86cd799439013",
                    "type": "mcq",
                    "title": "HTTP status",
                    "description": "Which status means the request succeeded?",
                    "difficulty": "easy",
                    "points": 10,
                    "attemptCount": 3,
                    "createdAt": "2026-10-01T12:00:00Z",
                    "options": ["200", "301", "404"],
                    "correctAnswer": "200",
                }
            ]
        }
    )

    id: str
    contestId: str
    type: ProblemType
    title: str
    description: str = ""
    difficulty: Difficulty
    points: float
    attemptCount: float = 0
    createdAt: datetime
    # type-specific fields, present depending on `type`
    options: list[str] | None = None
    correctAnswer: str | None = None
    inputFormat: str | None = None
    constraints: str | None = None
    testCases: list[CodingTestCase] | None = None
    wordLimit: int | None = None
    evaluationRubric: str | None = None
