"""Atomicity of the Redis-backed rate limiter."""

from api import redis_ops
from api.config import settings
from api.db import get_redis_client


def test_rate_limit_counter_always_has_a_ttl(db):
    user_id = "ttl-test-user-single"
    key = redis_ops.rate_limit_key(user_id)
    try:
        allowed, count = redis_ops.check_and_increment_rate_limit(user_id)
        assert allowed
        assert count == 1
        assert get_redis_client().ttl(key) > 0
    finally:
        get_redis_client().delete(key)


def test_rate_limit_ttl_survives_every_repeated_increment(db):
    """A crash between INCR and EXPIRE used to leave the key with no TTL
    (ttl() == -1), after which the counter never expired and the user was
    locked out forever. The Lua script makes that impossible."""
    user_id = "ttl-test-user-repeated"
    key = redis_ops.rate_limit_key(user_id)
    try:
        for expected_count in range(1, 4):
            _, count = redis_ops.check_and_increment_rate_limit(user_id)
            assert count == expected_count
            ttl = get_redis_client().ttl(key)
            assert 0 < ttl <= settings.rate_limit_window_seconds
    finally:
        get_redis_client().delete(key)
