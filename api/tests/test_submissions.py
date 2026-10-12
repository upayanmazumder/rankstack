"""Submission transactions, score deltas, pagination, and Redis rate limits."""

import concurrent.futures
import threading
from datetime import timedelta
from uuid import uuid4

from bson import ObjectId
from pymongo.collection import Collection
from redis.exceptions import RedisError

from api import redis_ops
from api.db import get_redis_client
from api.models.common import utcnow
from api.redis_ops import leaderboard_key


def test_submission_scoring_and_rate_limit(
    client, db, users, headers_for, live_contest, mcq_problem
):
    admin = headers_for("admin")
    participant = headers_for("participant")
    contest_id = live_contest()
    problem_id = str(mcq_problem(contest_id))
    payload = {
        "contestId": contest_id,
        "problemId": problem_id,
        "submittedBy": {"refType": "user", "refId": users["participant"]["id"]},
        "answer": "A",
    }

    first = client.post("/submissions", json=payload, headers=participant)
    assert first.status_code == 201
    submission_id = first.json()["id"]
    assert db.problems.find_one({"_id": ObjectId(problem_id)})["attemptCount"] == 1
    assert db.submissions.count_documents({"problemId": ObjectId(problem_id)}) == 1

    assert (
        client.patch(
            f"/submissions/{submission_id}/status",
            json={"status": "correct", "score": 10},
            headers=participant,
        ).status_code
        == 403
    )
    for status, score in (("correct", 10), ("partial", 4)):
        response = client.patch(
            f"/submissions/{submission_id}/status",
            json={"status": status, "score": score},
            headers=admin,
        )
        assert response.status_code == 200
        assert response.json()["score"] == score
        assert (
            db.users.find_one({"_id": ObjectId(users["participant"]["id"])})[
                "totalScore"
            ]
            == score
        )
    assert (
        client.get(f"/contests/{contest_id}/leaderboard").json()["leaderboard"][0][
            "score"
        ]
        == 4
    )

    for _ in range(9):
        assert (
            client.post("/submissions", json=payload, headers=participant).status_code
            == 201
        )
    blocked = client.post("/submissions", json=payload, headers=participant)
    assert blocked.status_code == 429
    assert db.problems.find_one({"_id": ObjectId(problem_id)})["attemptCount"] == 10
    assert db.submissions.count_documents({"problemId": ObjectId(problem_id)}) == 10


def test_submission_list_is_newest_first_and_offset_paginated(
    client, db, users, headers_for
):
    participant_id = ObjectId(users["participant"]["id"])
    now = utcnow()
    submission_ids = db.submissions.insert_many(
        [
            {
                "contestId": ObjectId(),
                "problemId": ObjectId(),
                "submittedBy": {"refType": "user", "refId": participant_id},
                "answer": f"answer-{index}",
                "status": "pending",
                "score": 0,
                "submittedAt": now + timedelta(minutes=index),
            }
            for index in range(5)
        ]
    ).inserted_ids

    response = client.get(
        "/submissions",
        params={"limit": 2, "offset": 2},
        headers=headers_for("participant"),
    )

    assert response.status_code == 200
    assert [item["id"] for item in response.json()] == [
        str(submission_ids[2]),
        str(submission_ids[1]),
    ]


def test_concurrent_submissions_to_one_problem_do_not_500(
    client, db, users, headers_for, live_contest, mcq_problem
):
    """20 different users submit to the same problem at once. Every request
    must retry past MongoDB write conflicts instead of surfacing a 500."""
    contest_id = live_contest()
    problem_id = str(mcq_problem(contest_id))
    password_hash = db.users.find_one(
        {"_id": ObjectId(users["participant"]["id"])}, {"passwordHash": 1}
    )["passwordHash"]

    submitters = []
    for index in range(20):
        email = f"concurrent-{index}-{uuid4().hex}@example.test"
        user_id = db.users.insert_one(
            {
                "name": f"Concurrent User {index}",
                "email": email,
                "passwordHash": password_hash,
                "role": "participant",
                "totalScore": 0,
                "teamIds": [],
                "createdAt": utcnow(),
            }
        ).inserted_id
        token = client.post(
            "/sessions", json={"email": email, "password": "Passw0rd!"}
        ).json()["sessionId"]
        client.post(
            f"/contests/{contest_id}/participants",
            json={"refType": "user", "refId": str(user_id)},
            headers={"Authorization": f"Bearer {token}"},
        )
        submitters.append((str(user_id), token))

    def submit(entry: tuple[str, str]) -> int:
        user_id, token = entry
        payload = {
            "contestId": contest_id,
            "problemId": problem_id,
            "submittedBy": {"refType": "user", "refId": user_id},
            "answer": "A",
        }
        response = client.post(
            "/submissions", json=payload, headers={"Authorization": f"Bearer {token}"}
        )
        return response.status_code

    with concurrent.futures.ThreadPoolExecutor(max_workers=20) as pool:
        statuses = list(pool.map(submit, submitters))

    assert statuses == [201] * 20, statuses
    assert db.problems.find_one({"_id": ObjectId(problem_id)})["attemptCount"] == 20
    assert db.submissions.count_documents({"problemId": ObjectId(problem_id)}) == 20


