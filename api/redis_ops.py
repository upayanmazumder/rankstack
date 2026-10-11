"""Redis-backed fast paths: live leaderboard, sessions, submission rate limiting.

Key layout:
  leaderboard:<contestId>          -> ZSET   member=userId/teamId  score=cumulative points, TTL once the contest ends
  leaderboard_revision:<contestId> -> STRING latest rebuilt leaderboard version, TTL once the contest ends
  session:<sessionId>              -> STRING userId, TTL on inactivity
  user_sessions:<userId>           -> SET    sessionIds, for bulk revocation on account deletion
  rate_limit:<userId>              -> STRING counter, TTL sliding window
  rate_limit_window:<userId>       -> STRING opaque token identifying the current window
  login_attempts:<email|ip>        -> STRING counter, TTL fixed window
"""

import secrets

from redis.exceptions import WatchError

from api.config import settings
from api.db import get_redis_client


def leaderboard_key(contest_id: str) -> str:
    return f"leaderboard:{contest_id}"


def leaderboard_revision_key(contest_id: str) -> str:
    return f"leaderboard_revision:{contest_id}"


def leaderboard_exists(contest_id: str) -> bool:
    """True once `replace_leaderboard` has written a revision for this
    contest -- including an empty board -- so a cached read can be trusted
    without re-aggregating MongoDB. False for a never-seeded contest or one
    whose cache was lost to a Redis restart or eviction. Deliberately keyed
    on the revision marker rather than the ZSET itself: `update_leaderboard_score`
    never writes the revision key, so a lone incremental delta applied to a
    missing board can never masquerade as a complete rebuild."""
    return bool(get_redis_client().exists(leaderboard_revision_key(contest_id)))


_UPDATE_SCORE_IF_BUILT = """
local current = redis.call('GET', KEYS[1])
if not current then
    return false
end
if tonumber(current) >= tonumber(ARGV[3]) then
    return false
end
local new_score = redis.call('ZINCRBY', KEYS[2], ARGV[2], ARGV[1])
redis.call('SET', KEYS[1], ARGV[3])
return new_score
"""


def expire_leaderboard(contest_id: str, ttl_seconds: int) -> None:
    """Give an ended contest's cached leaderboard a TTL so `volatile-lru`
    can reclaim it under memory pressure. The rebuild path (`get_leaderboard`)
    recreates it from MongoDB if it's evicted before being read again."""
    r = get_redis_client()
    r.expire(leaderboard_key(contest_id), ttl_seconds)
    r.expire(leaderboard_revision_key(contest_id), ttl_seconds)


def persist_leaderboard(contest_id: str) -> None:
    """Remove a leaderboard's TTL, for a contest that is no longer ended."""
    r = get_redis_client()
    r.persist(leaderboard_key(contest_id))
    r.persist(leaderboard_revision_key(contest_id))


def update_leaderboard_score(
    contest_id: str, member_id: str, score_delta: float, version: int
) -> float | None:
    """Atomically apply a score delta to a contestant's leaderboard entry,
    coordinated against the same revision `replace_leaderboard` writes.

    Returns `None` instead of writing anything when either:
      - the leaderboard was never built (no revision key yet) -- applying a
        lone delta would create an incomplete ZSET that looks "built" but is
        missing every other participant; or
      - a rebuild already published a revision `>= version` -- it read
        MongoDB *after* this delta's score committed there (callers always
        pass the `version` from the same, just-incremented marker document
        that gates the rebuild), so the full snapshot it wrote already
        includes this delta and applying it again would double-count it.

    Either way, the caller leaves its `dirty_leaderboards` marker pending so
    the next read's rebuild (re)derives the correct score from MongoDB.
    """
    r = get_redis_client()
    result = r.eval(
        _UPDATE_SCORE_IF_BUILT,
        2,
        leaderboard_revision_key(contest_id),
        leaderboard_key(contest_id),
        member_id,
        score_delta,
        version,
    )
    return None if result is None else float(result)


def decrement_existing_leaderboard_score(
    contest_id: str, member_id: str, score: float
) -> None:
    """Reverse a score only when its leaderboard member still exists."""
    get_redis_client().eval(
        "if redis.call('ZSCORE', KEYS[1], ARGV[1]) then "
        "return redis.call('ZINCRBY', KEYS[1], -tonumber(ARGV[2]), ARGV[1]) "
        "end",
        1,
        leaderboard_key(contest_id),
        member_id,
        score,
    )


def get_leaderboard(contest_id: str, top: int = 10) -> list[dict]:
    r = get_redis_client()
    rows = r.zrevrange(leaderboard_key(contest_id), 0, top - 1, withscores=True)
    return [
        {"memberId": member, "score": score, "rank": i + 1}
        for i, (member, score) in enumerate(rows)
    ]


def replace_leaderboard(
    contest_id: str, scores: dict[str, float], version: int
) -> bool:
    """Replace cached scores unless Redis already holds a newer revision."""
    key = leaderboard_key(contest_id)
    revision_key = leaderboard_revision_key(contest_id)
    with get_redis_client().pipeline() as pipe:
        while True:
            try:
                pipe.watch(revision_key)
                current = pipe.get(revision_key)
                if current is not None and int(current) > version:
                    return False
                pipe.multi()
                pipe.delete(key)
                if scores:
                    pipe.zadd(key, scores)
                pipe.set(revision_key, version)
                pipe.execute()
                return True
            except WatchError:
                continue


def session_key(session_id: str) -> str:
    return f"session:{session_id}"


def user_sessions_key(user_id: str) -> str:
    return f"user_sessions:{user_id}"


