"""Repository layer for the analytics domain.

Analytics stubs (Feature 13).
"""

from __future__ import annotations

from sqlalchemy.orm import Session


class AnalyticsRepository:
    """Data-access stub — real queries land with domain features."""

    def __init__(self, db: Session | None = None) -> None:
        self.db = db

    def ping(self) -> dict[str, str]:
        return {"domain": "analytics", "layer": "repository"}
