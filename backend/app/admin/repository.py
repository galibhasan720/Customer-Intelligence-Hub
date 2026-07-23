"""Repository layer for the admin domain.

Admin stubs (Feature 14).
"""

from __future__ import annotations

from sqlalchemy.orm import Session


class AdminRepository:
    """Data-access stub — real queries land with domain features."""

    def __init__(self, db: Session | None = None) -> None:
        self.db = db

    def ping(self) -> dict[str, str]:
        return {"domain": "admin", "layer": "repository"}
