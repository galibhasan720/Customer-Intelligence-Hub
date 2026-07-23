"""Repository layer for the users domain.

User profile stubs (Features 2-3).
"""

from __future__ import annotations

from sqlalchemy.orm import Session


class UsersRepository:
    """Data-access stub — real queries land with domain features."""

    def __init__(self, db: Session | None = None) -> None:
        self.db = db

    def ping(self) -> dict[str, str]:
        return {"domain": "users", "layer": "repository"}
