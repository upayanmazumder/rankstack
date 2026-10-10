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
