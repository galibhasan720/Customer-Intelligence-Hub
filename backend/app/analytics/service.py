"""Service layer for the analytics domain.

Analytics stubs (Feature 13).
"""

from __future__ import annotations

from app.analytics.repository import AnalyticsRepository


class AnalyticsService:
    """Business-logic stub — real rules land with domain features."""

    def __init__(self, repository: AnalyticsRepository | None = None) -> None:
        self.repository = repository or AnalyticsRepository()

    def ping(self) -> dict[str, str]:
        payload = self.repository.ping()
        payload["layer"] = "service"
        return payload
