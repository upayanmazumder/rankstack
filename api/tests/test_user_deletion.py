"""Deleting a user scrubs every reference: teams, contests, submissions,
leaderboards, and active sessions."""

from bson import ObjectId


def test_delete_user_cascades_team_contest_and_submission_references(
    client, db, users, headers_for, contest_payload, mcq_problem
):
    admin = headers_for("admin")
    participant = headers_for("participant")
    participant_id = ObjectId(users["participant"]["id"])

    contest = client.post("/contests", json=contest_payload, headers=admin).json()
    contest_id = contest["id"]
    problem_id = str(mcq_problem(contest_id))
    client.post(
        f"/contests/{contest_id}/participants",
        json={"refType": "user", "refId": users["participant"]["id"]},
        headers=participant,
    )
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
    client.patch(
        f"/submissions/{submission_id}/status",
        json={"status": "correct", "score": 10},
        headers=admin,
    )

    team_id = client.post("/teams", json={"name": "Survivors"}, headers=admin).json()[
        "id"
    ]
    client.post(
        f"/teams/{team_id}/members",
        json={"userId": users["participant"]["id"]},
        headers=admin,
    )

    assert (
        client.delete(
            f"/users/{users['participant']['id']}", headers=participant
        ).status_code
        == 204
    )

    assert db.users.find_one({"_id": participant_id}) is None
    assert db.submissions.count_documents({"submittedBy.refId": participant_id}) == 0
    assert db.problems.find_one({"_id": ObjectId(problem_id)})["attemptCount"] == 0

    team = db.teams.find_one({"_id": ObjectId(team_id)})
    assert team is not None
    assert participant_id not in team["memberIds"]

    reloaded_contest = db.contests.find_one({"_id": ObjectId(contest_id)})
    assert all(p["refId"] != participant_id for p in reloaded_contest["participants"])

    assert client.get("/teams", headers=participant).status_code == 401


def test_delete_sole_team_member_deletes_the_team(client, db, users, headers_for):
    participant = headers_for("participant")
    team_id = client.post(
        "/teams", json={"name": "Solo Act"}, headers=participant
    ).json()["id"]

    assert (
        client.delete(
            f"/users/{users['participant']['id']}", headers=participant
        ).status_code
        == 204
    )

    assert db.teams.find_one({"_id": ObjectId(team_id)}) is None
