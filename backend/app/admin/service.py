"""Service layer for the admin domain.

Admin stubs (Feature 14).
"""

from __future__ import annotations

from app.admin.repository import AdminRepository


class AdminService:
    """Business-logic stub — real rules land with domain features."""

    def __init__(self, repository: AdminRepository | None = None) -> None:
        self.repository = repository or AdminRepository()

    def ping(self) -> dict[str, str]:
        payload = self.repository.ping()
        payload["layer"] = "service"
        return payload
