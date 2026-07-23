"""Service layer for the seats domain.

Seat stubs (Features 7-8).
"""

from __future__ import annotations

from app.seats.repository import SeatsRepository


class SeatsService:
    """Business-logic stub — real rules land with domain features."""

    def __init__(self, repository: SeatsRepository | None = None) -> None:
        self.repository = repository or SeatsRepository()

    def ping(self) -> dict[str, str]:
        payload = self.repository.ping()
        payload["layer"] = "service"
        return payload
