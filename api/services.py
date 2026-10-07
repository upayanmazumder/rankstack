"""Multi-document transactions shared by the API routes and the seed script.

Requires MongoDB running as a replica set (see docker-compose.yml); a
standalone `mongod` does not support `start_transaction()`.
"""

from typing import Any

from bson import ObjectId
from pymongo.database import Database
from redis.exceptions import RedisError

from api import redis_ops
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
            if delta != 0:
                db["dirty_leaderboards"].update_one(
                    {"_id": existing["contestId"]},
                    {"$inc": {"version": 1}},
                    session=session,
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


class LastTeamMemberError(Exception):
    """Raised when a removal would leave a team without members."""


def remove_team_member(db: Database, team_id: ObjectId, user_id: ObjectId) -> dict[str, Any] | None:
    """Remove a member from a team and atomically drop the back-reference."""
    client = db.client
    with client.start_session() as session:
        with session.start_transaction():
            team = db["teams"].find_one({"_id": team_id}, session=session)
            if team is None:
                return None
            member_ids = team.get("memberIds", [])
            if user_id in member_ids and len(member_ids) == 1:
                raise LastTeamMemberError
            db["teams"].update_one(
                {"_id": team_id}, {"$pull": {"memberIds": user_id}}, session=session
            )
            db["users"].update_one(
                {"_id": user_id}, {"$pull": {"teamIds": team_id}}, session=session
            )
    return db["teams"].find_one({"_id": team_id})


def _reverse_submission_scores(
    db: Database, submissions: list[dict[str, Any]], session
) -> None:
    for submission in submissions:
        score = submission.get("score", 0)
        if score == 0:
            continue
        submitter = submission["submittedBy"]
        collection = "users" if submitter["refType"] == "user" else "teams"
        db[collection].update_one(
            {"_id": submitter["refId"]},
            {"$inc": {"totalScore": -score}},
            session=session,
        )


def _remove_submission_scores(submissions: list[dict[str, Any]]) -> None:
    for submission in submissions:
        score = submission.get("score", 0)
        if score == 0:
            continue
        submitter = submission["submittedBy"]
        redis_ops.decrement_existing_leaderboard_score(
            str(submission["contestId"]),
            str(submitter["refId"]),
            score,
        )



def _mark_leaderboards_dirty(db: Database, contest_ids: set[ObjectId], session) -> None:
    """Record cleanup work in the same transaction as each deletion."""
    for contest_id in contest_ids:
        db["dirty_leaderboards"].update_one(
            {"_id": contest_id},
            {"$set": {"dirty": True}, "$inc": {"version": 1}},
            upsert=True,
            session=session,
        )

def delete_team_transaction(db: Database, team_id: ObjectId) -> dict[str, Any] | None:
    """Delete a team and its submissions and references atomically."""
    with db.client.start_session() as session:  # noqa: SIM117
        with session.start_transaction():
            team = db["teams"].find_one({"_id": team_id}, session=session)
            if team is None:
                return None
            contest_docs = list(
                db["contests"].find(
                    {"participants.refType": "team", "participants.refId": team_id},
                    {"_id": 1},
                    session=session,
                )
            )
            submissions = list(
                db["submissions"].find(
                    {"submittedBy.refType": "team", "submittedBy.refId": team_id},
                    {"contestId": 1, "problemId": 1},
                    session=session,
                )
            )
            for submission in submissions:
                db["problems"].update_one(
                    {"_id": submission["problemId"]},
                    {"$inc": {"attemptCount": -1}},
                    session=session,
                )
            db["submissions"].delete_many(
                {"submittedBy.refType": "team", "submittedBy.refId": team_id},
                session=session,
            )
            db["users"].update_many(
                {"teamIds": team_id}, {"$pull": {"teamIds": team_id}}, session=session
            )
            db["contests"].update_many(
                {"participants.refType": "team", "participants.refId": team_id},
                {"$pull": {"participants": {"refType": "team", "refId": team_id}}},
                session=session,
            )
            db["teams"].delete_one({"_id": team_id}, session=session)
            contest_ids = {doc["_id"] for doc in contest_docs}
            contest_ids.update(submission["contestId"] for submission in submissions)
            _mark_leaderboards_dirty(db, contest_ids, session)
    try:
        for contest_id in contest_ids:
            redis_ops.remove_leaderboard_member(str(contest_id), str(team_id))
    except RedisError:
        pass  # MongoDB serves this leaderboard until Redis is available again.
    return team

def delete_contest_transaction(
    db: Database, contest_id: ObjectId
) -> dict[str, Any] | None:
    """Delete a contest and its problems and submissions atomically."""
    with db.client.start_session() as session:  # noqa: SIM117
        with session.start_transaction():
            contest = db["contests"].find_one({"_id": contest_id}, session=session)
            if contest is None:
                return None
            submissions = list(
                db["submissions"].find({"contestId": contest_id}, session=session)
            )
            _reverse_submission_scores(db, submissions, session)
            db["submissions"].delete_many({"contestId": contest_id}, session=session)
            db["problems"].delete_many({"contestId": contest_id}, session=session)
            db["contests"].delete_one({"_id": contest_id}, session=session)
            _mark_leaderboards_dirty(db, {contest_id}, session)
    try:
        redis_ops.delete_leaderboard(str(contest_id))
    except RedisError:
        pass
    return contest


def delete_problem_transaction(
    db: Database, problem_id: ObjectId
) -> dict[str, Any] | None:
    """Delete a problem, its submissions, and its contest reference atomically."""
    with db.client.start_session() as session:  # noqa: SIM117
        with session.start_transaction():
            problem = db["problems"].find_one({"_id": problem_id}, session=session)
            if problem is None:
                return None
            submissions = list(
                db["submissions"].find({"problemId": problem_id}, session=session)
            )
            _reverse_submission_scores(db, submissions, session)
            db["submissions"].delete_many({"problemId": problem_id}, session=session)
            db["contests"].update_one(
                {"_id": problem["contestId"]},
                {"$pull": {"problemIds": problem_id}},
                session=session,
            )
            db["problems"].delete_one({"_id": problem_id}, session=session)
            _mark_leaderboards_dirty(db, {problem["contestId"]}, session)
    try:
        _remove_submission_scores(submissions)
    except RedisError:
        pass
    return problem


def delete_submission_transaction(
    db: Database, submission_id: ObjectId
) -> dict[str, Any] | None:
    """Delete a submission and reverse its score and attempt count atomically."""
    with db.client.start_session() as session:  # noqa: SIM117
        with session.start_transaction():
            submission = db["submissions"].find_one({"_id": submission_id}, session=session)
            if submission is None:
                return None
            db["problems"].update_one(
                {"_id": submission["problemId"]},
                {"$inc": {"attemptCount": -1}},
                session=session,
            )
            _reverse_submission_scores(db, [submission], session)
            db["submissions"].delete_one({"_id": submission_id}, session=session)
            _mark_leaderboards_dirty(db, {submission["contestId"]}, session)
    try:
        _remove_submission_scores([submission])
    except RedisError:
        pass
    return submission


