"""Multi-document transactions shared by the API routes and the seed script.

Requires MongoDB running as a replica set (see docker-compose.yml); a
standalone `mongod` does not support `start_transaction()`.
"""

from collections.abc import Callable
from datetime import timezone
from typing import Any, TypeVar

from bson import ObjectId
from fastapi import HTTPException
from pymongo.client_session import ClientSession
from pymongo.database import Database
from redis.exceptions import RedisError

from api import redis_ops
from api.models.common import utcnow

T = TypeVar("T")


def run_in_transaction(db: Database, callback: Callable[[ClientSession], T]) -> T:
    """Run `callback(session)` inside a transaction, retrying
    `TransientTransactionError` and `UnknownTransactionCommitResult` per
    MongoDB's recommended `with_transaction` retry loop. Every service
    transaction goes through this helper instead of a bare
    `start_transaction()`, so a WriteConflict from concurrent requests no
    longer surfaces as a 500."""
    with db.client.start_session() as session:
        return session.with_transaction(callback)


def create_problem(
    db: Database, contest_id: ObjectId, doc: dict[str, Any]
) -> dict[str, Any] | None:
    """Insert a problem and its contest reference in one transaction."""

    def callback(session: ClientSession) -> ObjectId | None:
        if (
            db["contests"].find_one({"_id": contest_id}, {"_id": 1}, session=session)
            is None
        ):
            return None
        result = db["problems"].insert_one(doc, session=session)
        db["contests"].update_one(
            {"_id": contest_id},
            {"$addToSet": {"problemIds": result.inserted_id}},
            session=session,
        )
        return result.inserted_id

    inserted_id = run_in_transaction(db, callback)
    if inserted_id is None:
        return None
    doc["_id"] = inserted_id
    return doc


def validate_submission_problem(
    db: Database,
    contest_id: ObjectId,
    problem_id: ObjectId,
    answer: Any,
    session=None,
) -> None:
    """Reject missing, unrelated, or invalid MCQ problem references."""
    problem = db["problems"].find_one(
        {"_id": problem_id},
        {"contestId": 1, "type": 1, "options": 1},
        session=session,
    )
    if problem is None:
        raise HTTPException(status_code=404, detail="Problem not found")
    if problem["contestId"] != contest_id:
        raise HTTPException(
            status_code=400, detail="Problem does not belong to contest"
        )
    if problem["type"] == "mcq" and (
        not isinstance(answer, str) or answer not in problem["options"]
    ):
        raise HTTPException(
            status_code=400, detail="Answer must match a problem option"
        )


def assert_contest_open_for(
    db: Database,
    contest_id: ObjectId,
    submitted_by: dict[str, Any],
    session=None,
) -> None:
    """Reject unless the contest is live, inside its time window, and the
    submitter has joined as a participant."""
    contest = db["contests"].find_one(
        {"_id": contest_id},
        {"status": 1, "startTime": 1, "endTime": 1, "participants": 1},
        session=session,
    )
    if contest is None:
        raise HTTPException(status_code=404, detail="Contest not found")
    now = utcnow()
    start, end = contest["startTime"], contest["endTime"]
    if start.tzinfo is None:
        start = start.replace(tzinfo=timezone.utc)
    if end.tzinfo is None:
        end = end.replace(tzinfo=timezone.utc)
    if contest["status"] != "live" or not (start <= now <= end):
        raise HTTPException(status_code=409, detail="Contest is not live")
    is_participant = any(
        participant["refType"] == submitted_by["refType"]
        and participant["refId"] == submitted_by["refId"]
        for participant in contest.get("participants", [])
    )
    if not is_participant:
        raise HTTPException(
            status_code=403, detail="Submitter has not joined this contest"
        )


def _insert_submission_and_bump_attempt_count(
    db: Database,
    session: ClientSession,
    contest_id: ObjectId,
    problem_id: ObjectId,
    answer: Any,
    doc: dict[str, Any],
) -> ObjectId:
    """Shared by `create_submission` and `create_seeded_submission`: validate
    the problem, insert the submission, and bump `problems.attemptCount`,
    all inside the caller's transaction."""
    validate_submission_problem(db, contest_id, problem_id, answer, session=session)
    result = db["submissions"].insert_one(doc, session=session)
    db["problems"].update_one(
        {"_id": problem_id}, {"$inc": {"attemptCount": 1}}, session=session
    )
    return result.inserted_id


