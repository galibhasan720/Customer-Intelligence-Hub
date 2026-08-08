"""Bookings service."""

from __future__ import annotations

from datetime import datetime, timezone
from decimal import Decimal
from uuid import UUID

from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.bookings.models import Booking, BookingSeat
from app.bookings.repository import BookingsRepository
from app.bookings.schemas import BookingCreate, BookingOut, BookingUpdate
from app.core.exceptions import ConflictError, ForbiddenError, NotFoundError
from app.events.repository import EventsRepository
from app.notifications.service import notify
from app.payments.models import Payment
from app.seats.repository import SeatsRepository
from app.users.models import Profile


class BookingsService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.repository = BookingsRepository(db)
        self.events = EventsRepository(db)
        self.seats = SeatsRepository(db)

    def list_mine(self, user: Profile) -> list[BookingOut]:
        return [self._to_out(b) for b in self.repository.list_for_user(user.id)]

    def list_all(self) -> list[BookingOut]:
        return [self._to_out(b) for b in self.repository.list_all()]

    def get(self, user: Profile, booking_id: UUID) -> BookingOut:
        booking = self.repository.get(booking_id)
        if booking is None:
            raise NotFoundError("Booking not found")
        if user.role != "admin" and booking.user_id != user.id:
            raise ForbiddenError("Not allowed to view this booking")
        return self._to_out(booking)

    def _seat_available_for(self, seat, user: Profile) -> bool:
        now = datetime.now(timezone.utc)
        if seat.status == "Available":
            return True
        if seat.status == "Locked" and seat.locked_by_user_id == user.id:
            if seat.locked_until is None or seat.locked_until > now:
                return True
        return False

    def create(self, user: Profile, payload: BookingCreate) -> BookingOut:
        self.seats.release_expired_locks(payload.event_id)
        event = self.events.get(payload.event_id)
        if event is None:
            raise NotFoundError("Event not found")
        if event.status != "Published" or not event.booking_window_open:
            raise ConflictError("Booking is not open for this event")

        seats = self.seats.get_many(payload.seat_ids)
        if len(seats) != len(set(payload.seat_ids)):
            raise NotFoundError("One or more seats not found")
        for seat in seats:
            if seat.event_id != event.id:
                raise ConflictError("Seat does not belong to this event")
            if not self._seat_available_for(seat, user):
                raise ConflictError(f"Seat {seat.seat_number} is not available")

        booking = Booking(
            user_id=user.id,
            event_id=event.id,
            status="Confirmed",
            guest_name=payload.guest_name or user.full_name,
            guest_email=payload.guest_email or user.email,
        )
        self.repository.create(booking)
        total = Decimal("0")
        base = Decimal(str(event.price or 0))
        for seat in seats:
            seat.status = "Booked"
            seat.locked_until = None
            seat.locked_by_user_id = None
            self.db.add(BookingSeat(booking_id=booking.id, seat_id=seat.id))
            total += base * 2 if seat.category == "VIP" else base

        self.db.add(
            Payment(
                user_id=user.id,
                booking_id=booking.id,
                method="card",
                amount=total,
                status="Paid",
            )
        )
        notify(
            self.db,
            user_id=user.id,
            ntype="booking_confirmed",
            title="Booking confirmed",
            message=f"Your booking for {event.title} is confirmed.",
            event_id=event.id,
            booking_id=booking.id,
        )

        try:
            self.db.commit()
        except IntegrityError as exc:
            self.db.rollback()
            raise ConflictError("One or more seats were just booked by someone else") from exc

        created = self.repository.get(booking.id)
        assert created is not None
        return self._to_out(created)

    def update(self, user: Profile, booking_id: UUID, payload: BookingUpdate) -> BookingOut:
        booking = self.repository.get(booking_id)
        if booking is None:
            raise NotFoundError("Booking not found")
        if user.role != "admin" and booking.user_id != user.id:
            raise ForbiddenError("Not allowed to update this booking")
        if booking.status == "Cancelled":
            raise ConflictError("Cancelled bookings cannot be edited")
        data = payload.model_dump(exclude_unset=True)
        for key, value in data.items():
            setattr(booking, key, value)
        self.db.commit()
        refreshed = self.repository.get(booking_id)
        assert refreshed is not None
        return self._to_out(refreshed)

    def cancel(self, user: Profile, booking_id: UUID, *, force: bool = False) -> BookingOut:
        booking = self.repository.get(booking_id)
        if booking is None:
            raise NotFoundError("Booking not found")
        if not force and user.role != "admin" and booking.user_id != user.id:
            raise ForbiddenError("Not allowed to cancel this booking")
        if force and user.role != "admin":
            raise ForbiddenError("Admin role required")
        if booking.status == "Cancelled":
            return self._to_out(booking)
        booking.status = "Cancelled"
        for link in booking.booking_seats:
            if link.seat is not None:
                link.seat.status = "Available"
                link.seat.locked_until = None
                link.seat.locked_by_user_id = None
        for link in list(booking.booking_seats):
            self.db.delete(link)
        notify(
            self.db,
            user_id=booking.user_id,
            ntype="booking_cancelled",
            title="Booking cancelled",
            message=f"Your booking for {booking.event.title if booking.event else 'an event'} was cancelled.",
            event_id=booking.event_id,
            booking_id=booking.id,
        )
        self.db.commit()
        refreshed = self.repository.get(booking_id)
        assert refreshed is not None
        return self._to_out(refreshed)

    def _to_out(self, booking: Booking) -> BookingOut:
        event = booking.event
        seat_numbers: list[str] = []
        seat_ids: list[UUID] = []
        total = 0.0
        base = float(event.price) if event else 0.0
        for link in booking.booking_seats:
            if link.seat is None:
                continue
            seat_numbers.append(link.seat.seat_number)
            seat_ids.append(link.seat.id)
            total += base * 2 if link.seat.category == "VIP" else base
        return BookingOut(
            id=booking.id,
            event_id=booking.event_id,
            event_title=event.title if event else "",
            venue=event.venue if event else "",
            event_date=event.event_date if event else booking.created_at,
            seats=seat_numbers,
            seat_ids=seat_ids,
            total=total,
            status=booking.status,
            booked_at=booking.created_at,
            guest_name=booking.guest_name,
            guest_email=booking.guest_email,
        )
