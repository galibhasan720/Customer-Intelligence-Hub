"""Shared seed/auth helpers for pytest."""

from __future__ import annotations

from datetime import datetime, timedelta, timezone
from decimal import Decimal

from fastapi.testclient import TestClient
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.addons.models import AddOn
from app.core.security import hash_password
from app.events.models import Category, Event
from app.seats.models import Seat
from app.users.models import Profile


def seed_user(
    db: Session,
    *,
    email: str,
    role: str,
    full_name: str | None = None,
    password: str = "password123",
) -> Profile:
    user = Profile(
        full_name=full_name or email.split("@")[0].title(),
        email=email,
        password_hash=hash_password(password),
        role=role,
        is_active=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def auth_header(client: TestClient, email: str, password: str = "password123") -> dict[str, str]:
    response = client.post("/api/v1/auth/login", json={"email": email, "password": password})
    assert response.status_code == 200, response.text
    return {"Authorization": f"Bearer {response.json()['access_token']}"}


def seed_published_event(db: Session, organizer: Profile, *, title: str = "Test Concert") -> Event:
    category = db.scalar(select(Category).where(Category.name == "Concert"))
    if category is None:
        category = Category(name="Concert", description="Live music")
        db.add(category)
        db.flush()
    event = Event(
        organizer_id=organizer.id,
        category_id=category.id,
        title=title,
        description="A test event",
        venue="Test Venue",
        event_date=datetime.now(timezone.utc) + timedelta(days=14),
        price=Decimal("500.00"),
        status="Published",
        booking_window_open=True,
    )
    db.add(event)
    db.flush()
    db.add_all(
        [
            Seat(event_id=event.id, seat_number="S-1", category="Standard", status="Available"),
            Seat(event_id=event.id, seat_number="S-2", category="Standard", status="Available"),
            Seat(event_id=event.id, seat_number="V-1", category="VIP", status="Available"),
        ]
    )
    db.commit()
    db.refresh(event)
    return event


def seed_addon(db: Session, addon_id: str = "catering") -> AddOn:
    row = AddOn(
        id=addon_id,
        label="Catering Service",
        price=Decimal("500.00"),
        unit="per_person",
        is_active=True,
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return row
