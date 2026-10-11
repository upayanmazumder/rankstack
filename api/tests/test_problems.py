"""Problem visibility matches between the list and detail routes."""

from bson import ObjectId

from api.models.common import utcnow


def test_list_problems_excludes_orphaned_and_upcoming_contests(
    client, db, headers_for, contest_payload, mcq_problem
):
    admin = headers_for("admin")

    live_contest_id = client.post(
        "/contests", json=contest_payload, headers=admin
    ).json()["id"]
    client.patch(
        f"/contests/{live_contest_id}/status", json={"status": "live"}, headers=admin
    )
    visible_problem_id = str(mcq_problem(live_contest_id))

    upcoming_contest_id = client.post(
        "/contests", json=contest_payload, headers=admin
    ).json()["id"]
    upcoming_problem_id = str(mcq_problem(upcoming_contest_id))

    orphaned_problem_id = db.problems.insert_one(
        {
            "contestId": ObjectId(),
            "type": "mcq",
            "title": "Orphaned",
            "description": "No contest references this.",
            "difficulty": "easy",
            "points": 10,
            "options": ["A", "B"],
            "correctAnswer": "A",
            "attemptCount": 0,
            "createdAt": utcnow(),
        }
    ).inserted_id

    listed_ids = {item["id"] for item in client.get("/problems").json()}

    assert visible_problem_id in listed_ids
    assert upcoming_problem_id not in listed_ids
    assert str(orphaned_problem_id) not in listed_ids

    assert client.get(f"/problems/{orphaned_problem_id}").status_code == 404
