"""Wipe and reseed all 5 collections with referentially-consistent sample data.

Target distribution (comfortably clears the 50-record minimum):
  users 15, teams 5, contests 5, problems 15, submissions 40-50+  ->  85-95+ total

Submissions are only generated for "live"/"ended" contests (an "upcoming"
contest realistically has zero submissions yet) and use the same
`app.services` transactions the API uses, so `problems.attemptCount`,
`users/teams.totalScore`, and the Redis `leaderboard:<contestId>` sorted
sets all come out consistent with the submission data.

Usage: python scripts/seed.py
"""

import random
import sys
from datetime import timedelta
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from faker import Faker  # noqa: E402

from app import redis_ops, services  # noqa: E402
from app.db import get_redis_client, init_db  # noqa: E402
from app.models.common import utcnow  # noqa: E402
from app.security import hash_password  # noqa: E402

fake = Faker()
Faker.seed(42)
random.seed(42)

DEMO_PASSWORD = "Passw0rd!"
DIFFICULTY_POINTS = {"easy": 10, "medium": 20, "hard": 30}
PROBLEM_TYPES = ["mcq", "coding", "subjective"]
DIFFICULTIES = ["easy", "medium", "hard"]
STATUS_WEIGHTS = [("correct", 0.45), ("incorrect", 0.30), ("partial", 0.15), ("pending", 0.10)]


def weighted_status() -> str:
    r = random.random()
    cum = 0.0
    for status, weight in STATUS_WEIGHTS:
        cum += weight
        if r <= cum:
            return status
    return "pending"


def wipe(db, redis_client) -> None:
    for name in ["users", "teams", "contests", "problems", "submissions"]:
        db[name].delete_many({})
    for key in redis_client.keys("leaderboard:*"):
        redis_client.delete(key)


def seed_users(db, n: int = 15) -> list[dict]:
    users = []
    for i in range(n):
        doc = {
            "name": fake.name(),
            "email": f"user{i + 1}@rankstack.io",
            "passwordHash": hash_password(DEMO_PASSWORD),
            "role": "admin" if i < 2 else "participant",
            "totalScore": 0,
            "teamIds": [],
            "createdAt": utcnow(),
        }
        doc["_id"] = db["users"].insert_one(doc).inserted_id
        users.append(doc)
    return users


def seed_teams(db, users: list[dict], n: int = 5, team_size: int = 3) -> list[dict]:
    teams = []
    for i in range(n):
        members = users[i * team_size : (i + 1) * team_size]
        member_ids = [u["_id"] for u in members]
        doc = {
            "name": f"Team {fake.color_name().title()} {fake.word().title()}",
            "memberIds": member_ids,
            "totalScore": 0,
            "createdAt": utcnow(),
        }
        doc["_id"] = db["teams"].insert_one(doc).inserted_id
        for uid in member_ids:
            db["users"].update_one({"_id": uid}, {"$addToSet": {"teamIds": doc["_id"]}})
        teams.append(doc)
    return teams


def seed_contests(db, admins: list[dict], n: int = 5) -> list[dict]:
    now = utcnow()
    # (start_offset_days, end_offset_days) -> 2 ended, 1 live, 2 upcoming
    offsets = [(-10, -8), (-7, -5), (-1, 2), (3, 5), (6, 9)]
    contests = []
    for i in range(n):
        start_delta, end_delta = offsets[i % len(offsets)]
        start = now + timedelta(days=start_delta)
        end = now + timedelta(days=end_delta)
        if end < now:
            status = "ended"
        elif start <= now <= end:
            status = "live"
        else:
            status = "upcoming"
        doc = {
            "title": f"{fake.catch_phrase()} Contest",
            "description": fake.sentence(nb_words=12),
            "startTime": start,
            "endTime": end,
            "status": status,
            "createdBy": admins[i % len(admins)]["_id"],
            "problemIds": [],
            "participants": [],
            "createdAt": utcnow(),
        }
        doc["_id"] = db["contests"].insert_one(doc).inserted_id
        contests.append(doc)
    return contests


