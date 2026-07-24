"""Venues business logic."""

from __future__ import annotations

from decimal import Decimal
from uuid import UUID

from sqlalchemy.orm import Session

from app.core.exceptions import ConflictError, NotFoundError
from app.users.models import Profile
from app.venues.models import HallBooking
from app.venues.repository import VenuesRepository
from app.venues.schemas import (
    HallBookingCreate,
    HallBookingOut,
    HallBookingUpdate,
    HallOut,
    VenueOut,
)

DEFAULT_IMAGE = (
    "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=800&q=80"
)


class VenuesService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.repository = VenuesRepository(db)

    def list_venues(self) -> list[VenueOut]:
        return [self._venue_out(v) for v in self.repository.list_venues()]

    def get_venue(self, venue_id: UUID) -> VenueOut:
        venue = self.repository.get_venue(venue_id)
        if venue is None or not venue.is_active:
            raise NotFoundError("Venue not found")
        return self._venue_out(venue)

    def list_halls(self, venue_id: UUID) -> list[HallOut]:
        venue = self.repository.get_venue(venue_id)
        if venue is None:
            raise NotFoundError("Venue not found")
        return [self._hall_out(h) for h in self.repository.list_halls(venue_id)]

    def list_my_bookings(self, user: Profile) -> list[HallBookingOut]:
        return [
            self._booking_out(b)
            for b in self.repository.list_bookings_for_user(user.id)
        ]

    def create_booking(self, user: Profile, payload: HallBookingCreate) -> HallBookingOut:
        venue = self.repository.get_venue(payload.venue_id)
        if venue is None:
            raise NotFoundError("Venue not found")
        hall = self.repository.get_hall(payload.hall_id)
        if hall is None or hall.venue_id != payload.venue_id:
            raise NotFoundError("Hall not found for this venue")
        if not hall.available:
            raise ConflictError("Hall is not available")

        total = self._price_for(hall, payload.duration_type, payload.add_ons)
        booking = HallBooking(
            user_id=user.id,
            venue_id=payload.venue_id,
            hall_id=payload.hall_id,
            booking_date=payload.booking_date,
            start_time=payload.start_time,
            end_time=payload.end_time,
            duration_type=payload.duration_type,
            purpose=payload.purpose,
            guest_count=payload.guest_count,
            add_ons=list(payload.add_ons),
            total=total,
            status="Confirmed",
            contact_name=payload.contact_name,
            contact_phone=payload.contact_phone,
            contact_email=payload.contact_email,
        )
        self.repository.create_booking(booking)
        self.db.commit()
        created = self.repository.get_booking_for_user(booking.id, user.id)
        assert created is not None
        return self._booking_out(created)

    def update_booking(
        self, user: Profile, booking_id: UUID, payload: HallBookingUpdate
    ) -> HallBookingOut:
        booking = self.repository.get_booking_for_user(booking_id, user.id)
        if booking is None:
            raise NotFoundError("Hall booking not found")
        if booking.status == "Cancelled":
            raise ConflictError("Cancelled bookings cannot be edited")

        data = payload.model_dump(exclude_unset=True)
        for key, value in data.items():
            setattr(booking, key, value)

        hall = booking.hall or self.repository.get_hall(booking.hall_id)
        if hall is not None and (
            "duration_type" in data or "add_ons" in data
        ):
            booking.total = self._price_for(
                hall, booking.duration_type, list(booking.add_ons or [])
            )

        self.db.commit()
        refreshed = self.repository.get_booking_for_user(booking_id, user.id)
        assert refreshed is not None
        return self._booking_out(refreshed)

    def cancel_booking(self, user: Profile, booking_id: UUID) -> HallBookingOut:
        booking = self.repository.get_booking_for_user(booking_id, user.id)
        if booking is None:
            raise NotFoundError("Hall booking not found")
        booking.status = "Cancelled"
        self.db.commit()
        refreshed = self.repository.get_booking_for_user(booking_id, user.id)
        assert refreshed is not None
        return self._booking_out(refreshed)

    def _price_for(self, hall, duration_type: str, add_ons: list[str]) -> Decimal:
        if duration_type == "full-day":
            base = hall.price_full_day
        elif duration_type == "half-day":
            base = hall.price_half_day
        else:
            base = hall.price_per_hour * 3
        # Simple add-on surcharge: 5000 each (matches FE demo pricing roughly)
        surcharge = Decimal(5000) * len(add_ons)
        return Decimal(base) + surcharge

    def _venue_out(self, venue) -> VenueOut:
        halls = venue.halls or []
        total_halls = len(halls) if halls else self.repository.hall_count(venue.id)
        return VenueOut(
            id=venue.id,
            name=venue.name,
            type=venue.type,
            address=venue.address,
            city=venue.city,
            image=venue.image or DEFAULT_IMAGE,
            rating=float(venue.rating or 0),
            review_count=int(venue.review_count or 0),
            total_halls=total_halls,
            price_from=float(venue.price_from or 0),
            description=venue.description or "",
            amenities=list(venue.amenities or []),
        )

    def _hall_out(self, hall) -> HallOut:
        return HallOut(
            id=hall.id,
            venue_id=hall.venue_id,
            name=hall.name,
            capacity=hall.capacity,
            area_sqft=hall.area_sqft,
            floor=hall.floor,
            price_per_hour=float(hall.price_per_hour or 0),
            price_half_day=float(hall.price_half_day or 0),
            price_full_day=float(hall.price_full_day or 0),
            amenities=list(hall.amenities or []),
            image=hall.image or DEFAULT_IMAGE,
            available=bool(hall.available),
        )

    def _booking_out(self, booking: HallBooking) -> HallBookingOut:
        return HallBookingOut(
            id=booking.id,
            venue_id=booking.venue_id,
            hall_id=booking.hall_id,
            venue_name=booking.venue.name if booking.venue else "",
            hall_name=booking.hall.name if booking.hall else "",
            booking_date=booking.booking_date,
            start_time=booking.start_time,
            end_time=booking.end_time,
            duration_type=booking.duration_type,
            purpose=booking.purpose,
            guest_count=booking.guest_count,
            add_ons=list(booking.add_ons or []),
            total=float(booking.total or 0),
            status=booking.status,
            booked_at=booking.created_at,
            contact_name=booking.contact_name,
            contact_phone=booking.contact_phone,
            contact_email=booking.contact_email,
        )
