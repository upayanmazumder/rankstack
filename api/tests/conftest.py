"""Real MongoDB and Redis fixtures isolated from the application database."""

from uuid import uuid4

import pytest
from bson import ObjectId
from fastapi.testclient import TestClient

from api.config import settings
from api.db import get_mongo_client, get_redis_client, init_db
from api.main import app
from api.models.common import utcnow
from api.redis_ops import leaderboard_key, rate_limit_key
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
            contest_ids = {
                str(contest["_id"])
                for contest in database.contests.find({}, {"_id": 1})
            }
            keys = [rate_limit_key(user_id) for user_id in user_ids]
            for contest_id in contest_ids:
                keys.extend(
                    (leaderboard_key(contest_id), f"leaderboard_revision:{contest_id}")
                )
            keys.extend(
                key
                for key in redis.scan_iter("session:*")
                if redis.get(key) in user_ids
            )
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
    return {
        "title": "Integration contest",
        "description": "Isolated test contest",
        "startTime": "2026-10-10T09:00:00Z",
        "endTime": "2026-10-10T12:00:00Z",
        "createdBy": users["admin"]["id"],
    }


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
