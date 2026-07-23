"""Service layer for the users domain.

User profile stubs (Features 2-3).
"""

from __future__ import annotations

from app.users.repository import UsersRepository


class UsersService:
    """Business-logic stub — real rules land with domain features."""

    def __init__(self, repository: UsersRepository | None = None) -> None:
        self.repository = repository or UsersRepository()

    def ping(self) -> dict[str, str]:
        payload = self.repository.ping()
        payload["layer"] = "service"
        return payload