def create_submission(
    db: Database,
    contest_id: ObjectId,
    problem_id: ObjectId,
    submitted_by: dict[str, Any],
    answer: Any,
) -> dict[str, Any]:
    """Insert a submission and atomically bump the problem's `attemptCount`.

    Transaction #1: `submissions.insert_one` + `problems.update_one($inc)`.
    Rejects via `assert_contest_open_for` unless the contest is live, inside
    its time window, and the submitter has joined it.
    """
    doc: dict[str, Any] = {
        "contestId": contest_id,
        "problemId": problem_id,
        "submittedBy": submitted_by,
        "answer": answer,
        "status": "pending",
        "score": 0,
        "submittedAt": utcnow(),
    }

    def callback(session: ClientSession) -> ObjectId:
        assert_contest_open_for(db, contest_id, submitted_by, session=session)
        return _insert_submission_and_bump_attempt_count(
            db, session, contest_id, problem_id, answer, doc
        )

    doc["_id"] = run_in_transaction(db, callback)
    return doc


def create_seeded_submission(
    db: Database,
    contest_id: ObjectId,
    problem_id: ObjectId,
    submitted_by: dict[str, Any],
    answer: Any,
) -> dict[str, Any]:
    """Insert a submission and atomically bump the problem's `attemptCount`,
    skipping the live-contest/participation gate in `assert_contest_open_for`.

    For `scripts/seed.py` only, to backfill history on ended contests: a
    real-time request must go through `create_submission` instead, whose
    gate correctly rejects a submission to a contest that is not live. No
    API route calls this.
    """
    doc: dict[str, Any] = {
        "contestId": contest_id,
        "problemId": problem_id,
        "submittedBy": submitted_by,
        "answer": answer,
        "status": "pending",
        "score": 0,
        "submittedAt": utcnow(),
    }

    def callback(session: ClientSession) -> ObjectId:
        return _insert_submission_and_bump_attempt_count(
            db, session, contest_id, problem_id, answer, doc
        )

    doc["_id"] = run_in_transaction(db, callback)
    return doc


def update_submission_status(
    db: Database, submission_id: ObjectId, status: str, score: float
) -> tuple[dict[str, Any], float] | None:
    """Update a submission's status/score and atomically apply the score delta
    to the submitter's cached `totalScore` (on `users` or `teams`).

    Transaction #2: `submissions.update_one` + `{users|teams}.update_one($inc)`.
    Returns `(updated submission, score delta)`, or `None` if the submission
    was deleted before this transaction could read it. The delta is
    computed inside the (possibly retried) transaction, not from a caller's
    pre-read, so a retried attempt can never apply a stale delta to Redis.
    """
    result: dict[str, Any] = {}

    def callback(session: ClientSession) -> None:
        existing = db["submissions"].find_one({"_id": submission_id}, session=session)
        if existing is None:
            result["existing"] = None
            return
        delta = score - existing.get("score", 0)
        db["submissions"].update_one(
            {"_id": submission_id},
            {"$set": {"status": status, "score": score}},
            session=session,
        )
        submitted_by = existing["submittedBy"]
        target_collection = "users" if submitted_by["refType"] == "user" else "teams"
        db[target_collection].update_one(
            {"_id": submitted_by["refId"]},
            {"$inc": {"totalScore": delta}},
            session=session,
        )
        if delta != 0:
            # Upsert, not a plain update: without a pre-existing marker the
            # contest's very first grade must still mint a revision so
            # get_leaderboard's rebuild and the direct Redis write in
            # api.routes.submissions.update_status can coordinate on it
            # (see redis_ops.update_leaderboard_score).
            db["dirty_leaderboards"].update_one(
                {"_id": existing["contestId"]},
                {"$inc": {"version": 1}},
                upsert=True,
                session=session,
            )
        result["existing"] = existing
        result["delta"] = delta

    run_in_transaction(db, callback)
    existing = result["existing"]
    if existing is None:
        return None
    existing["status"] = status
    existing["score"] = score
    return existing, result["delta"]


