"""Intermediate demonstration script for Review 2.

Walks through, with visible printed output:
  1. A CRUD operation (create -> read -> update -> delete a user)
  2. An indexed query, with `.explain()` proving the index is used
  3. A multi-document transaction (submission create + atomic counter bump)
  4. All 5 aggregation pipelines
  5. The Redis fast paths (leaderboard, session TTL, rate limiting)

Run `python scripts/seed.py` first. Usage: python scripts/demo.py
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from api import redis_ops, services  # noqa: E402
from api.aggregations import pipelines as agg  # noqa: E402
from api.db import get_db, get_redis_client  # noqa: E402
from api.models.common import utcnow  # noqa: E402
from api.security import hash_password  # noqa: E402


def section(title: str) -> None:
    print()
    print("=" * 72)
    print(title)
    print("=" * 72)


def main() -> None:
    db = get_db()
    redis_client = get_redis_client()

    section("0. Connection check")
    print("Mongo collections:", sorted(db.list_collection_names()))
    print("Mongo record counts:")
    for name in ["users", "teams", "contests", "problems", "submissions"]:
        print(f"  {name}: {db[name].count_documents({})}")
    print("Redis ping:", redis_client.ping())

    # -- 1. CRUD -------------------------------------------------------
    section("1. CRUD: create -> read -> update -> delete a user")
    created = db["users"].insert_one(
        {
            "name": "Demo Reviewer",
            "email": "demo.reviewer@rankstack.io",
            "passwordHash": hash_password("DemoPass123"),
            "role": "participant",
            "totalScore": 0,
            "teamIds": [],
            "createdAt": utcnow(),
        }
    )
    print("CREATE  ->", created.inserted_id)
    fetched = db["users"].find_one({"_id": created.inserted_id})
    print("READ    ->", {k: v for k, v in fetched.items() if k != "passwordHash"})
    db["users"].update_one({"_id": created.inserted_id}, {"$set": {"name": "Demo Reviewer (Updated)"}})
    updated = db["users"].find_one({"_id": created.inserted_id})
    print("UPDATE  ->", updated["name"])
    result = db["users"].delete_one({"_id": created.inserted_id})
    print("DELETE  -> deleted_count =", result.deleted_count)

    # -- 2. Indexed query with explain() --------------------------------
    section("2. Indexed query: problems by contestId (uses `by_contest` index)")
    any_contest = db["contests"].find_one()
    cursor = db["problems"].find({"contestId": any_contest["_id"]})
    plan = cursor.explain()
    winning_stage = plan["queryPlanner"]["winningPlan"]
    print("Query:", {"contestId": any_contest["_id"]})
    print("Winning plan stage:", winning_stage.get("stage"), "->", winning_stage.get("inputStage", {}).get("stage"))
    print("Index used:", winning_stage.get("inputStage", {}).get("indexName"))
    print("Documents returned:", db["problems"].count_documents({"contestId": any_contest["_id"]}))

    section("2b. Compound-indexed query: submissions by contest+submitter")
    any_submission = db["submissions"].find_one()
    cursor2 = db["submissions"].find(
        {"contestId": any_submission["contestId"], "submittedBy.refId": any_submission["submittedBy"]["refId"]}
    )
    plan2 = cursor2.explain()
    winning2 = plan2["queryPlanner"]["winningPlan"]
    print("Index used:", winning2.get("inputStage", {}).get("indexName"))

    # -- 3. Transaction ---------------------------------------------------
    section("3. Multi-document transaction: create submission + bump problem.attemptCount")
    problem = db["problems"].find_one({"contestId": any_contest["_id"]})
    before = db["problems"].find_one({"_id": problem["_id"]})["attemptCount"]
    demo_user = db["users"].find_one({"role": "participant"})
    sub = services.create_submission(
        db, any_contest["_id"], problem["_id"], {"refType": "user", "refId": demo_user["_id"]}, "demo-answer"
    )
    after = db["problems"].find_one({"_id": problem["_id"]})["attemptCount"]
    print(f"problem.attemptCount before={before} after={after} (submission {sub['_id']} inserted atomically)")

    before_score = db["users"].find_one({"_id": demo_user["_id"]})["totalScore"]
    services.update_submission_status(db, sub["_id"], "correct", problem["points"])
    after_score = db["users"].find_one({"_id": demo_user["_id"]})["totalScore"]
    print(f"user.totalScore before={before_score} after={after_score} (submission status+score updated atomically)")

    # cleanup demo submission so re-running this script stays idempotent
    db["submissions"].delete_one({"_id": sub["_id"]})
    db["problems"].update_one({"_id": problem["_id"]}, {"$inc": {"attemptCount": -1}})
    db["users"].update_one({"_id": demo_user["_id"]}, {"$inc": {"totalScore": -problem["points"]}})

    # -- 4. Aggregations ----------------------------------------------
    section("4. Aggregation pipelines")
    live_or_ended = db["contests"].find_one({"status": {"$in": ["live", "ended"]}})

    print("\n[1/5] Leaderboard for contest:", live_or_ended["title"])
    for row in agg.leaderboard_for_contest(db, live_or_ended["_id"])[:5]:
        print(" ", row)

    print("\n[2/5] Average score per problem, grouped by difficulty")
    for row in agg.avg_score_per_problem_by_difficulty(db):
        print(" ", row)

    print("\n[3/5] Submission count by status, per contest")
    for row in agg.submission_count_by_status_per_contest(db):
        print(" ", row)

    print("\n[4/5] Distinct problems solved per user (top 5)")
    for row in agg.distinct_problems_solved_per_user(db)[:5]:
        print(" ", row)

    print("\n[5/5] Team performance ($lookup teams -> submissions via memberIds)")
    for row in agg.team_performance(db):
        print(" ", row)

    # -- 5. Redis fast paths -----------------------------------------
    section("5. Redis: leaderboard sorted set, session TTL, rate-limit counter")
    lb = redis_ops.get_leaderboard(str(live_or_ended["_id"]), top=5)
    print("ZSET leaderboard:%s top 5:" % live_or_ended["_id"], lb)

    token = "demo-session-token"
    redis_ops.create_session(token, str(demo_user["_id"]))
    ttl = redis_client.ttl(redis_ops.session_key(token))
    print(f"session:{token} -> user {demo_user['_id']}, TTL={ttl}s")
    redis_ops.delete_session(token)

    rl_user = "demo-rate-limit-user"
    redis_client.delete(redis_ops.rate_limit_key(rl_user))
    for _ in range(3):
        allowed, count = redis_ops.check_and_increment_rate_limit(rl_user)
    print(f"rate_limit:{rl_user} -> count={count}, allowed={allowed}, ttl={redis_client.ttl(redis_ops.rate_limit_key(rl_user))}s")
    redis_client.delete(redis_ops.rate_limit_key(rl_user))

    section("Demo complete.")


if __name__ == "__main__":
    main()
