"""Controller layer for the notifications domain.

Notification stubs (Feature 12).
"""

from __future__ import annotations

from app.notifications.service import NotificationsService

_service = NotificationsService()


def ping() -> dict[str, str]:
    """Health-style stub used to verify MVC wiring."""
    payload = _service.ping()
    payload["layer"] = "controller"
    return payload