def create_team(db: Database, name: str, member_ids: list[ObjectId]) -> dict[str, Any]:
    """Create a team and add the back-reference on every member, atomically.

    Rejects member IDs that do not exist. The first ID is the owner.
    """
    doc: dict[str, Any] = {
        "name": name,
        "memberIds": member_ids,
        "ownerId": member_ids[0],
        "totalScore": 0,
        "createdAt": utcnow(),
    }

    def callback(session: ClientSession) -> ObjectId:
        existing_count = db["users"].count_documents(
            {"_id": {"$in": member_ids}}, session=session
        )
        if existing_count != len(set(member_ids)):
            raise HTTPException(
                status_code=400, detail="One or more member IDs do not exist"
            )
        result = db["teams"].insert_one(doc, session=session)
        db["users"].update_many(
            {"_id": {"$in": member_ids}},
            {"$addToSet": {"teamIds": result.inserted_id}},
            session=session,
        )
        return result.inserted_id

    doc["_id"] = run_in_transaction(db, callback)
    return doc


def add_team_member(
    db: Database, team_id: ObjectId, user_id: ObjectId
) -> dict[str, Any] | None:
    """Add a member to a team and atomically add the back-reference on the user.

    Transaction #3: `teams.update_one($addToSet)` + `users.update_one($addToSet)`.
    """

    def callback(session: ClientSession) -> bool:
        team = db["teams"].find_one({"_id": team_id}, session=session)
        if team is None:
            return False
        db["teams"].update_one(
            {"_id": team_id}, {"$addToSet": {"memberIds": user_id}}, session=session
        )
        db["users"].update_one(
            {"_id": user_id}, {"$addToSet": {"teamIds": team_id}}, session=session
        )
        return True

    if not run_in_transaction(db, callback):
        return None
    return db["teams"].find_one({"_id": team_id})


class LastTeamMemberError(Exception):
    """Raised when a removal would leave a team without members."""


def remove_team_member(
    db: Database, team_id: ObjectId, user_id: ObjectId
) -> dict[str, Any] | None:
    """Remove a member from a team and atomically drop the back-reference.

    If the departing member is the owner, ownership passes to another
    remaining member so the team is never left owned by a non-member.
    """

    def callback(session: ClientSession) -> bool:
        team = db["teams"].find_one({"_id": team_id}, session=session)
        if team is None:
            return False
        member_ids = team.get("memberIds", [])
        if user_id in member_ids and len(member_ids) == 1:
            raise LastTeamMemberError
        update: dict[str, Any] = {"$pull": {"memberIds": user_id}}
        if team.get("ownerId") == user_id:
            remaining = [member_id for member_id in member_ids if member_id != user_id]
            if remaining:
                update["$set"] = {"ownerId": remaining[0]}
        db["teams"].update_one({"_id": team_id}, update, session=session)
        db["users"].update_one(
            {"_id": user_id}, {"$pull": {"teamIds": team_id}}, session=session
        )
        return True

    if not run_in_transaction(db, callback):
        return None
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


def delete_team_transaction(
    db: Database, team_id: ObjectId, *, require_empty: bool = False
) -> dict[str, Any] | None:
    """Delete a team and its submissions and references atomically.

    When `require_empty` is set, the deletion is skipped (returning
    `None`) if the team has gained a member since the caller decided to
    delete it, closing the race where an admin adds a member between
    that decision and this transaction running.
    """
    captured: dict[str, Any] = {}

    def callback(session: ClientSession) -> dict[str, Any] | None:
        team = db["teams"].find_one({"_id": team_id}, session=session)
        if team is None:
            return None
        if require_empty and team.get("memberIds"):
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
        captured["contest_ids"] = contest_ids
        return team

    team = run_in_transaction(db, callback)
    if team is None:
        return None
    try:
        for contest_id in captured["contest_ids"]:
            redis_ops.remove_leaderboard_member(str(contest_id), str(team_id))
    except RedisError:
        pass  # MongoDB serves this leaderboard until Redis is available again.
    return team


