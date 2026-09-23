"""Multi-document transactions shared by the API routes and the seed script.

Requires MongoDB running as a replica set (see docker-compose.yml); a
standalone `mongod` does not support `start_transaction()`.
"""

from typing import Any

from bson import ObjectId
from pymongo.database import Database

from api.models.common import utcnow


def create_submission(
    db: Database,
    contest_id: ObjectId,
    problem_id: ObjectId,
    submitted_by: dict[str, Any],
    answer: Any,
) -> dict[str, Any]:
    """Insert a submission and atomically bump the problem's `attemptCount`.

    Transaction #1: `submissions.insert_one` + `problems.update_one($inc)`.
    """
    client = db.client
    doc: dict[str, Any] = {
        "contestId": contest_id,
        "problemId": problem_id,
        "submittedBy": submitted_by,
        "answer": answer,
        "status": "pending",
        "score": 0,
        "submittedAt": utcnow(),
    }
    with client.start_session() as session:
        with session.start_transaction():
            result = db["submissions"].insert_one(doc, session=session)
            db["problems"].update_one(
                {"_id": problem_id}, {"$inc": {"attemptCount": 1}}, session=session
            )
    doc["_id"] = result.inserted_id
    return doc


def update_submission_status(
    db: Database, submission_id: ObjectId, status: str, score: float
) -> dict[str, Any] | None:
    """Update a submission's status/score and atomically apply the score delta
    to the submitter's cached `totalScore` (on `users` or `teams`).

    Transaction #2: `submissions.update_one` + `{users|teams}.update_one($inc)`.
    """
    client = db.client
    with client.start_session() as session:
        with session.start_transaction():
            existing = db["submissions"].find_one({"_id": submission_id}, session=session)
            if existing is None:
                return None
            delta = score - existing.get("score", 0)
            db["submissions"].update_one(
                {"_id": submission_id},
                {"$set": {"status": status, "score": score}},
                session=session,
            )
            submitted_by = existing["submittedBy"]
            target_collection = "users" if submitted_by["refType"] == "user" else "teams"
            db[target_collection].update_one(
                {"_id": submitted_by["refId"]}, {"$inc": {"totalScore": delta}}, session=session
            )
    existing["status"] = status
    existing["score"] = score
    return existing


def add_team_member(db: Database, team_id: ObjectId, user_id: ObjectId) -> dict[str, Any] | None:
    """Add a member to a team and atomically add the back-reference on the user.

    Transaction #3: `teams.update_one($addToSet)` + `users.update_one($addToSet)`.
    """
    client = db.client
    with client.start_session() as session:
        with session.start_transaction():
            team = db["teams"].find_one({"_id": team_id}, session=session)
            if team is None:
                return None
            db["teams"].update_one(
                {"_id": team_id}, {"$addToSet": {"memberIds": user_id}}, session=session
            )
            db["users"].update_one(
                {"_id": user_id}, {"$addToSet": {"teamIds": team_id}}, session=session
            )
    return db["teams"].find_one({"_id": team_id})


def remove_team_member(db: Database, team_id: ObjectId, user_id: ObjectId) -> dict[str, Any] | None:
    """Remove a member from a team and atomically drop the back-reference."""
    client = db.client
    with client.start_session() as session:
        with session.start_transaction():
            team = db["teams"].find_one({"_id": team_id}, session=session)
            if team is None:
                return None
            db["teams"].update_one(
                {"_id": team_id}, {"$pull": {"memberIds": user_id}}, session=session
            )
            db["users"].update_one(
                {"_id": user_id}, {"$pull": {"teamIds": team_id}}, session=session
            )
    return db["teams"].find_one({"_id": team_id})
