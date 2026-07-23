"""Controller layer for the bookings domain.

Booking stubs (Features 9-11).
"""

from __future__ import annotations

from app.bookings.service import BookingsService

_service = BookingsService()


def ping() -> dict[str, str]:
    """Health-style stub used to verify MVC wiring."""
    payload = _service.ping()
    payload["layer"] = "controller"
    return payload
