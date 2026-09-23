"""Request/response models for the polymorphic `problems` collection.

`ProblemCreate` is a discriminated union on `type`; FastAPI validates the
right shape (mcq / coding / subjective) directly from the request body.
"""

from datetime import datetime
from typing import Annotated, Literal, Union

from pydantic import BaseModel, Field

Difficulty = Literal["easy", "medium", "hard"]
ProblemType = Literal["mcq", "coding", "subjective"]


class ProblemBase(BaseModel):
    contestId: str
    title: str = Field(min_length=1, max_length=200)
    description: str = ""
    difficulty: Difficulty
    points: float = Field(gt=0)


class MCQProblemCreate(ProblemBase):
    type: Literal["mcq"] = "mcq"
    options: list[str] = Field(min_length=2)
    correctAnswer: str


class CodingTestCase(BaseModel):
    input: str
    output: str


class CodingProblemCreate(ProblemBase):
    type: Literal["coding"] = "coding"
    inputFormat: str = ""
    constraints: str = ""
    testCases: list[CodingTestCase] = Field(min_length=1)


class SubjectiveProblemCreate(ProblemBase):
    type: Literal["subjective"] = "subjective"
    wordLimit: int = 500
    evaluationRubric: str


ProblemCreate = Annotated[
    Union[MCQProblemCreate, CodingProblemCreate, SubjectiveProblemCreate],
    Field(discriminator="type"),
]


class ProblemUpdate(BaseModel):
    """Partial update; only fields relevant to the stored `type` should be sent."""

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
