"""Bookings service."""

from __future__ import annotations

from uuid import UUID

from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.bookings.models import Booking, BookingSeat
from app.bookings.repository import BookingsRepository
from app.bookings.schemas import BookingCreate, BookingOut
from app.core.exceptions import ConflictError, NotFoundError
from app.events.repository import EventsRepository
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

    def create(self, user: Profile, payload: BookingCreate) -> BookingOut:
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
            if seat.status != "Available":
                raise ConflictError(f"Seat {seat.seat_number} is not available")

        booking = Booking(
            user_id=user.id,
            event_id=event.id,
            status="Confirmed",
        )
        self.repository.create(booking)
        for seat in seats:
            seat.status = "Booked"
            self.db.add(BookingSeat(booking_id=booking.id, seat_id=seat.id))

        try:
            self.db.commit()
        except IntegrityError as exc:
            self.db.rollback()
            raise ConflictError("One or more seats were just booked by someone else") from exc

        created = self.repository.get_for_user(booking.id, user.id)
        assert created is not None
        return self._to_out(created)

    def cancel(self, user: Profile, booking_id: UUID) -> BookingOut:
        booking = self.repository.get_for_user(booking_id, user.id)
        if booking is None:
            raise NotFoundError("Booking not found")
        if booking.status == "Cancelled":
            return self._to_out(booking)
        booking.status = "Cancelled"
        for link in booking.booking_seats:
            if link.seat is not None:
                link.seat.status = "Available"
        # Remove join rows so UNIQUE(seat_id) allows rebooking
        for link in list(booking.booking_seats):
            self.db.delete(link)
        self.db.commit()
        refreshed = self.repository.get_for_user(booking_id, user.id)
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
        )