def test_concurrent_grades_keep_redis_in_sync_with_mongo(
    client, db, users, headers_for, live_contest, mcq_problem, monkeypatch
):
    """Two admins grade the same submission at once. Redis must end up with
    whichever score Mongo actually committed, not a double-counted sum of
    both admins' stale pre-read deltas."""
    admin = headers_for("admin")
    participant = headers_for("participant")
    contest_id = live_contest()
    problem_id = str(mcq_problem(contest_id))
    payload = {
        "contestId": contest_id,
        "problemId": problem_id,
        "submittedBy": {"refType": "user", "refId": users["participant"]["id"]},
        "answer": "A",
    }
    submission_id = client.post(
        "/submissions", json=payload, headers=participant
    ).json()["id"]

    # Force both workers' first read of the submission (inside the
    # transaction) to happen before either has written, so this
    # deterministically exercises the WriteConflict/retry path instead of
    # depending on thread-scheduling luck.
    barrier = threading.Barrier(2)
    already_waited = threading.local()
    original_find_one = Collection.find_one

    def synced_find_one(self, filter=None, *args, **kwargs):
        if (
            self.name == "submissions"
            and isinstance(filter, dict)
            and filter.get("_id") == ObjectId(submission_id)
            and kwargs.get("session") is not None
            and not getattr(already_waited, "done", False)
        ):
            already_waited.done = True
            barrier.wait(timeout=5)
        return original_find_one(self, filter, *args, **kwargs)

    monkeypatch.setattr(Collection, "find_one", synced_find_one)

    def grade(score: int) -> int:
        return client.patch(
            f"/submissions/{submission_id}/status",
            json={"status": "correct", "score": score},
            headers=admin,
        ).status_code

    with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:
        statuses = list(pool.map(grade, [10, 15]))

    assert statuses == [200, 200]
    mongo_score = db.users.find_one({"_id": ObjectId(users["participant"]["id"])})[
        "totalScore"
    ]
    redis_score = client.get(f"/contests/{contest_id}/leaderboard").json()[
        "leaderboard"
    ][0]["score"]
    assert redis_score == mongo_score


def test_submission_status_redis_failure_marks_leaderboard_dirty(
    client, db, users, headers_for, live_contest, mcq_problem, monkeypatch
):
    """A Redis outage during grading must not lose the score delta: Mongo is
    updated and the leaderboard is marked dirty. A later successful grade
    plus a leaderboard read must then reconcile Redis to the correct final
    score and catch `reconciledVersion` up to `version`."""
    admin = headers_for("admin")
    participant = headers_for("participant")
    contest_id = live_contest()
    problem_id = str(mcq_problem(contest_id))
    payload = {
        "contestId": contest_id,
        "problemId": problem_id,
        "submittedBy": {"refType": "user", "refId": users["participant"]["id"]},
        "answer": "A",
    }
    submission_id = client.post(
        "/submissions", json=payload, headers=participant
    ).json()["id"]

    original_update_leaderboard_score = redis_ops.update_leaderboard_score

    def unavailable(*args, **kwargs):
        raise RedisError("redis is down")

    monkeypatch.setattr(
        "api.routes.submissions.redis_ops.update_leaderboard_score", unavailable
    )

    response = client.patch(
        f"/submissions/{submission_id}/status",
        json={"status": "correct", "score": 10},
        headers=admin,
    )

    assert response.status_code == 200
    assert response.json()["score"] == 10
    assert (
        db.users.find_one({"_id": ObjectId(users["participant"]["id"])})["totalScore"]
        == 10
    )
    marker = db.dirty_leaderboards.find_one({"_id": ObjectId(contest_id)})
    assert marker is not None
    assert marker["dirty"] is True

    # Restore Redis and grade again. The route still skips direct Redis
    # writes while a dirty marker is pending, so Mongo keeps accumulating
    # the correct total while Redis stays stale until reconciled.
    monkeypatch.setattr(
        "api.routes.submissions.redis_ops.update_leaderboard_score",
        original_update_leaderboard_score,
    )
    response = client.patch(
        f"/submissions/{submission_id}/status",
        json={"status": "correct", "score": 15},
        headers=admin,
    )
    assert response.status_code == 200
    mongo_score = db.users.find_one({"_id": ObjectId(users["participant"]["id"])})[
        "totalScore"
    ]
    assert mongo_score == 15

    # A leaderboard read is what reconciles Redis from Mongo once Redis is
    # healthy again.
    leaderboard = client.get(f"/contests/{contest_id}/leaderboard").json()[
        "leaderboard"
    ]
    assert leaderboard[0]["score"] == 15

    redis_score = get_redis_client().zscore(
        leaderboard_key(contest_id), users["participant"]["id"]
    )
    assert redis_score == 15

    reconciled_marker = db.dirty_leaderboards.find_one({"_id": ObjectId(contest_id)})
    assert reconciled_marker["reconciledVersion"] == reconciled_marker["version"]


