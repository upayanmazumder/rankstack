"""The 5 required aggregation pipelines, as plain callables plus a FastAPI
router exposing each as a GET endpoint with visible JSON output.
"""

from typing import Annotated

from fastapi import APIRouter, Path, Query

from api.db import get_db
from api.models.common import oid, serialize_value

router = APIRouter(prefix="/aggregations", tags=["aggregations"])


def leaderboard_for_contest(db, contest_id, limit: int = 10) -> list[dict]:
    """1. Leaderboard for a contest: group submissions by submitter, sum score, sort desc."""
    pipeline = [
        {"$match": {"contestId": contest_id}},
        {
            "$group": {
                "_id": {
                    "refId": "$submittedBy.refId",
                    "refType": "$submittedBy.refType",
                },
                "totalScore": {"$sum": "$score"},
                "submissionCount": {"$sum": 1},
            }
        },
        {"$sort": {"totalScore": -1}},
        {"$limit": limit},
        {
            "$project": {
                "_id": 0,
                "refId": "$_id.refId",
                "refType": "$_id.refType",
                "totalScore": 1,
                "submissionCount": 1,
            }
        },
    ]
    return list(db["submissions"].aggregate(pipeline))


def avg_score_per_problem_by_difficulty(db) -> list[dict]:
    """2. Average submission score per problem, grouped by problem difficulty."""
    pipeline = [
        {"$group": {"_id": "$problemId", "avgScore": {"$avg": "$score"}}},
        {
            "$lookup": {
                "from": "problems",
                "localField": "_id",
                "foreignField": "_id",
                "as": "problem",
            }
        },
        {"$unwind": "$problem"},
        {
            "$group": {
                "_id": "$problem.difficulty",
                "avgScorePerProblem": {"$avg": "$avgScore"},
                "problemCount": {"$sum": 1},
            }
        },
        {"$sort": {"_id": 1}},
        {
            "$project": {
                "_id": 0,
                "difficulty": "$_id",
                "avgScorePerProblem": 1,
                "problemCount": 1,
            }
        },
    ]
    return list(db["submissions"].aggregate(pipeline))


def submission_count_by_status_per_contest(db) -> list[dict]:
    """3. Submission count by status, per contest."""
    pipeline = [
        {
            "$group": {
                "_id": {"contestId": "$contestId", "status": "$status"},
                "count": {"$sum": 1},
            }
        },
        {
            "$group": {
                "_id": "$_id.contestId",
                "statusCounts": {"$push": {"status": "$_id.status", "count": "$count"}},
            }
        },
        {
            "$lookup": {
                "from": "contests",
                "localField": "_id",
                "foreignField": "_id",
                "as": "contest",
            }
        },
        {"$unwind": "$contest"},
        {
            "$project": {
                "_id": 0,
                "contestId": "$_id",
                "title": "$contest.title",
                "statusCounts": 1,
            }
        },
        {"$sort": {"title": 1}},
    ]
    return list(db["submissions"].aggregate(pipeline))


def distinct_problems_solved_per_user(db) -> list[dict]:
    """4. Number of distinct problems solved (status=correct) per user, across all contests."""
    pipeline = [
        {"$match": {"status": "correct", "submittedBy.refType": "user"}},
        {
            "$group": {
                "_id": "$submittedBy.refId",
                "problemsSolved": {"$addToSet": "$problemId"},
            }
        },
        {
            "$project": {
                "_id": 0,
                "userId": "$_id",
                "distinctProblemsSolved": {"$size": "$problemsSolved"},
            }
        },
        {
            "$lookup": {
                "from": "users",
                "localField": "userId",
                "foreignField": "_id",
                "as": "user",
            }
        },
        {"$unwind": "$user"},
        {"$project": {"userId": 1, "name": "$user.name", "distinctProblemsSolved": 1}},
        {"$sort": {"distinctProblemsSolved": -1}},
    ]
    return list(db["submissions"].aggregate(pipeline))


