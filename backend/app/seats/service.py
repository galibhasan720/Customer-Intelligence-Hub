"""Seats service."""

from __future__ import annotations

from datetime import datetime, timedelta, timezone
from uuid import UUID

from sqlalchemy.orm import Session

from app.core.exceptions import ConflictError, ForbiddenError, NotFoundError
from app.events.repository import EventsRepository
from app.seats.repository import SeatsRepository
from app.seats.schemas import SeatHoldRequest, SeatOut, SeatReleaseRequest
from app.users.models import Profile

HOLD_MINUTES = 10


class SeatsService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.repository = SeatsRepository(db)
        self.events = EventsRepository(db)

    def list_for_event(self, event_id: UUID) -> list[SeatOut]:
        event = self.events.get(event_id)
        if event is None:
            raise NotFoundError("Event not found")
        self.repository.release_expired_locks(event_id)
        self.db.commit()
        base = float(event.price)
        seats = self.repository.list_for_event(event_id)
        out: list[SeatOut] = []
        for seat in seats:
            price = base * 2 if seat.category == "VIP" else base
            out.append(
                SeatOut(
                    id=seat.id,
                    seat_number=seat.seat_number,
                    category=seat.category,
                    status=seat.status,
                    price=price,
                )
            )
        return out

    def hold(self, user: Profile, event_id: UUID, payload: SeatHoldRequest) -> list[SeatOut]:
        event = self.events.get(event_id)
        if event is None:
            raise NotFoundError("Event not found")
        self.repository.release_expired_locks(event_id)
        if len(payload.seat_ids) > 6:
            raise ConflictError("You can hold at most 6 seats")
        seats = self.repository.get_many(payload.seat_ids)
        if len(seats) != len(set(payload.seat_ids)):
            raise NotFoundError("One or more seats not found")
        until = datetime.now(timezone.utc) + timedelta(minutes=HOLD_MINUTES)
        for seat in seats:
            if seat.event_id != event_id:
                raise ConflictError("Seat does not belong to this event")
            if seat.status == "Booked":
                raise ConflictError(f"Seat {seat.seat_number} is not available")
            if seat.status == "Locked" and seat.locked_by_user_id not in (None, user.id):
                raise ConflictError(f"Seat {seat.seat_number} is held by someone else")
            seat.status = "Locked"
            seat.locked_until = until
            seat.locked_by_user_id = user.id
        self.db.commit()
        return self.list_for_event(event_id)

    def release(self, user: Profile, event_id: UUID, payload: SeatReleaseRequest) -> list[SeatOut]:
        self.repository.release_expired_locks(event_id)
        seats = self.repository.get_many(payload.seat_ids)
        if len(seats) != len(set(payload.seat_ids)):
            raise NotFoundError("One or more seats not found")
        for seat in seats:
            if seat.event_id != event_id:
                raise ConflictError("Seat does not belong to this event")
            if seat.status != "Locked":
                continue
            if user.role != "admin" and seat.locked_by_user_id != user.id:
                raise ForbiddenError("Not allowed to release this hold")
            seat.status = "Available"
            seat.locked_until = None
            seat.locked_by_user_id = None
        self.db.commit()
        return self.list_for_event(event_id)
