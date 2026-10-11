"""Email redaction on user profiles and the login attempt throttle."""


def test_user_profile_hides_email_from_strangers(client, users, headers_for):
    participant_id = users["participant"]["id"]

    anonymous = client.get(f"/users/{participant_id}")
    assert anonymous.status_code == 200
    assert "email" not in anonymous.json()

    stranger = client.get(f"/users/{participant_id}", headers=headers_for("other"))
    assert "email" not in stranger.json()

    owner = client.get(f"/users/{participant_id}", headers=headers_for("participant"))
    assert owner.json()["email"] == users["participant"]["email"]

    admin = client.get(f"/users/{participant_id}", headers=headers_for("admin"))
    assert admin.json()["email"] == users["participant"]["email"]


def test_user_list_redacts_email_except_for_owner_and_admin(client, users, headers_for):
    def by_id(items, user_id):
        return next(item for item in items if item["id"] == user_id)

    as_stranger = client.get("/users", headers=headers_for("other")).json()
    assert "email" not in by_id(as_stranger, users["participant"]["id"])
    assert by_id(as_stranger, users["other"]["id"])["email"] == users["other"]["email"]

    as_admin = client.get("/users", headers=headers_for("admin")).json()
    assert (
        by_id(as_admin, users["participant"]["id"])["email"]
        == (users["participant"]["email"])
    )


def test_login_throttle_returns_429_with_retry_after(client, users):
    account = users["participant"]
    for _ in range(5):
        client.post("/sessions", json={"email": account["email"], "password": "wrong"})

    blocked = client.post(
        "/sessions", json={"email": account["email"], "password": "wrong"}
    )
    assert blocked.status_code == 429
    assert "Retry-After" in blocked.headers

    still_blocked = client.post(
        "/sessions", json={"email": account["email"], "password": account["password"]}
    )
    assert still_blocked.status_code == 429


def test_login_with_unknown_email_returns_401(client, db):
    response = client.post(
        "/sessions", json={"email": "nobody@example.test", "password": "whatever"}
    )
    assert response.status_code == 401
