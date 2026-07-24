"""SQLAlchemy models for venues, halls, and hall bookings."""

from __future__ import annotations

import uuid
from datetime import date, datetime
from decimal import Decimal

from sqlalchemy import (
    Boolean,
    Date,
    DateTime,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Text,
    func,
)
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.session import Base


class Venue(Base):
    __tablename__ = "venues"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    type: Mapped[str] = mapped_column(String(100), nullable=False)
    address: Mapped[str] = mapped_column(String(255), nullable=False)
    city: Mapped[str] = mapped_column(String(100), nullable=False, default="Dhaka")
    image = mapped_column(Text, nullable=True)
    rating: Mapped[Decimal] = mapped_column(Numeric(3, 2), nullable=False, default=0)
    review_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    price_from: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False, default=0)
    description = mapped_column(Text, nullable=True)
    amenities: Mapped[list] = mapped_column(JSONB, nullable=False, default=list)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    halls = relationship("Hall", back_populates="venue", cascade="all, delete-orphan")
    bookings = relationship("HallBooking", back_populates="venue")


class Hall(Base):
    __tablename__ = "halls"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    venue_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("venues.id", ondelete="CASCADE"), nullable=False
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    capacity: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    area_sqft: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    floor: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    price_per_hour: Mapped[Decimal] = mapped_column(
        Numeric(12, 2), nullable=False, default=0
    )
    price_half_day: Mapped[Decimal] = mapped_column(
        Numeric(12, 2), nullable=False, default=0
    )
    price_full_day: Mapped[Decimal] = mapped_column(
        Numeric(12, 2), nullable=False, default=0
    )
    amenities: Mapped[list] = mapped_column(JSONB, nullable=False, default=list)
    image = mapped_column(Text, nullable=True)
    available: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    venue = relationship("Venue", back_populates="halls")
    bookings = relationship("HallBooking", back_populates="hall")


class HallBooking(Base):
    __tablename__ = "hall_bookings"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("profiles.id"), nullable=False
    )
    venue_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("venues.id"), nullable=False
    )
    hall_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("halls.id"), nullable=False
    )
    booking_date: Mapped[date] = mapped_column(Date, nullable=False)
    start_time: Mapped[str] = mapped_column(String(16), nullable=False)
    end_time: Mapped[str] = mapped_column(String(16), nullable=False)
    duration_type: Mapped[str] = mapped_column(String(32), nullable=False)
    purpose: Mapped[str] = mapped_column(String(255), nullable=False)
    guest_count: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    add_ons: Mapped[list] = mapped_column(JSONB, nullable=False, default=list)
    total: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False, default=0)
    status: Mapped[str] = mapped_column(String(32), nullable=False, default="Confirmed")
    contact_name: Mapped[str] = mapped_column(String(255), nullable=False)
    contact_phone: Mapped[str] = mapped_column(String(64), nullable=False)
    contact_email = mapped_column(String(255), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    venue = relationship("Venue", back_populates="bookings")
    hall = relationship("Hall", back_populates="bookings")
