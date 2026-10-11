"""/health stays up during an outage; /health/ready reflects dependency state."""

from pymongo.errors import ConnectionFailure
from redis.exceptions import RedisError


class _BoomDB:
    def command(self, *args, **kwargs):
        raise ConnectionFailure("mongo is unreachable")


class _BoomRedis:
    def ping(self):
        raise RedisError("redis is down")


def test_health_ready_ok_when_dependencies_are_up(client):
    assert client.get("/health").status_code == 200
    assert client.get("/health/ready").json() == {"status": "ok"}


def test_health_ready_returns_503_when_mongo_is_unreachable(client, monkeypatch):
    monkeypatch.setattr("api.main.get_db", lambda: _BoomDB())

    response = client.get("/health/ready")

    assert response.status_code == 503
    assert client.get("/health").status_code == 200


def test_health_ready_returns_503_when_redis_is_unreachable(client, monkeypatch):
    monkeypatch.setattr("api.main.get_redis_client", lambda: _BoomRedis())

    response = client.get("/health/ready")

    assert response.status_code == 503
    assert client.get("/health").status_code == 200