def delete_user_transaction(db: Database, user_id: ObjectId) -> dict[str, Any] | None:
    """Delete a user and scrub every reference to them, atomically: their
    own submissions (with score and attempt-count reversal), team
    membership, and contest participation.

    A team left with zero members is also deleted, in a second transaction
    after this one commits, reusing `delete_team_transaction`'s own
    submission/leaderboard cascade. This is the documented choice for
    issue #227: an empty team is deleted rather than kept memberless.
    """
    with db.client.start_session() as session:  # noqa: SIM117
        with session.start_transaction():
            user = db["users"].find_one({"_id": user_id}, session=session)
            if user is None:
                return None
            own_submissions = list(
                db["submissions"].find(
                    {"submittedBy.refType": "user", "submittedBy.refId": user_id},
                    session=session,
                )
            )
            for submission in own_submissions:
                db["problems"].update_one(
                    {"_id": submission["problemId"]},
                    {"$inc": {"attemptCount": -1}},
                    session=session,
                )
            _reverse_submission_scores(db, own_submissions, session)
            db["submissions"].delete_many(
                {"submittedBy.refType": "user", "submittedBy.refId": user_id},
                session=session,
            )
            affected_teams = list(
                db["teams"].find(
                    {"memberIds": user_id}, {"memberIds": 1}, session=session
                )
            )
            db["teams"].update_many(
                {"memberIds": user_id},
                {"$pull": {"memberIds": user_id}},
                session=session,
            )
            emptied_team_ids = [
                team["_id"] for team in affected_teams if team["memberIds"] == [user_id]
            ]
            db["contests"].update_many(
                {"participants.refType": "user", "participants.refId": user_id},
                {"$pull": {"participants": {"refType": "user", "refId": user_id}}},
                session=session,
            )
            contest_ids = {submission["contestId"] for submission in own_submissions}
            _mark_leaderboards_dirty(db, contest_ids, session)
            db["users"].delete_one({"_id": user_id}, session=session)
    for team_id in emptied_team_ids:
        delete_team_transaction(db, team_id, require_empty=True)
    try:
        for contest_id in contest_ids:
            redis_ops.remove_leaderboard_member(str(contest_id), str(user_id))
    except RedisError:
        pass  # MongoDB serves this leaderboard until Redis is available again.
    try:
        redis_ops.revoke_user_sessions(str(user_id))
    except RedisError:
        pass  # The account is already deleted; sessions expire on their own TTL.
    return user


def delete_contest_transaction(
    db: Database, contest_id: ObjectId
) -> dict[str, Any] | None:
    """Delete a contest and its problems and submissions atomically."""

    def callback(session: ClientSession) -> dict[str, Any] | None:
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
        return contest

    contest = run_in_transaction(db, callback)
    if contest is None:
        return None
    try:
        redis_ops.delete_leaderboard(str(contest_id))
    except RedisError:
        pass
    return contest


def delete_problem_transaction(
    db: Database, problem_id: ObjectId
) -> dict[str, Any] | None:
    """Delete a problem, its submissions, and its contest reference atomically."""
    captured: dict[str, Any] = {}

    def callback(session: ClientSession) -> dict[str, Any] | None:
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
        captured["submissions"] = submissions
        return problem

    problem = run_in_transaction(db, callback)
    if problem is None:
        return None
    try:
        _remove_submission_scores(captured["submissions"])
    except RedisError:
        pass
    return problem


def delete_submission_transaction(
    db: Database, submission_id: ObjectId
) -> dict[str, Any] | None:
    """Delete a submission and reverse its score and attempt count atomically."""

    def callback(session: ClientSession) -> dict[str, Any] | None:
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
        return submission

    submission = run_in_transaction(db, callback)
    if submission is None:
        return None
    try:
        _remove_submission_scores([submission])
    except RedisError:
        pass
    return submission
