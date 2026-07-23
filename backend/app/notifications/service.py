"""Service layer for the notifications domain.

Notification stubs (Feature 12).
"""

from __future__ import annotations

from app.notifications.repository import NotificationsRepository


class NotificationsService:
    """Business-logic stub — real rules land with domain features."""

    def __init__(self, repository: NotificationsRepository | None = None) -> None:
        self.repository = repository or NotificationsRepository()

    def ping(self) -> dict[str, str]:
        payload = self.repository.ping()
        payload["layer"] = "service"
        return payload
