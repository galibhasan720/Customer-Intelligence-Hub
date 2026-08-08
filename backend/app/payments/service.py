"""Simulated payments service."""

from __future__ import annotations

from decimal import Decimal
from uuid import UUID

from sqlalchemy.orm import Session

from app.bookings.repository import BookingsRepository
from app.core.exceptions import ConflictError, ForbiddenError, NotFoundError
from app.payments.models import Payment
from app.payments.repository import PaymentsRepository
from app.payments.schemas import PaymentCreate, PaymentOut
from app.users.models import Profile
from app.venues.repository import VenuesRepository


class PaymentsService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.repository = PaymentsRepository(db)
        self.bookings = BookingsRepository(db)
        self.venues = VenuesRepository(db)

    def _to_out(self, row: Payment) -> PaymentOut:
        return PaymentOut(
            id=row.id,
            user_id=row.user_id,
            booking_id=row.booking_id,
            hall_booking_id=row.hall_booking_id,
            method=row.method,
            amount=float(row.amount or 0),
            status=row.status,
            created_at=row.created_at,
        )

    def list_mine(self, user: Profile) -> list[PaymentOut]:
        return [self._to_out(p) for p in self.repository.list_for_user(user.id)]

    def get(self, user: Profile, payment_id: UUID) -> PaymentOut:
        row = self.repository.get(payment_id)
        if row is None:
            raise NotFoundError("Payment not found")
        if user.role != "admin" and row.user_id != user.id:
            raise ForbiddenError("Not allowed to view this payment")
        return self._to_out(row)

    def create(self, user: Profile, payload: PaymentCreate) -> PaymentOut:
        amount = Decimal("0")
        booking = None
        hall_booking = None
        if payload.booking_id:
            booking = self.bookings.get(payload.booking_id)
            if booking is None:
                raise NotFoundError("Booking not found")
            if user.role != "admin" and booking.user_id != user.id:
                raise ForbiddenError("Not allowed to pay for this booking")
            amount = Decimal(str(self._booking_total(booking)))
            if booking.status == "Pending":
                booking.status = "Confirmed"
        else:
            assert payload.hall_booking_id is not None
            hall_booking = self.venues.get_booking(payload.hall_booking_id)
            if hall_booking is None:
                raise NotFoundError("Hall booking not found")
            if user.role != "admin" and hall_booking.user_id != user.id:
                raise ForbiddenError("Not allowed to pay for this hall booking")
            amount = Decimal(str(hall_booking.total or 0))
            if hall_booking.status == "Pending":
                hall_booking.status = "Confirmed"

        row = Payment(
            user_id=user.id,
            booking_id=payload.booking_id,
            hall_booking_id=payload.hall_booking_id,
            method=payload.method,
            amount=amount,
            status="Paid",
        )
        self.db.add(row)
        self.db.commit()
        self.db.refresh(row)
        return self._to_out(row)

    def refund(self, payment_id: UUID) -> PaymentOut:
        row = self.repository.get(payment_id)
        if row is None:
            raise NotFoundError("Payment not found")
        if row.status == "Refunded":
            return self._to_out(row)
        if row.status != "Paid":
            raise ConflictError("Only paid payments can be refunded")
        row.status = "Refunded"
        self.db.commit()
        self.db.refresh(row)
        return self._to_out(row)

    def _booking_total(self, booking) -> float:
        event = booking.event
        base = float(event.price) if event else 0.0
        total = 0.0
        for link in booking.booking_seats:
            if link.seat is None:
                continue
            total += base * 2 if link.seat.category == "VIP" else base
        return total
