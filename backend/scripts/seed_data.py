"""Seed demo users, categories, events, seats, and bookings for local development."""

from __future__ import annotations

import sys
import uuid
from datetime import datetime, timedelta, timezone
from decimal import Decimal
from pathlib import Path

BACKEND_ROOT = Path(__file__).resolve().parent.parent
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))

from sqlalchemy import select  # noqa: E402
from sqlalchemy.orm import joinedload  # noqa: E402

from app.bookings.models import Booking, BookingSeat  # noqa: E402
from app.config import get_settings  # noqa: E402
from app.core.security import hash_password  # noqa: E402
from app.database.client import is_placeholder_database_url  # noqa: E402
from app.database.session import SessionLocal  # noqa: E402
from app.events.models import Category, Event  # noqa: E402
from app.seats.models import Seat  # noqa: E402
from app.users.models import Profile  # noqa: E402
from app.venues.models import Hall, Venue  # noqa: E402

import app.notifications.models  # noqa: E402, F401
import app.venues.models as _venues_models  # noqa: E402, F401

DEMO_PASSWORD = "password123"

DEMO_USERS = [
    {"email": "admin@example.com", "full_name": "Demo Admin", "role": "admin"},
    {
        "email": "rahim.organizer@example.com",
        "full_name": "Rahim Uddin Ahmed",
        "role": "organizer",
    },
    {
        "email": "sadia.organizer@example.com",
        "full_name": "Sadia Rahman",
        "role": "organizer",
    },
    {
        "email": "imran.organizer@example.com",
        "full_name": "Imran Chowdhury",
        "role": "organizer",
    },
    {
        "email": "laila.organizer@example.com",
        "full_name": "Laila Karim",
        "role": "organizer",
    },
    {
        "email": "farhana.customer@example.com",
        "full_name": "Farhana Akter",
        "role": "customer",
    },
    {
        "email": "tanvir.customer@example.com",
        "full_name": "Tanvir Hasan",
        "role": "customer",
    },
    {
        "email": "nusrat.customer@example.com",
        "full_name": "Nusrat Jahan",
        "role": "customer",
    },
]

DEMO_CATEGORIES = [
    ("Concert", "Live music and performances"),
    ("Conference", "Professional and tech conferences"),
    ("Theatre", "Stage plays and cultural shows"),
    ("Sports", "Matches and tournaments"),
]

# Events keyed by organizer email
DEMO_EVENTS_BY_ORGANIZER: dict[str, list[dict]] = {
    "rahim.organizer@example.com": [
        {
            "title": "Artcell Live — Dhaka Concert Night",
            "category": "Concert",
            "venue": "Bashundhara International Convention City",
            "price": Decimal("500.00"),
            "days_ahead": 30,
            "vip": 8,
            "standard": 24,
        },
        {
            "title": "Coke Studio Bangla Night",
            "category": "Concert",
            "venue": "Army Stadium",
            "price": Decimal("800.00"),
            "days_ahead": 55,
            "vip": 10,
            "standard": 30,
        },
    ],
    "sadia.organizer@example.com": [
        {
            "title": "DigitalBangladesh TechSummit 2026",
            "category": "Conference",
            "venue": "Bangladesh-China Friendship Conference Centre",
            "price": Decimal("1500.00"),
            "days_ahead": 45,
            "vip": 6,
            "standard": 28,
        },
        {
            "title": "Women in STEM Leadership Forum",
            "category": "Conference",
            "venue": "Pan Pacific Sonargaon Dhaka",
            "price": Decimal("1200.00"),
            "days_ahead": 38,
            "vip": 6,
            "standard": 20,
        },
    ],
    "imran.organizer@example.com": [
        {
            "title": "Nuruldiner Sarajiban — Stage Play",
            "category": "Theatre",
            "venue": "Bangladesh Shilpakala Academy",
            "price": Decimal("300.00"),
            "days_ahead": 20,
            "vip": 4,
            "standard": 22,
        },
        {
            "title": "Hamlet — Bangla Adaptation",
            "category": "Theatre",
            "venue": "National Theatre Hall",
            "price": Decimal("450.00"),
            "days_ahead": 28,
            "vip": 5,
            "standard": 18,
        },
    ],
    "laila.organizer@example.com": [
        {
            "title": "BPL Final Watch Party — Dhaka",
            "category": "Sports",
            "venue": "Mirpur Indoor Stadium",
            "price": Decimal("600.00"),
            "days_ahead": 15,
            "vip": 8,
            "standard": 26,
        },
        {
            "title": "Dhaka Marathon Expo Day",
            "category": "Sports",
            "venue": "Hatirjheel Amphitheatre",
            "price": Decimal("250.00"),
            "days_ahead": 12,
            "vip": 4,
            "standard": 32,
        },
    ],
}

