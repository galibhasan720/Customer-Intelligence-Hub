"""Repository layer for the seats domain.

Seat stubs (Features 7-8).
"""

from __future__ import annotations

from sqlalchemy.orm import Session


class SeatsRepository:
    """Data-access stub — real queries land with domain features."""

    def __init__(self, db: Session | None = None) -> None:
        self.db = db

    def ping(self) -> dict[str, str]:
        return {"domain": "seats", "layer": "repository"}
