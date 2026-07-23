"""Repository layer for the bookings domain.

Booking stubs (Features 9-11).
"""

from __future__ import annotations

from sqlalchemy.orm import Session


class BookingsRepository:
    """Data-access stub — real queries land with domain features."""

    def __init__(self, db: Session | None = None) -> None:
        self.db = db

    def ping(self) -> dict[str, str]:
        return {"domain": "bookings", "layer": "repository"}
