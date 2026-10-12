"""Contest CRUD, status changes, and membership boundaries."""

from bson import ObjectId
from redis.exceptions import RedisError

from api import redis_ops
from api.db import get_redis_client
from api.models.common import utcnow


def test_contest_lifecycle(client, db, users, headers_for, contest_payload):
    admin = headers_for("admin")
    participant = headers_for("participant")
    created = client.post("/contests", json=contest_payload, headers=admin)
    assert created.status_code == 201
    contest_id = created.json()["id"]
    assert created.json()["status"] == "upcoming"
    assert [
        item["id"]
        for item in client.get("/contests", params={"status": "upcoming"}).json()
    ] == [contest_id]

    renamed = client.patch(
        f"/contests/{contest_id}", json={"title": "Renamed contest"}, headers=admin
    )
    assert renamed.status_code == 200
    assert client.get(f"/contests/{contest_id}").json()["title"] == "Renamed contest"

    membership = {"refType": "user", "refId": users["other"]["id"]}
    joined = client.post(
        f"/contests/{contest_id}/participants", json=membership, headers=participant
    )
    assert joined.status_code == 200
    assert joined.json()["participants"] == [
        {"refType": "user", "refId": users["participant"]["id"]}
    ]
    repeated = client.post(
        f"/contests/{contest_id}/participants", json=membership, headers=participant
    )
    assert len(repeated.json()["participants"]) == 1

    for status in ("live", "ended"):
        changed = client.patch(
            f"/contests/{contest_id}/status", json={"status": status}, headers=admin
        )
        assert changed.status_code == 200
        assert changed.json()["status"] == status
        assert (
            client.get("/contests", params={"status": status}).json()[0]["id"]
            == contest_id
        )

    assert (
        client.post(
            f"/contests/{contest_id}/participants", json=membership, headers=participant
        ).status_code
        == 409
    )
    assert db.contests.find_one({"_id": ObjectId(contest_id)})["participants"] == [
        {"refType": "user", "refId": ObjectId(users["participant"]["id"])}
    ]
    assert client.delete(f"/contests/{contest_id}", headers=admin).status_code == 204
    assert client.get(f"/contests/{contest_id}").status_code == 404


def test_leaderboard_nonexistent_contest(client):
    nonexistent = str(ObjectId())
    res = client.get(f"/contests/{nonexistent}/leaderboard")
    assert res.status_code == 404
    assert res.json()["detail"] == "Contest not found"


def test_leaderboard_and_aggregation_endpoint_rank_identically(
    client, users, headers_for, contest_payload, mcq_problem
):
    """GET /contests/{id}/leaderboard and GET /aggregations/leaderboard/{id}
    must agree on both the score and the tie-break: they share one ranking
    pipeline (leaderboard_for_contest)."""
    admin = headers_for("admin")
    participant = headers_for("participant")
    other = headers_for("other")
    contest = client.post("/contests", json=contest_payload, headers=admin).json()
    contest_id = contest["id"]
    problem_id = str(mcq_problem(contest_id))

    def submit_and_grade(headers, ref_id, score):
        submission_id = client.post(
            "/submissions",
            json={
                "contestId": contest_id,
                "problemId": problem_id,
                "submittedBy": {"refType": "user", "refId": ref_id},
                "answer": "A",
            },
            headers=headers,
        ).json()["id"]
        client.patch(
            f"/submissions/{submission_id}/status",
            json={"status": "correct", "score": score},
            headers=admin,
        )

    submit_and_grade(participant, users["participant"]["id"], 10)
    submit_and_grade(other, users["other"]["id"], 5)
    submit_and_grade(admin, users["admin"]["id"], 5)

    # Delete a throwaway (never-graded) submission so a dirty_leaderboards
    # marker exists; that is what routes get_leaderboard through the same
    # MongoDB aggregation the standalone endpoint always uses.
    throwaway_id = client.post(
        "/submissions",
        json={
            "contestId": contest_id,
            "problemId": problem_id,
            "submittedBy": {"refType": "user", "refId": users["participant"]["id"]},
            "answer": "A",
        },
        headers=participant,
    ).json()["id"]
    client.delete(f"/submissions/{throwaway_id}", headers=participant)

    live = client.get(f"/contests/{contest_id}/leaderboard").json()["leaderboard"]
    aggregated = client.get(f"/aggregations/leaderboard/{contest_id}").json()

    # other and admin are tied at score 5; the pipeline breaks ties by
    # refId descending, so compute the expected order from the actual
    # ObjectIds rather than assuming which user id sorts higher.
    tied_ids_desc = sorted(
        [users["other"]["id"], users["admin"]["id"]],
        key=ObjectId,
        reverse=True,
    )
    expected_order = [users["participant"]["id"], *tied_ids_desc]
    expected_score_by_member = {
        users["participant"]["id"]: 10,
        users["other"]["id"]: 5,
        users["admin"]["id"]: 5,
    }
    expected_scores = [
        expected_score_by_member[member_id] for member_id in expected_order
    ]

    assert [row["memberId"] for row in live] == expected_order
    assert [row["score"] for row in live] == expected_scores
    assert [str(row["refId"]) for row in aggregated] == expected_order
    assert [row["totalScore"] for row in aggregated] == expected_scores

    assert [row["memberId"] for row in live] == [
        str(row["refId"]) for row in aggregated
    ]
    assert [row["score"] for row in live] == [row["totalScore"] for row in aggregated]


def _grade(client, admin, submission_id, score):
    return client.patch(
        f"/submissions/{submission_id}/status",
        json={"status": "correct", "score": score},
        headers=admin,
    )


