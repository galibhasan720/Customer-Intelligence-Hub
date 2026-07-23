"""Seed demo categories, events, and seats for viva demos."""

from __future__ import annotations

import os
import sys
import uuid
from datetime import datetime, timedelta, timezone
from decimal import Decimal
from pathlib import Path

BACKEND_ROOT = Path(__file__).resolve().parent.parent
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))

from sqlalchemy import select  # noqa: E402

from app.config import get_settings  # noqa: E402
from app.database.client import is_placeholder_database_url  # noqa: E402
from app.database.session import SessionLocal  # noqa: E402
from app.events.models import Category, Event  # noqa: E402
from app.seats.models import Seat  # noqa: E402
from app.users.models import Profile  # noqa: E402

# Import remaining models so mappers resolve relationships.
import app.bookings.models  # noqa: E402, F401
import app.notifications.models  # noqa: E402, F401

DEMO_CATEGORIES = [
    ("Concert", "Live music and performances"),
    ("Conference", "Professional and tech conferences"),
    ("Theatre", "Stage plays and cultural shows"),
    ("Sports", "Matches and tournaments"),
]

DEMO_EVENTS = [
    {
        "title": "Artcell Live — Dhaka Concert Night",
        "category": "Concert",
        "venue": "Bashundhara International Convention City",
        "price": Decimal("500.00"),
        "days_ahead": 30,
        "vip": 8,
        "standard": 16,
    },
    {
        "title": "DigitalBangladesh TechSummit 2025",
        "category": "Conference",
        "venue": "Bangladesh-China Friendship Conference Centre",
        "price": Decimal("1500.00"),
        "days_ahead": 45,
        "vip": 6,
        "standard": 18,
    },
]


def _resolve_organizer_id(db) -> uuid.UUID | None:
    raw = os.getenv("SEED_ORGANIZER_ID", "").strip()
    if raw:
        try:
            organizer_id = uuid.UUID(raw)
        except ValueError:
            print(f"ERROR: SEED_ORGANIZER_ID is not a valid UUID: {raw}")
            return None
        profile = db.get(Profile, organizer_id)
        if profile is None:
            print(
                f"ERROR: No profiles row for SEED_ORGANIZER_ID={organizer_id}.\n"
                "Create a Supabase Auth user, insert a profiles row (role=organizer), "
                "then re-run seed."
            )
            return None
        return organizer_id

    existing = db.scalar(
        select(Profile).where(Profile.role.in_(("organizer", "admin"))).limit(1)
    )
    if existing:
        return existing.id

    print(
        "SKIP events/seats: no organizer profile found.\n"
        "Steps:\n"
        "1. Supabase → Authentication → Users → Add user (email + password).\n"
        "2. Copy the user UUID.\n"
        "3. In SQL Editor run:\n"
        "   INSERT INTO profiles (id, full_name, email, role)\n"
        "   VALUES ('<USER_UUID>', 'Demo Organizer', 'organizer@example.com', 'organizer');\n"
        "4. Set SEED_ORGANIZER_ID=<USER_UUID> in backend/.env (optional if role=organizer).\n"
        "5. Re-run: python -m scripts.seed_data\n"
        "Categories will still be seeded if missing."
    )
    return None


def _ensure_categories(db) -> dict[str, Category]:
    by_name: dict[str, Category] = {}
    for name, description in DEMO_CATEGORIES:
        row = db.scalar(select(Category).where(Category.name == name))
        if row is None:
            row = Category(name=name, description=description, is_active=True)
            db.add(row)
            db.flush()
            print(f"  + category {name}")
        by_name[name] = row
    return by_name


def _ensure_event_with_seats(
    db,
    *,
    organizer_id: uuid.UUID,
    categories: dict[str, Category],
    spec: dict,
) -> None:
    existing = db.scalar(select(Event).where(Event.title == spec["title"]))
    if existing is not None:
        print(f"  = event exists: {spec['title']}")
        return

    event = Event(
        organizer_id=organizer_id,
        category_id=categories[spec["category"]].id,
        title=spec["title"],
        description=f"Seeded demo event: {spec['title']}",
        venue=spec["venue"],
        event_date=datetime.now(timezone.utc) + timedelta(days=spec["days_ahead"]),
        price=spec["price"],
        status="Published",
        booking_window_open=True,
    )
    db.add(event)
    db.flush()

    seats: list[Seat] = []
    for i in range(1, spec["vip"] + 1):
        seats.append(
            Seat(
                event_id=event.id,
                seat_number=f"V-{i}",
                category="VIP",
                status="Available",
            )
        )
    for i in range(1, spec["standard"] + 1):
        seats.append(
            Seat(
                event_id=event.id,
                seat_number=f"S-{i}",
                category="Standard",
                status="Available",
            )
        )
    db.add_all(seats)
    print(f"  + event {spec['title']} ({len(seats)} seats)")


def seed() -> int:
    settings = get_settings()
    if is_placeholder_database_url(settings.database_url) or SessionLocal is None:
        print(
            "SKIP: DATABASE_URL is missing or still has placeholders.\n"
            "Fill backend/.env, apply migrations, then re-run seed."
        )
        return 1

    db = SessionLocal()
    try:
        print("Seeding categories...")
        categories = _ensure_categories(db)
        db.commit()

        organizer_id = _resolve_organizer_id(db)
        if organizer_id is not None:
            print(f"Seeding events/seats for organizer {organizer_id}...")
            for spec in DEMO_EVENTS:
                _ensure_event_with_seats(
                    db,
                    organizer_id=organizer_id,
                    categories=categories,
                    spec=spec,
                )
            db.commit()
        else:
            db.rollback()

        print("Seed complete.")
        return 0
    except Exception as exc:  # noqa: BLE001
        db.rollback()
        print(f"FAILED: {exc.__class__.__name__}: {exc}")
        return 1
    finally:
        db.close()


if __name__ == "__main__":
    raise SystemExit(seed())
