"""Service layer for the events domain.

Event stubs (Features 5-6).
"""

from __future__ import annotations

from app.events.repository import EventsRepository


class EventsService:
    """Business-logic stub — real rules land with domain features."""

    def __init__(self, repository: EventsRepository | None = None) -> None:
        self.repository = repository or EventsRepository()

    def ping(self) -> dict[str, str]:
        payload = self.repository.ping()
        payload["layer"] = "service"
        return payload
