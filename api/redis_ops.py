"""Redis-backed fast paths: live leaderboard, sessions, submission rate limiting.

Key layout:
  leaderboard:<contestId>          -> ZSET   member=userId/teamId  score=cumulative points
  leaderboard_revision:<contestId> -> STRING latest rebuilt leaderboard version
  session:<sessionId>              -> STRING userId, TTL on inactivity
  rate_limit:<userId>              -> STRING counter, TTL sliding window
"""

from redis.exceptions import WatchError

from api.config import settings
from api.db import get_redis_client


def leaderboard_key(contest_id: str) -> str:
    return f"leaderboard:{contest_id}"


def update_leaderboard_score(
    contest_id: str, member_id: str, score_delta: float
) -> float:
    """Atomically apply a score delta to a contestant's leaderboard entry."""
    r = get_redis_client()
    return r.zincrby(leaderboard_key(contest_id), score_delta, member_id)


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
    revision_key = f"leaderboard_revision:{contest_id}"
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


def create_session(session_id: str, user_id: str) -> None:
    r = get_redis_client()
    r.set(session_key(session_id), user_id, ex=settings.session_ttl_seconds)


def get_session_user(session_id: str) -> str | None:
    r = get_redis_client()
    return r.get(session_key(session_id))


def touch_session(session_id: str) -> bool:
    """Refresh a session's TTL (inactivity expiry). Returns False if it's gone."""
    r = get_redis_client()
    return bool(r.expire(session_key(session_id), settings.session_ttl_seconds))


def delete_session(session_id: str) -> None:
    r = get_redis_client()
    r.delete(session_key(session_id))


def rate_limit_key(user_id: str) -> str:
    return f"rate_limit:{user_id}"


def check_and_increment_rate_limit(user_id: str) -> tuple[bool, int]:
    """Sliding-window-ish fixed-window counter. Returns (allowed, current_count)."""
    r = get_redis_client()
    key = rate_limit_key(user_id)
    count = r.incr(key)
    if count == 1:
        r.expire(key, settings.rate_limit_window_seconds)
    allowed = count <= settings.rate_limit_max_submissions
    return allowed, count


def remove_leaderboard_member(contest_id: str, member_id: str) -> None:
    """Remove one participant from a contest leaderboard."""
    get_redis_client().zrem(leaderboard_key(contest_id), member_id)


def delete_leaderboard(contest_id: str) -> None:
    """Remove a contest leaderboard."""
    get_redis_client().delete(leaderboard_key(contest_id))
