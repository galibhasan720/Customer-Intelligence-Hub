"""Authentication stubs (Feature 2)."""

from __future__ import annotations

from app.auth.service import AuthService

_service = AuthService()


def ping() -> dict[str, str]:
    """Health-style stub used to verify MVC wiring."""
    payload = _service.ping()
    payload["layer"] = "controller"
    return payload
