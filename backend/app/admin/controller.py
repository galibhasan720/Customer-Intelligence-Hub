"""Controller layer for the admin domain.

Admin stubs (Feature 14).
"""

from __future__ import annotations

from app.admin.service import AdminService

_service = AdminService()


def ping() -> dict[str, str]:
    """Health-style stub used to verify MVC wiring."""
    payload = _service.ping()
    payload["layer"] = "controller"
    return payload
