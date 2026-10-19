"""Seed the production database with realistic, high-quality contest data.

Preserves the existing 'rankstack@upayan.dev' account and ensures password 'password' works.
Generates:
  - Diverse users with natural human names and university / tech emails
  - Named student teams with believable rosters
  - A comprehensive pool of contests across different stages:
      * 2 Ended contests (with complete past submission histories and final scores)
      * 2 Live contests (active right now, open for submissions)
      * 2 Upcoming contests (scheduled in the future)
  - Realistic problem sets (MCQ, Algorithmic Coding, and System Architecture)
  - Synchronized Redis sorted-set leaderboards
"""

from datetime import UTC, datetime, timedelta
import random
from bson import ObjectId
from api.db import get_db, get_redis_client, init_db
from api.models.common import utcnow
from api.security import hash_password
from api import redis_ops, services

def seed_production():
    db = init_db()
    redis_client = get_redis_client()

    print("Ensuring existing admin/personal user 'rankstack@upayan.dev' has password 'password'...")
    user_rankstack = db.users.find_one({"email": "rankstack@upayan.dev"})
    if user_rankstack:
        db.users.update_one(
            {"_id": user_rankstack["_id"]},
            {"$set": {
                "passwordHash": hash_password("password"),
                "role": "admin",
                "name": "Upayan Mazumder"
            }}
        )
        primary_user_id = user_rankstack["_id"]
        print(f"  Updated 'rankstack@upayan.dev' (id: {primary_user_id}) to admin role with password 'password'.")
    else:
        doc = {
            "name": "Upayan Mazumder",
            "email": "rankstack@upayan.dev",
            "passwordHash": hash_password("password"),
            "role": "admin",
            "totalScore": 0,
            "teamIds": [],
            "createdAt": utcnow(),
        }
        primary_user_id = db.users.insert_one(doc).inserted_id
        print(f"  Created 'rankstack@upayan.dev' (id: {primary_user_id}).")

    # Clean existing non-primary data to have a clean, referentially intact state
    print("Clearing prior contests, problems, submissions, teams, and other users...")
    db.users.delete_many({"_id": {"$ne": primary_user_id}})
    db.teams.delete_many({})
    db.contests.delete_many({})
    db.problems.delete_many({})
    db.submissions.delete_many({})
    db.dirty_leaderboards.delete_many({})
    
    for pattern in ("leaderboard:*", "leaderboard_revision:*"):
        for key in redis_client.keys(pattern):
            redis_client.delete(key)

    # 1. Realistic Participants
    natural_participants = [
        {"name": "Ananya Sharma", "email": "ananya.sharma@vitstudent.ac.in"},
        {"name": "Rohan Deshmukh", "email": "rohan.deshmukh@vitstudent.ac.in"},
        {"name": "Tanvi Kulkarni", "email": "tanvi.kulkarni@vitstudent.ac.in"},
        {"name": "Arjun Nair", "email": "arjun.nair@vitstudent.ac.in"},
        {"name": "Priya Venkatesh", "email": "priya.v@vitstudent.ac.in"},
        {"name": "Kabir Sen", "email": "kabir.sen@vitstudent.ac.in"},
        {"name": "Meera Iyer", "email": "meera.iyer@vitstudent.ac.in"},
        {"name": "Vikram Malhotra", "email": "vikram.m@vitstudent.ac.in"},
        {"name": "Siddharth Verma", "email": "sid.verma@vitstudent.ac.in"},
        {"name": "Neha Nambiar", "email": "neha.nambiar@vitstudent.ac.in"},
        {"name": "Devansh Gupta", "email": "devansh.gupta@vitstudent.ac.in"},
        {"name": "Rhea Chakraborty", "email": "rhea.c@vitstudent.ac.in"},
    ]

    all_users = [{"_id": primary_user_id, "name": "Upayan Mazumder", "email": "rankstack@upayan.dev", "role": "admin"}]
    for p in natural_participants:
        u_doc = {
            "name": p["name"],
            "email": p["email"],
            "passwordHash": hash_password("Passw0rd!"),
            "role": "participant",
            "totalScore": 0,
            "teamIds": [],
            "createdAt": utcnow() - timedelta(days=random.randint(15, 30)),
        }
        u_doc["_id"] = db.users.insert_one(u_doc).inserted_id
        all_users.append(u_doc)

    print(f"Seeded {len(all_users)} total accounts.")

    # 2. Realistic Competitive Teams
    teams_spec = [
        {"name": "Null Pointers", "members": [all_users[1], all_users[2], all_users[3]]},
        {"name": "Binary Mavericks", "members": [all_users[4], all_users[5], all_users[6]]},
        {"name": "Algorithmics", "members": [all_users[7], all_users[8], all_users[9]]},
        {"name": "Stack Overflowed", "members": [all_users[10], all_users[11], all_users[12]]},
    ]

    all_teams = []
    for ts in teams_spec:
        m_ids = [m["_id"] for m in ts["members"]]
        t_doc = {
            "name": ts["name"],
            "memberIds": m_ids,
            "ownerId": m_ids[0],
            "totalScore": 0,
            "createdAt": utcnow() - timedelta(days=20),
        }
        t_doc["_id"] = db.teams.insert_one(t_doc).inserted_id
        for mid in m_ids:
            db.users.update_one({"_id": mid}, {"$addToSet": {"teamIds": t_doc["_id"]}})
        all_teams.append(t_doc)

    print(f"Seeded {len(all_teams)} competitive squads.")

    # 3. Rich, Varied Contests across stages
    now = utcnow()
    contests_spec = [
        # Ended
        {
            "title": "Winter CodeSprint 2026",
            "description": "Annual speed programming invitational with algorithmic challenges in dynamic programming and graph structures.",
            "start": now - timedelta(days=12),
            "end": now - timedelta(days=10),
            "status": "ended",
        },
        {
            "title": "ACM Chapter Induction Hackathon",
            "description": "Round 1 technical challenge covering multiple choice computer systems concepts and tree traversal implementations.",
            "start": now - timedelta(days=5),
            "end": now - timedelta(days=3),
            "status": "ended",
        },
        # Live right now
        {
            "title": "ACM Weekly Contest #42",
            "description": "Live timed sprint. Solve arrays, strings, and system design problems before the clock expires.",
            "start": now - timedelta(hours=3),
            "end": now + timedelta(hours=21),
            "status": "live",
        },
        {
            "title": "Database Systems Grand Prix",
            "description": "Evaluating indexing strategy, ACID transaction semantics, and query optimization challenges.",
            "start": now - timedelta(days=1),
            "end": now + timedelta(days=2),
            "status": "live",
        },
        # Upcoming
        {
            "title": "National Inter-College Collegiate 2026",
            "description": "Premier team collegiate championship featuring advanced distributed systems and dynamic programming problems.",
            "start": now + timedelta(days=4),
            "end": now + timedelta(days=6),
            "status": "upcoming",
        },
        {
            "title": "Graph Theory & Topology Challenge",
            "description": "A focused single-topic contest on shortest path, network flow, and minimum spanning trees.",
            "start": now + timedelta(days=9),
            "end": now + timedelta(days=11),
            "status": "upcoming",
        },
    ]

    # Reusable problem banks
    problem_templates = [
        # MCQ
        {
            "type": "mcq",
            "title": "B-Tree Indexing Complexity",
            "description": "In a MongoDB B-tree index of depth h storing N entries, what is the asymptotic worst-case disk page access count for an exact-match point query?",
            "difficulty": "easy",
            "points": 10,
            "options": ["O(1)", "O(log N)", "O(N)", "O(N log N)"],
            "correctAnswer": "O(log N)",
        },
        {
            "type": "mcq",
            "title": "ACID Isolation Levels",
            "description": "Which anomaly is prevented under Snapshot Isolation that is permitted under Read Committed?",
            "difficulty": "medium",
            "points": 20,
            "options": ["Dirty Reads only", "Non-Repeatable Reads and Dirty Reads", "Phantom Reads only", "Dirty Writes only"],
            "correctAnswer": "Non-Repeatable Reads and Dirty Reads",
        },
        # Coding
        {
            "type": "coding",
            "title": "Subarray Sum Equals K",
            "description": "Given an array of integers nums and an integer k, return the total number of continuous subarrays whose sum equals to k.\n\nInput format: Array elements on first line, k on second line.",
            "difficulty": "medium",
            "points": 30,
            "inputFormat": "Space separated integers nums, followed by integer k",
            "constraints": "1 <= nums.length <= 2 * 10^4, -1000 <= nums[i] <= 1000",
            "testCases": [
                {"input": "[1,1,1]\n2", "output": "2"},
                {"input": "[1,2,3]\n3", "output": "2"}
            ]
        },
        {
            "type": "coding",
            "title": "Two-Sum Array Indices",
            "description": "Given a 1-indexed array of integers numbers that is already sorted in non-decreasing order, find two numbers such that they add up to a specific target number.",
            "difficulty": "easy",
            "points": 15,
            "inputFormat": "Sorted integers on line 1, target integer on line 2",
            "constraints": "2 <= numbers.length <= 3 * 10^4",
            "testCases": [
                {"input": "2 7 11 15\n9", "output": "1 2"},
                {"input": "2 3 4\n6", "output": "1 3"}
            ]
        },
        # Subjective
        {
            "type": "subjective",
            "title": "Write-Through vs Write-Back Caching",
            "description": "Compare Write-Through and Write-Back caching strategies in high-frequency leaderboard systems. Analyze cache consistency implications during Redis instance restarts.",
            "difficulty": "hard",
            "points": 40,
            "wordLimit": 400,
            "evaluationRubric": "Full marks for identifying replica failover consistency risks and dirty marker reconciliation mechanisms."
        }
    ]

    all_contests = []
    for c_spec in contests_spec:
        # Enroll participants: includes the user rankstack@upayan.dev so you are enrolled in everything!
        participants = [{"refType": "user", "refId": primary_user_id}]
        for u in all_users[1:8]:
            participants.append({"refType": "user", "refId": u["_id"]})
        for tm in all_teams[:2]:
            participants.append({"refType": "team", "refId": tm["_id"]})

        c_doc = {
            "title": c_spec["title"],
            "description": c_spec["description"],
            "startTime": c_spec["start"],
            "endTime": c_spec["end"],
            "status": c_spec["status"],
            "createdBy": primary_user_id,
            "problemIds": [],
            "participants": participants,
            "createdAt": now - timedelta(days=14),
        }
        c_id = db.contests.insert_one(c_doc).inserted_id
        c_doc["_id"] = c_id

        # Insert 3 problems for each contest
        prob_ids = []
        c_problems = []
        selected_templates = random.sample(problem_templates, 3)
        for pt in selected_templates:
            p_doc = dict(pt)
            p_doc["contestId"] = c_id
            p_doc["attemptCount"] = 0
            p_doc["createdAt"] = c_doc["createdAt"]
            pid = db.problems.insert_one(p_doc).inserted_id
            p_doc["_id"] = pid
            prob_ids.append(pid)
            c_problems.append(p_doc)

        db.contests.update_one({"_id": c_id}, {"$set": {"problemIds": prob_ids}})
        c_doc["problemIds"] = prob_ids
        c_doc["problems"] = c_problems
        all_contests.append(c_doc)

    print(f"Seeded {len(all_contests)} contests with problems.")

    # 4. Generate Submissions for Ended & Live Contests
    total_submissions = 0
    for c in all_contests:
        if c["status"] == "upcoming":
            continue

        scores_by_participant = {}
        # Iterate participants
        for part in c["participants"]:
            # Make 1 to 3 attempts
            for prob in c["problems"][:random.randint(1, 3)]:
                ans = prob.get("correctAnswer", "O(log N)") if prob["type"] == "mcq" else "def solve(): return True"
                sub_doc = {
                    "contestId": c["_id"],
                    "problemId": prob["_id"],
                    "submittedBy": part,
                    "answer": ans,
                    "status": "pending",
                    "score": 0,
                    "submittedAt": c["startTime"] + timedelta(hours=random.randint(1, 6)),
                }
                sub_id = db.submissions.insert_one(sub_doc).inserted_id
                db.problems.update_one({"_id": prob["_id"]}, {"$inc": {"attemptCount": 1}})

                # Outcome
                verdict = random.choice(["correct", "correct", "partial", "incorrect"])
                if c["status"] == "live" and random.random() < 0.2:
                    verdict = "pending"

                awarded = 0
                if verdict == "correct":
                    awarded = prob["points"]
                elif verdict == "partial":
                    awarded = prob["points"] / 2

                if verdict != "pending":
                    db.submissions.update_one({"_id": sub_id}, {"$set": {"status": verdict, "score": awarded}})
                    target = "users" if part["refType"] == "user" else "teams"
                    db[target].update_one({"_id": part["refId"]}, {"$inc": {"totalScore": awarded}})
                    
                    pid_str = str(part["refId"])
                    scores_by_participant[pid_str] = scores_by_participant.get(pid_str, 0) + awarded

                total_submissions += 1

        # Push scores to Redis leaderboard
        if scores_by_participant:
            redis_ops.replace_leaderboard(str(c["_id"]), scores_by_participant, 1)
            db.dirty_leaderboards.update_one(
                {"_id": c["_id"]},
                {"$set": {"version": 1, "reconciledVersion": 1}},
                upsert=True
            )

    print(f"Generated {total_submissions} submissions and updated Redis leaderboards.")

    final_counts = {
        "users": db.users.count_documents({}),
        "teams": db.teams.count_documents({}),
        "contests": db.contests.count_documents({}),
        "problems": db.problems.count_documents({}),
        "submissions": db.submissions.count_documents({}),
    }
    print("Seed Complete. Final Document Summary:")
    for k, v in final_counts.items():
        print(f"  {k}: {v}")
    print(f"TOTAL: {sum(final_counts.values())}")

if __name__ == "__main__":
    seed_production()