# Realistic booking specs: customer email, event title, seat numbers, status, days_ago
DEMO_BOOKINGS = [
    {
        "customer": "farhana.customer@example.com",
        "event": "Artcell Live — Dhaka Concert Night",
        "seats": ["V-1", "S-1"],
        "status": "Confirmed",
        "days_ago": 1,
    },
    {
        "customer": "farhana.customer@example.com",
        "event": "Women in STEM Leadership Forum",
        "seats": ["S-2", "S-3"],
        "status": "Confirmed",
        "days_ago": 3,
    },
    {
        "customer": "farhana.customer@example.com",
        "event": "BPL Final Watch Party — Dhaka",
        "seats": ["V-2"],
        "status": "Cancelled",
        "days_ago": 5,
    },
    {
        "customer": "tanvir.customer@example.com",
        "event": "DigitalBangladesh TechSummit 2026",
        "seats": ["V-1", "S-1", "S-2"],
        "status": "Confirmed",
        "days_ago": 0,
    },
    {
        "customer": "tanvir.customer@example.com",
        "event": "Coke Studio Bangla Night",
        "seats": ["S-4", "S-5"],
        "status": "Confirmed",
        "days_ago": 2,
    },
    {
        "customer": "tanvir.customer@example.com",
        "event": "Hamlet — Bangla Adaptation",
        "seats": ["S-1"],
        "status": "Pending",
        "days_ago": 1,
    },
    {
        "customer": "nusrat.customer@example.com",
        "event": "Nuruldiner Sarajiban — Stage Play",
        "seats": ["V-1", "S-3", "S-4"],
        "status": "Confirmed",
        "days_ago": 4,
    },
    {
        "customer": "nusrat.customer@example.com",
        "event": "Dhaka Marathon Expo Day",
        "seats": ["S-1", "S-2", "S-3", "S-4"],
        "status": "Confirmed",
        "days_ago": 6,
    },
    {
        "customer": "nusrat.customer@example.com",
        "event": "Artcell Live — Dhaka Concert Night",
        "seats": ["S-6"],
        "status": "Cancelled",
        "days_ago": 2,
    },
    {
        "customer": "farhana.customer@example.com",
        "event": "DigitalBangladesh TechSummit 2026",
        "seats": ["S-5"],
        "status": "Confirmed",
        "days_ago": 6,
    },
]