def assign_participants(db, contests: list[dict], users: list[dict], teams: list[dict]) -> None:
    for idx, c in enumerate(contests):
        rot_u = users[idx % len(users) :] + users[: idx % len(users)]
        rot_t = teams[idx % len(teams) :] + teams[: idx % len(teams)]
        chosen_users = rot_u[:6]
        chosen_teams = rot_t[:2]
        participants = [{"refType": "user", "refId": u["_id"]} for u in chosen_users]
        participants += [{"refType": "team", "refId": t["_id"]} for t in chosen_teams]
        db["contests"].update_one({"_id": c["_id"]}, {"$set": {"participants": participants}})
        c["participants"] = participants


def seed_problems(db, contests: list[dict], per_contest: int = 3) -> None:
    for c in contests:
        problem_ids = []
        problems = []
        for j in range(per_contest):
            ptype = PROBLEM_TYPES[j % len(PROBLEM_TYPES)]
            difficulty = DIFFICULTIES[j % len(DIFFICULTIES)]
            base = {
                "contestId": c["_id"],
                "type": ptype,
                "title": fake.sentence(nb_words=4).rstrip("."),
                "description": fake.paragraph(nb_sentences=2),
                "difficulty": difficulty,
                "points": DIFFICULTY_POINTS[difficulty],
                "attemptCount": 0,
                "createdAt": utcnow(),
            }
            if ptype == "mcq":
                options = [fake.word() for _ in range(4)]
                base["options"] = options
                base["correctAnswer"] = options[0]
            elif ptype == "coding":
                base["inputFormat"] = "A single integer n on one line."
                base["constraints"] = "1 <= n <= 10^5"
                base["testCases"] = [{"input": str(k), "output": str(k * 2)} for k in range(1, 3)]
            else:
                base["wordLimit"] = 300
                base["evaluationRubric"] = fake.sentence(nb_words=10)
            pid = db["problems"].insert_one(base).inserted_id
            base["_id"] = pid
            problem_ids.append(pid)
            problems.append(base)
        db["contests"].update_one({"_id": c["_id"]}, {"$set": {"problemIds": problem_ids}})
        c["problemIds"] = problem_ids
        c["problems"] = problems


def make_answer(problem: dict):
    if problem["type"] == "mcq":
        return random.choice(problem["options"])
    if problem["type"] == "coding":
        return f"def solve(n):\n    return n * {random.randint(2, 5)}"
    return fake.paragraph(nb_sentences=3)


def seed_submissions(db, redis_client, contests: list[dict]) -> int:
    count = 0
    for c in contests:
        if c["status"] not in ("live", "ended"):
            continue  # upcoming contests have no submissions yet
        for participant in c["participants"]:
            problems_sample = random.sample(c["problems"], k=min(2, len(c["problems"])))
            for problem in problems_sample:
                answer = make_answer(problem)
                submission = services.create_submission(
                    db, c["_id"], problem["_id"], participant, answer
                )
                status = weighted_status()
                if status == "pending":
                    count += 1
                    continue
                score = (
                    problem["points"]
                    if status == "correct"
                    else (problem["points"] / 2 if status == "partial" else 0)
                )
                services.update_submission_status(db, submission["_id"], status, score)
                if score > 0:
                    redis_ops.update_leaderboard_score(
                        str(c["_id"]), str(participant["refId"]), score
                    )
                count += 1
    return count


def main() -> None:
    db = init_db()
    redis_client = get_redis_client()

    wipe(db, redis_client)

    users = seed_users(db)
    teams = seed_teams(db, users)
    contests = seed_contests(db, admins=[u for u in users if u["role"] == "admin"])
    assign_participants(db, contests, users, teams)
    seed_problems(db, contests)
    submission_count = seed_submissions(db, redis_client, contests)

    counts = {
        "users": db["users"].count_documents({}),
        "teams": db["teams"].count_documents({}),
        "contests": db["contests"].count_documents({}),
        "problems": db["problems"].count_documents({}),
        "submissions": db["submissions"].count_documents({}),
    }
    print("Seed complete. Record counts:")
    for name, n in counts.items():
        print(f"  {name}: {n}")
    print(f"  TOTAL: {sum(counts.values())}")
    print(f"Demo login password for every seeded user: {DEMO_PASSWORD!r}")


if __name__ == "__main__":
    main()
