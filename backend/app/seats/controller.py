"""Controller layer for the seats domain.

Seat stubs (Features 7-8).
"""

from __future__ import annotations

from app.seats.service import SeatsService

_service = SeatsService()


def ping() -> dict[str, str]:
    """Health-style stub used to verify MVC wiring."""
    payload = _service.ping()
    payload["layer"] = "controller"
    return payload
