"""Email redaction on user profiles and the login attempt throttle."""

import time

from starlette.testclient import TestClient

from api.config import settings
from api.db import get_redis_client
from api.main import app
from api.redis_ops import login_attempt_key


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


def test_login_throttle_isolates_email_across_different_ips(client, users):
    """Five wrong attempts for one email, each from a distinct IP, still
    trip the per-email counter: it would pass even with email limiting
    removed if the test only ever varied the IP's own budget, so the sixth
    attempt below must come from yet another fresh IP to prove the email
    bucket -- not the IP bucket -- is what blocks it."""
    account = users["participant"]
    redis = get_redis_client()
    ips = [f"203.0.113.{i}" for i in range(1, 6)]
    extra_ip = "203.0.113.99"
    try:
        for ip in ips:
            with TestClient(app, client=(ip, 50000)) as ip_client:
                response = ip_client.post(
                    "/sessions", json={"email": account["email"], "password": "wrong"}
                )
                assert response.status_code == 401

        with TestClient(app, client=(extra_ip, 50000)) as blocked_client:
            blocked = blocked_client.post(
                "/sessions",
                json={"email": account["email"], "password": account["password"]},
            )
        assert blocked.status_code == 429
    finally:
        redis.delete(
            *(login_attempt_key(f"ip:{ip}") for ip in (*ips, extra_ip)),
            login_attempt_key(f"email:{account['email']}"),
        )


def test_login_throttle_isolates_ip_across_different_emails(client):
    """Five wrong attempts from one IP, each against a distinct unknown
    email, trip the per-IP counter before the email counter ever factors
    in: a sixth, never-before-seen email from that same IP must still be
    blocked, proving the IP bucket -- not any single email bucket -- is
    what caught it."""
    redis = get_redis_client()
    ip = "198.51.100.7"
    emails = [f"flood-{i}@example.test" for i in range(5)]
    unseen_email = "brand-new@example.test"
    try:
        with TestClient(app, client=(ip, 50000)) as ip_client:
            for email in emails:
                response = ip_client.post(
                    "/sessions", json={"email": email, "password": "wrong"}
                )
                assert response.status_code == 401

            blocked = ip_client.post(
                "/sessions", json={"email": unseen_email, "password": "wrong"}
            )
        assert blocked.status_code == 429
    finally:
        redis.delete(
            login_attempt_key(f"ip:{ip}"),
            *(login_attempt_key(f"email:{e}") for e in emails),
            login_attempt_key(f"email:{unseen_email}"),
        )


def test_login_throttle_resets_after_window_expires(client, users, monkeypatch):
    monkeypatch.setattr(settings, "login_rate_limit_window_seconds", 1)
    account = users["participant"]
    for _ in range(5):
        client.post("/sessions", json={"email": account["email"], "password": "wrong"})

    blocked = client.post(
        "/sessions", json={"email": account["email"], "password": "wrong"}
    )
    assert blocked.status_code == 429

    time.sleep(1.1)

    allowed = client.post(
        "/sessions", json={"email": account["email"], "password": account["password"]}
    )
    assert allowed.status_code == 201


def test_login_with_unknown_email_returns_401(client, db):
    response = client.post(
        "/sessions", json={"email": "nobody@example.test", "password": "whatever"}
    )
    assert response.status_code == 401
