"""SQLAlchemy models for user profiles."""

import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, String, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.session import Base


class Profile(Base):
    """Application user profile (local JWT auth uses password_hash)."""

    __tablename__ = "profiles"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[str] = mapped_column(String(32), nullable=False, default="customer")
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    organization_name = mapped_column(String(255), nullable=True)
    bio = mapped_column(Text, nullable=True)
    phone = mapped_column(String(64), nullable=True)
    website = mapped_column(String(255), nullable=True)
    city = mapped_column(String(100), nullable=True)
    address = mapped_column(String(255), nullable=True)
    verified: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    organized_events = relationship("Event", back_populates="organizer")
    bookings = relationship("Booking", back_populates="user")
    notifications = relationship("Notification", back_populates="user")
