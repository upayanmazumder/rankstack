"""Submission transactions, score deltas, and Redis rate limits."""

from bson import ObjectId


def test_submission_scoring_and_rate_limit(
    client, db, users, headers_for, contest_payload, mcq_problem
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