def test_leaderboard_rebuilds_after_redis_flush(
    client, db, users, headers_for, contest_payload, mcq_problem
):
    admin = headers_for("admin")
    participant = headers_for("participant")
    contest = client.post("/contests", json=contest_payload, headers=admin).json()
    contest_id = contest["id"]
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
    _grade(client, admin, submission_id, 10)
    # A grade on a never-built contest defers to the read path instead of
    # creating a partial ZSET from a lone zincrby: see redis_ops.
    # update_leaderboard_score. The first read builds the real thing.
    assert not redis_ops.leaderboard_exists(contest_id)
    first_read = client.get(f"/contests/{contest_id}/leaderboard").json()["leaderboard"]
    assert first_read[0]["score"] == 10
    assert redis_ops.leaderboard_exists(contest_id)

    get_redis_client().flushall()
    assert not redis_ops.leaderboard_exists(contest_id)

    rebuilt = client.get(f"/contests/{contest_id}/leaderboard").json()["leaderboard"]
    assert rebuilt[0]["memberId"] == users["participant"]["id"]
    assert rebuilt[0]["score"] == 10
    assert redis_ops.leaderboard_exists(contest_id)


def test_leaderboard_reads_return_to_redis_after_reconciliation(
    client, db, users, headers_for, contest_payload, mcq_problem
):
    admin = headers_for("admin")
    participant = headers_for("participant")
    other = headers_for("other")
    contest = client.post("/contests", json=contest_payload, headers=admin).json()
    contest_id = contest["id"]
    problem_id = str(mcq_problem(contest_id))
    top_submission = client.post(
        "/submissions",
        json={
            "contestId": contest_id,
            "problemId": problem_id,
            "submittedBy": {"refType": "user", "refId": users["participant"]["id"]},
            "answer": "A",
        },
        headers=participant,
    ).json()["id"]
    client.post(
        "/submissions",
        json={
            "contestId": contest_id,
            "problemId": problem_id,
            "submittedBy": {"refType": "user", "refId": users["other"]["id"]},
            "answer": "A",
        },
        headers=other,
    )
    _grade(client, admin, top_submission, 10)

    # Delete the top scorer so only a nonzero entry for "other" remains,
    # which leaves the dirty_leaderboards marker pending.
    assert (
        client.delete(f"/submissions/{top_submission}", headers=participant).status_code
        == 204
    )

    reconciled = client.get(f"/contests/{contest_id}/leaderboard").json()["leaderboard"]
    assert reconciled == []
    marker = db.dirty_leaderboards.find_one({"_id": ObjectId(contest_id)})
    assert marker["reconciledVersion"] == marker["version"]
    # The rebuilt board has no entries, but it *was* built: the revision
    # key records that, so a later read trusts the (correctly empty) cache
    # instead of re-aggregating MongoDB on every request forever.
    assert redis_ops.leaderboard_exists(contest_id)

    # Grade the second submission; its direct Redis write reconciles the
    # board immediately since it was already built above.
    other_submission_id = db.submissions.find_one(
        {"submittedBy.refId": ObjectId(users["other"]["id"])}
    )["_id"]
    _grade(client, admin, str(other_submission_id), 5)
    first_reconcile = client.get(f"/contests/{contest_id}/leaderboard").json()[
        "leaderboard"
    ]
    assert [row["score"] for row in first_reconcile] == [5]
    assert redis_ops.leaderboard_exists(contest_id)

    # An out-of-band write bypasses the grade/delete flows, so it never
    # marks the leaderboard dirty. If a reconciled read still aggregated
    # Mongo on every call, this would appear immediately.
    db.submissions.insert_one(
        {
            "contestId": ObjectId(contest_id),
            "problemId": ObjectId(problem_id),
            "submittedBy": {"refType": "user", "refId": ObjectId()},
            "answer": "A",
            "status": "correct",
            "score": 999,
            "submittedAt": utcnow(),
        }
    )

    served_from_cache = client.get(f"/contests/{contest_id}/leaderboard").json()[
        "leaderboard"
    ]
    assert [row["score"] for row in served_from_cache] == [5]


def test_leaderboard_read_falls_back_to_mongo_during_redis_outage(
    client, db, users, headers_for, contest_payload, mcq_problem, monkeypatch
):
    """A full Redis outage while reading an already-reconciled leaderboard
    must still return correct MongoDB-sourced rankings, not a 500: every
    Redis call on this path (the revision check, the cached read, and the
    rebuild's replacement write) has to fail closed to MongoDB."""
    admin = headers_for("admin")
    participant = headers_for("participant")
    contest = client.post("/contests", json=contest_payload, headers=admin).json()
    contest_id = contest["id"]
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
    _grade(client, admin, submission_id, 10)

    # Reconcile: the leaderboard is now built and non-pending, so a normal
    # read would take the fast Redis path.
    reconciled = client.get(f"/contests/{contest_id}/leaderboard").json()["leaderboard"]
    assert reconciled[0]["score"] == 10
    marker = db.dirty_leaderboards.find_one({"_id": ObjectId(contest_id)})
    assert marker["reconciledVersion"] == marker["version"]

    def unavailable(*args, **kwargs):
        raise RedisError("redis is down")

    monkeypatch.setattr("api.routes.contests.redis_ops.leaderboard_exists", unavailable)
    monkeypatch.setattr("api.routes.contests.redis_ops.get_leaderboard", unavailable)
    monkeypatch.setattr(
        "api.routes.contests.redis_ops.replace_leaderboard", unavailable
    )

    res = client.get(f"/contests/{contest_id}/leaderboard")
    assert res.status_code == 200
    leaderboard = res.json()["leaderboard"]
    assert leaderboard[0]["memberId"] == users["participant"]["id"]
    assert leaderboard[0]["score"] == 10
