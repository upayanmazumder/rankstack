"""Real MongoDB and Redis fixtures isolated from the application database."""

from datetime import timedelta
from uuid import uuid4

import pytest
from bson import ObjectId
from fastapi.testclient import TestClient

from api.config import settings
from api.db import get_mongo_client, get_redis_client, init_db
from api.main import app
from api.models.common import utcnow
from api.redis_ops import (
    leaderboard_key,
    login_attempt_key,
    rate_limit_key,
    rate_limit_window_key,
    user_sessions_key,
)
from api.security import hash_password


@pytest.fixture
def db(monkeypatch):
    name = f"rankstack_test_{uuid4().hex}"
    monkeypatch.setattr(settings, "mongo_db", name)
    database = get_mongo_client()[name]
    try:
        init_db()
        yield database
    finally:
        try:
            redis = get_redis_client()
            user_ids = {
                str(user["_id"]) for user in database.users.find({}, {"_id": 1})
            }
            emails = {user["email"] for user in database.users.find({}, {"email": 1})}
            contest_ids = {
                str(contest["_id"])
                for contest in database.contests.find({}, {"_id": 1})
            }
            keys = [rate_limit_key(user_id) for user_id in user_ids]
            keys.extend(rate_limit_window_key(user_id) for user_id in user_ids)
            keys.extend(user_sessions_key(user_id) for user_id in user_ids)
            for contest_id in contest_ids:
                keys.extend(
                    (leaderboard_key(contest_id), f"leaderboard_revision:{contest_id}")
                )
            keys.extend(
                key
                for key in redis.scan_iter("session:*")
                if redis.get(key) in user_ids
            )
            # TestClient always reports this fixed host, regardless of test;
            # scoped to known test emails plus that one shared IP bucket,
            # never a blanket scan of every login_attempts:* key in Redis.
            keys.extend(
                login_attempt_key(f"email:{email.strip().lower()[:254]}")
                for email in emails
            )
            keys.append(login_attempt_key("ip:testclient"))
            if keys:
                redis.delete(*keys)
        finally:
            get_mongo_client().drop_database(name)


@pytest.fixture
def client(db):
    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture
def users(db):
    password = "Passw0rd!"
    password_hash = hash_password(password)
    accounts = {}
    for role in ("participant", "admin", "other"):
        account_role = "admin" if role == "admin" else "participant"
        user_id = db.users.insert_one(
            {
                "name": role.title(),
                "email": f"{role}-{uuid4().hex}@example.test",
                "passwordHash": password_hash,
                "role": account_role,
                "totalScore": 0,
                "teamIds": [],
                "createdAt": utcnow(),
            }
        ).inserted_id
        accounts[role] = {
            "id": str(user_id),
            "email": db.users.find_one({"_id": user_id})["email"],
            "password": password,
        }
    return accounts


@pytest.fixture
def headers_for(client, users):
    def login(role):
        account = users[role]
        response = client.post(
            "/sessions",
            json={"email": account["email"], "password": account["password"]},
        )
        assert response.status_code == 201, response.text
        return {"Authorization": f"Bearer {response.json()['sessionId']}"}

    return login


@pytest.fixture
def contest_payload(users):
    now = utcnow()
    return {
        "title": "Integration contest",
        "description": "Isolated test contest",
        "startTime": (now - timedelta(hours=1)).isoformat(),
        "endTime": (now + timedelta(hours=1)).isoformat(),
        "createdBy": users["admin"]["id"],
    }


@pytest.fixture
def live_contest(client, users, headers_for, contest_payload):
    """Create a contest, set it live, and join the participant."""

    def make(extra_participants=()):
        admin = headers_for("admin")
        contest = client.post("/contests", json=contest_payload, headers=admin).json()
        contest_id = contest["id"]
        client.patch(
            f"/contests/{contest_id}/status",
            json={"status": "live"},
            headers=admin,
        )
        client.post(
            f"/contests/{contest_id}/participants",
            json={"refType": "user", "refId": users["participant"]["id"]},
            headers=headers_for("participant"),
        )
        for ref_type, ref_id in extra_participants:
            client.post(
                f"/contests/{contest_id}/participants",
                json={"refType": ref_type, "refId": ref_id},
                headers=admin,
            )
        return contest_id

    return make


@pytest.fixture
def mcq_problem(db):
    def create(contest_id):
        return db.problems.insert_one(
            {
                "contestId": ObjectId(contest_id),
                "type": "mcq",
                "title": "A question",
                "description": "Choose A",
                "difficulty": "easy",
                "points": 10,
                "options": ["A", "B"],
                "correctAnswer": "A",
                "attemptCount": 0,
                "createdAt": utcnow(),
            }
        ).inserted_id

    return create
