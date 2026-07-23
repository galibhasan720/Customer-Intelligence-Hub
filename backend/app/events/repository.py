"""Repository layer for the events domain.

Event stubs (Features 5-6).
"""

from __future__ import annotations

from sqlalchemy.orm import Session


class EventsRepository:
    """Data-access stub — real queries land with domain features."""

    def __init__(self, db: Session | None = None) -> None:
        self.db = db

    def ping(self) -> dict[str, str]:
        return {"domain": "events", "layer": "repository"}
