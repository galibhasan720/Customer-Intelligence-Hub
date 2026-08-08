"""Users repository."""

from __future__ import annotations

from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.bookings.models import Booking
from app.events.models import Event
from app.users.models import Profile


class UsersRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def get(self, user_id: UUID) -> Profile | None:
        return self.db.get(Profile, user_id)

    def list_all(self) -> list[Profile]:
        stmt = select(Profile).order_by(Profile.created_at.desc())
        return list(self.db.scalars(stmt).all())

    def events_created(self, user_id: UUID) -> int:
        return int(
            self.db.scalar(
                select(func.count()).select_from(Event).where(Event.organizer_id == user_id)
            )
            or 0
        )

    def total_bookings(self, user_id: UUID) -> int:
        return int(
            self.db.scalar(
                select(func.count()).select_from(Booking).where(Booking.user_id == user_id)
            )
            or 0
        )
