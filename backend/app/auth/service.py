"""Authentication stubs (Feature 2)."""

from __future__ import annotations

from app.auth.repository import AuthRepository


class AuthService:
    """Business-logic stub — real rules land with domain features."""

    def __init__(self, repository: AuthRepository | None = None) -> None:
        self.repository = repository or AuthRepository()

    def ping(self) -> dict[str, str]:
        payload = self.repository.ping()
        payload["layer"] = "service"
        return payload
