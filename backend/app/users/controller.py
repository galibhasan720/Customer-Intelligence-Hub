"""Controller layer for the users domain.

User profile stubs (Features 2-3).
"""

from __future__ import annotations

from app.users.service import UsersService

_service = UsersService()


def ping() -> dict[str, str]:
    """Health-style stub used to verify MVC wiring."""
    payload = _service.ping()
    payload["layer"] = "controller"
    return payload
