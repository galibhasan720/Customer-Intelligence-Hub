"""Analytics repository (queries live in the service)."""

from __future__ import annotations

from sqlalchemy.orm import Session


class AnalyticsRepository:
    def __init__(self, db: Session | None = None) -> None:
        self.db = db
