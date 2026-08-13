"""Venues / halls / hall-booking schemas."""

from __future__ import annotations

from datetime import date, datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, Field


class VenueCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    type: str = Field(min_length=1, max_length=100)
    address: str = Field(min_length=1, max_length=255)
    city: str = Field(default="Dhaka", max_length=100)
    image: str | None = None
    rating: float = 0
    review_count: int = 0
    price_from: float = 0
    description: str = ""
    amenities: list[str] = Field(default_factory=list)


class VenueUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=255)
    type: str | None = Field(default=None, min_length=1, max_length=100)
    address: str | None = Field(default=None, min_length=1, max_length=255)
    city: str | None = Field(default=None, max_length=100)
    image: str | None = None
    rating: float | None = None
    review_count: int | None = None
    price_from: float | None = None
    description: str | None = None
    amenities: list[str] | None = None
    is_active: bool | None = None


class HallCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    capacity: int = 0
    area_sqft: int = 0
    floor: int = 1
    price_per_hour: float = 0
    price_half_day: float = 0
    price_full_day: float = 0
    amenities: list[str] = Field(default_factory=list)
    image: str | None = None
    available: bool = True


class HallUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=255)
    capacity: int | None = None
    area_sqft: int | None = None
    floor: int | None = None
    price_per_hour: float | None = None
    price_half_day: float | None = None
    price_full_day: float | None = None
    amenities: list[str] | None = None
    image: str | None = None
    available: bool | None = None


class VenueOut(BaseModel):
    id: UUID
    name: str
    type: str
    address: str
    city: str
    image: str
    rating: float
    review_count: int
    total_halls: int
    price_from: float
    description: str
    amenities: list[str]

    model_config = {"from_attributes": True}


class HallOut(BaseModel):
    id: UUID
    venue_id: UUID
    name: str
    capacity: int
    area_sqft: int
    floor: int
    price_per_hour: float
    price_half_day: float
    price_full_day: float
    amenities: list[str]
    image: str
    available: bool

    model_config = {"from_attributes": True}


class HallBookingCreate(BaseModel):
    venue_id: UUID
    hall_id: UUID
    booking_date: date
    start_time: str = Field(min_length=1, max_length=16)
    end_time: str = Field(min_length=1, max_length=16)
    duration_type: str = Field(pattern="^(hourly|half-day|full-day)$")
    purpose: str = Field(min_length=1, max_length=255)
    guest_count: int = Field(default=1, ge=1, le=10000)
    add_ons: list[str] = Field(default_factory=list)
    contact_name: str = Field(min_length=1, max_length=255)
    contact_phone: str = Field(min_length=1, max_length=64)
    contact_email: str | None = None


class HallBookingUpdate(BaseModel):
    booking_date: date | None = None
    start_time: str | None = Field(default=None, min_length=1, max_length=16)
    end_time: str | None = Field(default=None, min_length=1, max_length=16)
    duration_type: str | None = Field(
        default=None, pattern="^(hourly|half-day|full-day)$"
    )
    purpose: str | None = Field(default=None, min_length=1, max_length=255)
    guest_count: int | None = Field(default=None, ge=1, le=10000)
    add_ons: list[str] | None = None
    contact_name: str | None = Field(default=None, min_length=1, max_length=255)
    contact_phone: str | None = Field(default=None, min_length=1, max_length=64)
    contact_email: str | None = None


class HallBookingOut(BaseModel):
    id: UUID
    venue_id: UUID
    hall_id: UUID
    venue_name: str
    hall_name: str
    booking_date: date
    start_time: str
    end_time: str
    duration_type: str
    purpose: str
    guest_count: int
    add_ons: list[str]
    total: float
    status: str
    booked_at: datetime
    contact_name: str
    contact_phone: str
    contact_email: str | None = None

    model_config = {"from_attributes": True}
