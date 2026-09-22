"""Password hashing (PBKDF2-HMAC-SHA256) and opaque session tokens."""

import hashlib
import os
import secrets

_ITERATIONS = 200_000


def hash_password(password: str) -> str:
    salt = secrets.token_hex(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode(), bytes.fromhex(salt), _ITERATIONS)
    return f"{salt}${digest.hex()}"


def verify_password(password: str, stored: str) -> bool:
    try:
        salt, hex_digest = stored.split("$", 1)
    except ValueError:
        return False
    digest = hashlib.pbkdf2_hmac("sha256", password.encode(), bytes.fromhex(salt), _ITERATIONS)
    return secrets.compare_digest(digest.hex(), hex_digest)


def new_session_token() -> str:
    return secrets.token_urlsafe(32)
