"""Controller layer for the events domain.

Event stubs (Features 5-6).
"""

from __future__ import annotations

from app.events.service import EventsService

_service = EventsService()


def ping() -> dict[str, str]:
    """Health-style stub used to verify MVC wiring."""
    payload = _service.ping()
    payload["layer"] = "controller"
    return payload
