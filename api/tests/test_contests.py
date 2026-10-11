"""Contest CRUD, status changes, and membership boundaries."""

from bson import ObjectId


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

    assert [row["memberId"] for row in live] == [
        str(row["refId"]) for row in aggregated
    ]
    assert [row["score"] for row in live] == [row["totalScore"] for row in aggregated]
