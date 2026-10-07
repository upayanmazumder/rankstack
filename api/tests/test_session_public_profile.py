import unittest
from unittest.mock import patch

from bson import ObjectId
from fastapi import FastAPI
from fastapi.testclient import TestClient

from api.routes import sessions


class Users:
    def find_one(self, query):
        return {
            "_id": query["_id"],
            "name": "Sample User",
            "email": "sample@example.com",
            "role": "participant",
            "totalScore": 0,
            "teamIds": [],
            "createdAt": "2026-10-07T00:00:00Z",
            "passwordHash": "sensitive-verifier",
        }


class Database:
    def __getitem__(self, name):
        assert name == "users"
        return Users()


class SessionProfileTests(unittest.TestCase):
    def test_session_profile_excludes_password_verifier(self):
        user_id = str(ObjectId())
        app = FastAPI()
        app.include_router(sessions.router)
        with (
            patch.object(sessions.redis_ops, "get_session_user", return_value=user_id),
            patch.object(sessions.redis_ops, "touch_session"),
            patch.object(sessions, "get_db", return_value=Database()),
            TestClient(app) as client,
        ):
            response = client.get("/sessions/session-token")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["user"]["id"], user_id)
        self.assertNotIn("passwordHash", response.json()["user"])
