"""Repository layer for the notifications domain.

Notification stubs (Feature 12).
"""

from __future__ import annotations

from sqlalchemy.orm import Session


class NotificationsRepository:
    """Data-access stub — real queries land with domain features."""

    def __init__(self, db: Session | None = None) -> None:
        self.db = db

    def ping(self) -> dict[str, str]:
        return {"domain": "notifications", "layer": "repository"}
