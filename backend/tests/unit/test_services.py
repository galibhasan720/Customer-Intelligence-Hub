"""Unit tests for security helpers and RBAC dependencies."""

from uuid import uuid4

import pytest

from app.core.dependencies import require_admin, require_organizer, require_roles
from app.core.exceptions import ForbiddenError
from app.core.security import create_access_token, decode_access_token, hash_password, verify_password
from app.users.models import Profile


def test_password_hash_roundtrip() -> None:
    hashed = hash_password("password123")
    assert hashed != "password123"
    assert verify_password("password123", hashed)
    assert not verify_password("wrong", hashed)


def test_jwt_roundtrip() -> None:
    user_id = uuid4()
    token = create_access_token(
        user_id=user_id,
        email="a@example.com",
        role="customer",
        full_name="A",
    )
    payload = decode_access_token(token)
    assert payload["sub"] == str(user_id)
    assert payload["role"] == "customer"


def test_require_admin_and_roles() -> None:
    admin = Profile(full_name="A", email="a@x.com", password_hash="x", role="admin")
    org = Profile(full_name="O", email="o@x.com", password_hash="x", role="organizer")
    cust = Profile(full_name="C", email="c@x.com", password_hash="x", role="customer")

    assert require_admin(admin) is admin
    with pytest.raises(ForbiddenError):
        require_admin(org)

    assert require_organizer(org) is org
    assert require_organizer(admin) is admin
    with pytest.raises(ForbiddenError):
        require_organizer(cust)

    dep = require_roles("organizer", "admin")
    assert dep(org) is org
    with pytest.raises(ForbiddenError):
        dep(cust)