DEMO_VENUES = [
    {
        "name": "Bashundhara International Convention City",
        "type": "Convention Centre",
        "address": "Purbachal Express Highway",
        "city": "Dhaka",
        "image": "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&q=80",
        "rating": Decimal("4.70"),
        "review_count": 412,
        "price_from": Decimal("35000"),
        "description": "Bangladesh's premier convention destination with world-class halls and facilities.",
        "amenities": ["WiFi", "Parking", "Catering", "AV Equipment", "AC", "Generator", "Security"],
        "halls": [
            {
                "name": "Grand Ballroom",
                "capacity": 2000,
                "area_sqft": 45000,
                "floor": 1,
                "price_per_hour": Decimal("15000"),
                "price_half_day": Decimal("60000"),
                "price_full_day": Decimal("100000"),
                "amenities": ["Stage", "AV System", "LED Wall", "Catering", "VIP Room"],
                "image": "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=800&q=80",
                "available": True,
            },
            {
                "name": "Hall A",
                "capacity": 500,
                "area_sqft": 10000,
                "floor": 2,
                "price_per_hour": Decimal("5000"),
                "price_half_day": Decimal("20000"),
                "price_full_day": Decimal("35000"),
                "amenities": ["AV System", "Stage", "Catering", "AC"],
                "image": "https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=80",
                "available": True,
            },
            {
                "name": "Conference Room 1",
                "capacity": 100,
                "area_sqft": 2000,
                "floor": 3,
                "price_per_hour": Decimal("2000"),
                "price_half_day": Decimal("8000"),
                "price_full_day": Decimal("14000"),
                "amenities": ["Projector", "Whiteboard", "Video Conferencing", "AC"],
                "image": "https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&q=80",
                "available": False,
            },
        ],
    },
    {
        "name": "Pan Pacific Sonargaon Dhaka",
        "type": "Hotel Banquet",
        "address": "107 Kazi Nazrul Islam Avenue",
        "city": "Dhaka",
        "image": "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=800&q=80",
        "rating": Decimal("4.60"),
        "review_count": 289,
        "price_from": Decimal("50000"),
        "description": "Iconic 5-star hotel offering grand ballrooms and intimate meeting rooms.",
        "amenities": [
            "WiFi",
            "Parking",
            "Catering",
            "AV Equipment",
            "AC",
            "Generator",
            "Business Centre",
            "Spa",
        ],
        "halls": [
            {
                "name": "Grand Pavilion",
                "capacity": 1200,
                "area_sqft": 25000,
                "floor": 1,
                "price_per_hour": Decimal("25000"),
                "price_half_day": Decimal("90000"),
                "price_full_day": Decimal("150000"),
                "amenities": ["Luxury Catering", "Stage", "LED System", "Valet", "VIP Lounge"],
                "image": "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=800&q=80",
                "available": True,
            },
            {
                "name": "Crystal Hall",
                "capacity": 400,
                "area_sqft": 8000,
                "floor": 2,
                "price_per_hour": Decimal("10000"),
                "price_half_day": Decimal("40000"),
                "price_full_day": Decimal("70000"),
                "amenities": ["AV System", "Catering", "Dance Floor"],
                "image": "https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=80",
                "available": True,
            },
        ],
    },
]


def _ensure_venues(db) -> None:
    for spec in DEMO_VENUES:
        row = db.scalar(select(Venue).where(Venue.name == spec["name"]))
        if row is not None:
            print(f"  = venue exists: {spec['name']}")
            continue
        venue = Venue(
            name=spec["name"],
            type=spec["type"],
            address=spec["address"],
            city=spec["city"],
            image=spec["image"],
            rating=spec["rating"],
            review_count=spec["review_count"],
            price_from=spec["price_from"],
            description=spec["description"],
            amenities=spec["amenities"],
            is_active=True,
        )
        db.add(venue)
        db.flush()
        for hall_spec in spec["halls"]:
            db.add(
                Hall(
                    venue_id=venue.id,
                    name=hall_spec["name"],
                    capacity=hall_spec["capacity"],
                    area_sqft=hall_spec["area_sqft"],
                    floor=hall_spec["floor"],
                    price_per_hour=hall_spec["price_per_hour"],
                    price_half_day=hall_spec["price_half_day"],
                    price_full_day=hall_spec["price_full_day"],
                    amenities=hall_spec["amenities"],
                    image=hall_spec["image"],
                    available=hall_spec["available"],
                )
            )
        print(f"  + venue {spec['name']} ({len(spec['halls'])} halls)")


def _ensure_users(db) -> dict[str, Profile]:
    by_email: dict[str, Profile] = {}
    for spec in DEMO_USERS:
        row = db.scalar(select(Profile).where(Profile.email == spec["email"]))
        if row is None:
            row = Profile(
                id=uuid.uuid4(),
                full_name=spec["full_name"],
                email=spec["email"],
                password_hash=hash_password(DEMO_PASSWORD),
                role=spec["role"],
                is_active=True,
            )
            db.add(row)
            db.flush()
            print(f"  + user {spec['email']} / {DEMO_PASSWORD} ({spec['role']})")
        else:
            print(f"  = user exists: {spec['email']}")
        by_email[spec["email"]] = row
    return by_email


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
) -> Event:
    existing = db.scalar(
        select(Event)
        .where(Event.title == spec["title"])
        .options(joinedload(Event.seats))
    )
    if existing is not None:
        if existing.organizer_id != organizer_id:
            existing.organizer_id = organizer_id
            print(f"  ~ reassigned event to organizer: {spec['title']}")
        else:
            print(f"  = event exists: {spec['title']}")
        return existing

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
    db.flush()
    print(f"  + event {spec['title']} ({len(seats)} seats)")
    return event