def team_performance(db) -> list[dict]:
    """5. Team performance: $lookup teams -> submissions via member ids, aggregate total score."""
    pipeline = [
        {
            "$lookup": {
                "from": "submissions",
                "let": {"memberIds": "$memberIds"},
                "pipeline": [
                    {
                        "$match": {
                            "$expr": {
                                "$and": [
                                    {"$eq": ["$submittedBy.refType", "user"]},
                                    {"$in": ["$submittedBy.refId", "$$memberIds"]},
                                ]
                            }
                        }
                    }
                ],
                "as": "memberSubmissions",
            }
        },
        {
            "$addFields": {
                "totalScore": {"$sum": "$memberSubmissions.score"},
                "submissionCount": {"$size": "$memberSubmissions"},
                "memberCount": {"$size": "$memberIds"},
            }
        },
        {
            "$project": {
                "name": 1,
                "memberCount": 1,
                "totalScore": 1,
                "submissionCount": 1,
            }
        },
        {"$sort": {"totalScore": -1}},
    ]
    return list(db["teams"].aggregate(pipeline))


def _serialize_rows(rows: list[dict]) -> list[dict]:
    return [serialize_value(r) for r in rows]


@router.get(
    "/leaderboard/{contest_id}",
    summary="Aggregate a contest leaderboard",
    description="Group submissions by user or team, sum scores, and return the top-ranked participants. `limit` defaults to 10. Returns 200; errors: 400 for an invalid contest ID.",
    responses={
        200: {
            "content": {
                "application/json": {
                    "example": [
                        {
                            "refId": "507f1f77bcf86cd799439011",
                            "refType": "user",
                            "totalScore": 250,
                            "submissionCount": 4,
                        }
                    ]
                }
            }
        }
    },
)
def api_leaderboard(
    contest_id: Annotated[
        str, Path(description="Unique ID of the contest to aggregate.")
    ],
    limit: int = Query(
        default=10, description="Maximum ranked participants to return."
    ),
):
    """Aggregate scored submissions into a ranked contest leaderboard."""
    db = get_db()
    return _serialize_rows(leaderboard_for_contest(db, oid(contest_id), limit))


@router.get(
    "/avg-score-by-difficulty",
    summary="Get average score by difficulty",
    description="Return average awarded score grouped by problem difficulty. Returns 200.",
    responses={
        200: {
            "content": {
                "application/json": {
                    "example": [
                        {
                            "difficulty": "easy",
                            "avgScorePerProblem": 85.0,
                            "problemCount": 12,
                        }
                    ]
                }
            }
        }
    },
)
def api_avg_score_by_difficulty():
    """Aggregate average submission scores by problem difficulty."""
    db = get_db()
    return _serialize_rows(avg_score_per_problem_by_difficulty(db))


@router.get(
    "/submission-status-by-contest",
    summary="Get submission statuses by contest",
    description="Return submission counts grouped by contest and evaluation status. Returns 200.",
    responses={
        200: {
            "content": {
                "application/json": {
                    "example": [
                        {
                            "contestId": "507f1f77bcf86cd799439013",
                            "title": "Spring Code Challenge",
                            "statusCounts": [
                                {"status": "correct", "count": 18},
                                {"status": "pending", "count": 2},
                            ],
                        }
                    ]
                }
            }
        }
    },
)
def api_submission_status_by_contest():
    """Aggregate submission counts by contest and status."""
    db = get_db()
    return _serialize_rows(submission_count_by_status_per_contest(db))


@router.get(
    "/problems-solved-per-user",
    summary="Get solved problem counts by user",
    description="Return the number of distinct problems solved by each user. Returns 200.",
    responses={
        200: {
            "content": {
                "application/json": {
                    "example": [
                        {
                            "userId": "507f1f77bcf86cd799439011",
                            "name": "Ada Lovelace",
                            "distinctProblemsSolved": 7,
                        }
                    ]
                }
            }
        }
    },
)
def api_problems_solved_per_user():
    """Aggregate distinct solved-problem counts for each user."""
    db = get_db()
    return _serialize_rows(distinct_problems_solved_per_user(db))


@router.get(
    "/team-performance",
    summary="Get team performance",
    description="Return team scores and submission performance metrics. Returns 200.",
    responses={
        200: {
            "content": {
                "application/json": {
                    "example": [
                        {
                            "_id": "507f1f77bcf86cd799439015",
                            "name": "Runtime Terrors",
                            "memberCount": 3,
                            "totalScore": 340,
                            "submissionCount": 9,
                        }
                    ]
                }
            }
        }
    },
)
def api_team_performance():
    """Aggregate team score and submission performance metrics."""
    db = get_db()
    return _serialize_rows(team_performance(db))
