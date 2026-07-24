"""Auth repository — profile lookups and creates."""

from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.users.models import Profile


class AuthRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def get_by_email(self, email: str) -> Profile | None:
        return self.db.scalar(
            select(Profile).where(Profile.email == email.lower().strip())
        )

    def create(
        self,
        *,
        full_name: str,
        email: str,
        password_hash: str,
        role: str,
    ) -> Profile:
        profile = Profile(
            full_name=full_name.strip(),
            email=email.lower().strip(),
            password_hash=password_hash,
            role=role,
            is_active=True,
        )
        self.db.add(profile)
        self.db.flush()
        return profile
