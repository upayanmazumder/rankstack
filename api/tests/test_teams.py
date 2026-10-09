"""Team CRUD and bidirectional membership transactions."""

from bson import ObjectId


def test_team_membership_and_back_references(client, db, users, headers_for):
    admin = headers_for("admin")
    participant = headers_for("participant")
    created = client.post("/teams", json={"name": "Engineers"}, headers=admin)
    assert created.status_code == 201
    team_id = created.json()["id"]
    team_oid = ObjectId(team_id)
    member_id = users["participant"]["id"]
    assert created.json()["memberIds"] == [users["admin"]["id"]]
    assert (
        team_oid
        in db.users.find_one({"_id": ObjectId(users["admin"]["id"])})["teamIds"]
    )
    assert any(
        team["id"] == team_id
        for team in client.get("/teams", headers=participant).json()
    )

    assert (
        client.post(
            f"/teams/{team_id}/members", json={"userId": member_id}, headers=participant
        ).status_code
        == 403
    )
    added = client.post(
        f"/teams/{team_id}/members", json={"userId": member_id}, headers=admin
    )
    assert added.status_code == 200
    assert member_id in added.json()["memberIds"]
    assert team_oid in db.users.find_one({"_id": ObjectId(member_id)})["teamIds"]

    renamed = client.patch(
        f"/teams/{team_id}", json={"name": "Solvers"}, headers=participant
    )
    assert renamed.status_code == 200
    assert client.get(f"/teams/{team_id}").json()["name"] == "Solvers"
    removed = client.delete(f"/teams/{team_id}/members/{member_id}", headers=admin)
    assert removed.status_code == 200
    assert member_id not in removed.json()["memberIds"]
    assert team_oid not in db.users.find_one({"_id": ObjectId(member_id)})["teamIds"]

    assert (
        client.delete(
            f"/teams/{team_id}/members/{users['admin']['id']}", headers=admin
        ).status_code
        == 409
    )
    assert client.delete(f"/teams/{team_id}", headers=admin).status_code == 204
    assert (
        team_oid
        not in db.users.find_one({"_id": ObjectId(users["admin"]["id"])})["teamIds"]
    )
    assert client.get(f"/teams/{team_id}").status_code == 404