def _ensure_bookings(
    db,
    *,
    users: dict[str, Profile],
    events_by_title: dict[str, Event],
) -> None:
    for spec in DEMO_BOOKINGS:
        customer = users.get(spec["customer"])
        event = events_by_title.get(spec["event"])
        if customer is None or event is None:
            print(f"  ! skip booking (missing user/event): {spec}")
            continue

        # Idempotent: skip if this customer already has a booking for this event+status combo with same seat set
        existing = db.scalar(
            select(Booking).where(
                Booking.user_id == customer.id,
                Booking.event_id == event.id,
                Booking.status == spec["status"],
            )
        )
        if existing is not None:
            print(
                f"  = booking exists: {customer.email} -> {event.title} ({spec['status']})"
            )
            continue

        seats = list(
            db.scalars(
                select(Seat).where(
                    Seat.event_id == event.id,
                    Seat.seat_number.in_(spec["seats"]),
                )
            ).all()
        )
        if len(seats) != len(spec["seats"]):
            print(f"  ! skip booking (seats missing): {spec['event']} {spec['seats']}")
            continue

        # For confirmed/pending, seats must be free; cancelled bookings do not hold seats
        if spec["status"] != "Cancelled":
            if any(s.status != "Available" for s in seats):
                print(f"  ! skip booking (seat taken): {spec['event']} {spec['seats']}")
                continue

        created_at = datetime.now(timezone.utc) - timedelta(days=spec["days_ago"])
        booking = Booking(
            user_id=customer.id,
            event_id=event.id,
            status=spec["status"],
            created_at=created_at,
            updated_at=created_at,
        )
        db.add(booking)
        db.flush()

        if spec["status"] != "Cancelled":
            for seat in seats:
                seat.status = "Booked"
                db.add(BookingSeat(booking_id=booking.id, seat_id=seat.id))

        print(
            f"  + booking {customer.email} -> {event.title} "
            f"[{', '.join(spec['seats'])}] ({spec['status']})"
        )


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
        print("Seeding users...")
        users = _ensure_users(db)
        db.commit()

        print("Seeding categories...")
        categories = _ensure_categories(db)
        db.commit()

        print("Seeding events/seats by organizer...")
        events_by_title: dict[str, Event] = {}
        for org_email, event_specs in DEMO_EVENTS_BY_ORGANIZER.items():
            organizer = users.get(org_email)
            if organizer is None:
                print(f"  ! organizer missing: {org_email}")
                continue
            for spec in event_specs:
                event = _ensure_event_with_seats(
                    db,
                    organizer_id=organizer.id,
                    categories=categories,
                    spec=spec,
                )
                events_by_title[event.title] = event
        db.commit()

        # Refresh seats after commit
        for title in list(events_by_title):
            refreshed = db.scalar(
                select(Event)
                .where(Event.title == title)
                .options(joinedload(Event.seats))
            )
            if refreshed is not None:
                events_by_title[title] = refreshed

        print("Seeding customer bookings...")
        _ensure_bookings(db, users=users, events_by_title=events_by_title)
        db.commit()

        print("Seeding venues/halls...")
        _ensure_venues(db)
        db.commit()

        print("Seed complete.")
        print(f"Demo password for all accounts: {DEMO_PASSWORD}")
        print("See demo-accounts/demo-credentials.md for the full account list.")
        return 0
    except Exception as exc:  # noqa: BLE001
        db.rollback()
        print(f"FAILED: {exc.__class__.__name__}: {exc}")
        return 1
    finally:
        db.close()


if __name__ == "__main__":
    raise SystemExit(seed())