def create_session(session_id: str, user_id: str) -> None:
    """Store the session and track it against the owning user so every
    session can be revoked at once (see `revoke_user_sessions`). The
    tracking set's TTL mirrors the session TTL so an entry for a session
    that later expires without an explicit logout does not linger in the
    set forever."""
    r = get_redis_client()
    with r.pipeline() as pipe:
        pipe.set(session_key(session_id), user_id, ex=settings.session_ttl_seconds)
        pipe.sadd(user_sessions_key(user_id), session_id)
        pipe.expire(user_sessions_key(user_id), settings.session_ttl_seconds)
        pipe.execute()


def get_session_user(session_id: str) -> str | None:
    r = get_redis_client()
    return r.get(session_key(session_id))


def touch_session(session_id: str) -> bool:
    """Refresh a session's TTL (inactivity expiry), and the owning user's
    session-tracking set TTL alongside it so the set stays alive for as
    long as any of the user's sessions are active. Returns False if the
    session is already gone."""
    r = get_redis_client()
    user_id = r.get(session_key(session_id))
    if user_id is None:
        return False
    with r.pipeline() as pipe:
        pipe.expire(session_key(session_id), settings.session_ttl_seconds)
        pipe.expire(user_sessions_key(user_id), settings.session_ttl_seconds)
        results = pipe.execute()
    return bool(results[0])


def delete_session(session_id: str) -> None:
    r = get_redis_client()
    user_id = r.get(session_key(session_id))
    with r.pipeline() as pipe:
        pipe.delete(session_key(session_id))
        if user_id is not None:
            pipe.srem(user_sessions_key(user_id), session_id)
        pipe.execute()


def revoke_user_sessions(user_id: str) -> None:
    """Delete every session tracked for a user, for use on account
    deletion. Sessions that already expired on their own are a no-op."""
    r = get_redis_client()
    key = user_sessions_key(user_id)
    session_ids = r.smembers(key)
    if session_ids:
        r.delete(*(session_key(sid) for sid in session_ids))
    r.delete(key)


def rate_limit_key(user_id: str) -> str:
    return f"rate_limit:{user_id}"


def rate_limit_window_key(user_id: str) -> str:
    return f"rate_limit_window:{user_id}"


_INCR_WITH_EXPIRY_AND_WINDOW_TOKEN = """
local count = redis.call('INCR', KEYS[1])
if count == 1 then
    redis.call('EXPIRE', KEYS[1], ARGV[1])
    redis.call('SET', KEYS[2], ARGV[2], 'EX', ARGV[1])
end
return {count, redis.call('GET', KEYS[2])}
"""


_INCR_WITH_EXPIRY = """
local count = redis.call('INCR', KEYS[1])
if count == 1 then
    redis.call('EXPIRE', KEYS[1], ARGV[1])
end
return count
"""


def _increment_with_expiry(key: str, window_seconds: int) -> int:
    """Atomically increment a fixed-window counter and set its TTL on first use.

    A Lua script keeps the increment and the TTL set in one Redis round trip,
    so a crash or race between two clients can never leave the counter
    without an expiry.
    """
    return get_redis_client().eval(_INCR_WITH_EXPIRY, 1, key, window_seconds)


def login_attempt_key(identifier: str) -> str:
    return f"login_attempts:{identifier}"


def check_and_increment_login_attempts(email: str, client_ip: str) -> tuple[bool, int]:
    """Throttle login attempts per email and per client IP; the busier key wins."""
    window = settings.login_rate_limit_window_seconds
    email_count = _increment_with_expiry(
        login_attempt_key(f"email:{email.strip().lower()}"), window
    )
    ip_count = _increment_with_expiry(login_attempt_key(f"ip:{client_ip}"), window)
    count = max(email_count, ip_count)
    allowed = count <= settings.login_rate_limit_max_attempts
    return allowed, count


def check_and_increment_rate_limit(user_id: str) -> tuple[bool, int, str]:
    """Sliding-window-ish fixed-window counter.

    Returns `(allowed, current_count, window_token)`. `window_token`
    identifies the fixed window this increment landed in: pass it to
    `decrement_rate_limit` so a refund issued after the window has already
    rolled over decrements the *new* window's counter instead of this
    (expired) one.
    """
    count, token = get_redis_client().eval(
        _INCR_WITH_EXPIRY_AND_WINDOW_TOKEN,
        2,
        rate_limit_key(user_id),
        rate_limit_window_key(user_id),
        settings.rate_limit_window_seconds,
        secrets.token_hex(8),
    )
    allowed = count <= settings.rate_limit_max_submissions
    return allowed, count, token


_DECR_IF_SAME_WINDOW = """
if redis.call('GET', KEYS[2]) == ARGV[1] then
    local count = tonumber(redis.call('GET', KEYS[1]) or '0')
    if count > 0 then
        redis.call('DECR', KEYS[1])
    end
end
"""


def decrement_rate_limit(user_id: str, window_token: str) -> None:
    """Undo a rate-limit increment after a failed submission insert.

    Only decrements if `rate_limit_window_key(user_id)` still holds
    `window_token`: if the original window has since expired and a new one
    started, this is a no-op instead of erasing a newer, unrelated count.
    """
    get_redis_client().eval(
        _DECR_IF_SAME_WINDOW,
        2,
        rate_limit_key(user_id),
        rate_limit_window_key(user_id),
        window_token,
    )


def remove_leaderboard_member(contest_id: str, member_id: str) -> None:
    """Remove one participant from a contest leaderboard."""
    get_redis_client().zrem(leaderboard_key(contest_id), member_id)


def delete_leaderboard(contest_id: str) -> None:
    """Remove a contest leaderboard."""
    get_redis_client().delete(leaderboard_key(contest_id))