def test_rebuild_during_grading_does_not_double_count_delta(
    client, db, users, headers_for, live_contest, mcq_problem, monkeypatch
):
    """A leaderboard read that rebuilds from MongoDB can race a concurrent
    grade's direct Redis delta write: the grade's MongoDB transaction (and
    its dirty_leaderboards version bump) commits first, then -- before the
    grade's own direct Redis write runs -- a GET rebuilds the whole
    leaderboard from MongoDB, which already reflects the grade, and marks
    it reconciled. The grade's direct write must then see its own revision
    already superseded and skip, instead of applying the delta on top of a
    snapshot that already includes it."""
    admin = headers_for("admin")
    participant = headers_for("participant")
    contest_id = live_contest()
    problem_id = str(mcq_problem(contest_id))
    submission_id = client.post(
        "/submissions",
        json={
            "contestId": contest_id,
            "problemId": problem_id,
            "submittedBy": {"refType": "user", "refId": users["participant"]["id"]},
            "answer": "A",
        },
        headers=participant,
    ).json()["id"]

    # Establish a built (empty) leaderboard so the grade's direct Redis
    # write path is live rather than deferring to the read path outright.
    client.get(f"/contests/{contest_id}/leaderboard")
    assert redis_ops.leaderboard_exists(contest_id)

    original = redis_ops.update_leaderboard_score
    triggered = threading.local()

    def racing_update(contest_id_arg, member_id_arg, delta, version):
        if not getattr(triggered, "done", False):
            triggered.done = True
            # Simulate a concurrent GET whose rebuild lands *after*
            # MongoDB committed this grade but *before* this grade's own
            # direct Redis write runs.
            resp = client.get(f"/contests/{contest_id_arg}/leaderboard")
            assert resp.status_code == 200
        return original(contest_id_arg, member_id_arg, delta, version)

    monkeypatch.setattr(
        "api.routes.submissions.redis_ops.update_leaderboard_score", racing_update
    )

    grade_resp = client.patch(
        f"/submissions/{submission_id}/status",
        json={"status": "correct", "score": 10},
        headers=admin,
    )
    assert grade_resp.status_code == 200

    mongo_score = db.users.find_one({"_id": ObjectId(users["participant"]["id"])})[
        "totalScore"
    ]
    assert mongo_score == 10

    final = client.get(f"/contests/{contest_id}/leaderboard").json()["leaderboard"]
    assert final[0]["score"] == 10

    redis_score = get_redis_client().zscore(
        leaderboard_key(contest_id), users["participant"]["id"]
    )
    assert redis_score == 10


def test_submission_create_requires_live_contest_and_participation(
    client, users, headers_for, contest_payload, mcq_problem
):
    admin = headers_for("admin")
    participant = headers_for("participant")
    contest = client.post("/contests", json=contest_payload, headers=admin).json()
    contest_id = contest["id"]
    problem_id = str(mcq_problem(contest_id))
    payload = {
        "contestId": contest_id,
        "problemId": problem_id,
        "submittedBy": {"refType": "user", "refId": users["participant"]["id"]},
        "answer": "A",
    }

    not_live = client.post("/submissions", json=payload, headers=participant)
    assert not_live.status_code == 409

    client.patch(
        f"/contests/{contest_id}/status", json={"status": "live"}, headers=admin
    )
    not_joined = client.post("/submissions", json=payload, headers=participant)
    assert not_joined.status_code == 403

    client.post(
        f"/contests/{contest_id}/participants",
        json={"refType": "user", "refId": users["participant"]["id"]},
        headers=participant,
    )
    joined = client.post("/submissions", json=payload, headers=participant)
    assert joined.status_code == 201

    client.patch(
        f"/contests/{contest_id}/status", json={"status": "ended"}, headers=admin
    )
    ended = client.post("/submissions", json=payload, headers=participant)
    assert ended.status_code == 409


def test_submission_read_and_delete_are_scoped_to_owner(
    client, users, headers_for, live_contest, mcq_problem
):
    participant = headers_for("participant")
    other = headers_for("other")
    admin = headers_for("admin")
    contest_id = live_contest()
    problem_id = str(mcq_problem(contest_id))
    payload = {
        "contestId": contest_id,
        "problemId": problem_id,
        "submittedBy": {"refType": "user", "refId": users["participant"]["id"]},
        "answer": "A",
    }
    submission_id = client.post(
        "/submissions", json=payload, headers=participant
    ).json()["id"]

    assert client.get("/submissions").status_code == 401
    assert client.get(f"/submissions/{submission_id}").status_code == 401
    assert client.get("/submissions", headers=other).json() == []
    assert client.get(f"/submissions/{submission_id}", headers=other).status_code == 404
    assert (
        client.delete(f"/submissions/{submission_id}", headers=other).status_code == 403
    )

    assert client.get(f"/submissions/{submission_id}", headers=participant).json()[
        "id"
    ] == (submission_id)
    assert len(client.get("/submissions", headers=admin).json()) == 1
    assert (
        client.delete(f"/submissions/{submission_id}", headers=participant).status_code
        == 204
    )
