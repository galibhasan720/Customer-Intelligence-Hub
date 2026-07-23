"""Service layer for the bookings domain.

Booking stubs (Features 9-11).
"""

from __future__ import annotations

from app.bookings.repository import BookingsRepository


class BookingsService:
    """Business-logic stub — real rules land with domain features."""

    def __init__(self, repository: BookingsRepository | None = None) -> None:
        self.repository = repository or BookingsRepository()

    def ping(self) -> dict[str, str]:
        payload = self.repository.ping()
        payload["layer"] = "service"
        return payload
