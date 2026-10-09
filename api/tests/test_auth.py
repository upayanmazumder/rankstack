"""Authentication and role checks through real session storage."""


def test_login_and_protected_route(client, users):
    account = users["participant"]
    assert client.get("/teams").status_code == 401
    assert (
        client.post(
            "/sessions", json={"email": account["email"], "password": "wrong"}
        ).status_code
        == 401
    )

    response = client.post(
        "/sessions", json={"email": account["email"], "password": account["password"]}
    )
    assert response.status_code == 201
    token = response.json()["sessionId"]
    headers = {"Authorization": f"Bearer {token}"}
    assert client.get("/teams", headers=headers).status_code == 200
    assert client.get(f"/sessions/{token}").json()["user"]["id"] == account["id"]
    assert client.delete(f"/sessions/{token}").status_code == 204
    assert client.get("/teams", headers=headers).status_code == 401


def test_non_admin_cannot_create_contest(client, users, headers_for, contest_payload):
    assert (
        client.post(
            "/contests", json=contest_payload, headers=headers_for("participant")
        ).status_code
        == 403
    )
    response = client.post(
        "/contests", json=contest_payload, headers=headers_for("admin")
    )
    assert response.status_code == 201
    assert response.json()["createdBy"] == users["admin"]["id"]
