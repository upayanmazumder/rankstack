"""Global exception handlers map backend failures to correct HTTP statuses."""

from bson import ObjectId
from pymongo.errors import ConnectionFailure, DuplicateKeyError, WriteError
from redis.exceptions import ConnectionError as RedisConnectionError

from api.redis_ops import delete_session


class _BoomCollection:
    def __init__(self, exc: Exception):
        self._exc = exc

    def __getattr__(self, name):
        def raiser(*args, **kwargs):
            raise self._exc

        return raiser


class _BoomDB:
    """A fake `get_db()` return value whose every collection call raises."""

    def __init__(self, exc: Exception):
        self._exc = exc

    def __getitem__(self, name):
        return _BoomCollection(self._exc)


def test_redis_outage_returns_503_on_authenticated_routes(
    client, headers_for, monkeypatch
):
    headers = headers_for("participant")

    def unavailable(*args, **kwargs):
        raise RedisConnectionError("redis is down")

    monkeypatch.setattr("api.dependencies.redis_ops.get_session_user", unavailable)

    response = client.get("/teams", headers=headers)

    assert response.status_code == 503
    assert "Retry-After" in response.headers


def test_mongo_outage_returns_503(client, headers_for, monkeypatch):
    headers = headers_for("admin")
    monkeypatch.setattr(
        "api.routes.teams.get_db",
        lambda: _BoomDB(ConnectionFailure("mongo is unreachable")),
    )

    response = client.get("/teams", headers=headers)

    assert response.status_code == 503
    assert "Retry-After" in response.headers


def test_unhandled_duplicate_key_returns_409(client, headers_for, monkeypatch):
    headers = headers_for("admin")
    monkeypatch.setattr(
        "api.routes.teams.get_db",
        lambda: _BoomDB(DuplicateKeyError("E11000 duplicate key")),
    )

    response = client.get("/teams", headers=headers)

    assert response.status_code == 409


def test_schema_validation_write_error_returns_422(client, headers_for, monkeypatch):
    headers = headers_for("admin")
    monkeypatch.setattr(
        "api.routes.teams.get_db",
        lambda: _BoomDB(WriteError("Document failed validation", code=121)),
    )

    response = client.get("/teams", headers=headers)

    assert response.status_code == 422


def test_session_for_deleted_user_returns_401(client, db, users, headers_for):
    headers = headers_for("participant")
    token = headers["Authorization"].removeprefix("Bearer ")
    db.users.delete_one({"_id": ObjectId(users["participant"]["id"])})

    try:
        response = client.get("/sessions/current", headers=headers)

        assert response.status_code == 401
    finally:
        delete_session(token)


def test_aggregation_leaderboard_rejects_non_positive_limit(client):
    response = client.get(
        f"/aggregations/leaderboard/{ObjectId()}", params={"limit": 0}
    )

    assert response.status_code == 422
