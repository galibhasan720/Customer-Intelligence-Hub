"""Happy-path: book → payment row → analytics; hall booking with catalog add-on."""

from datetime import date, timedelta

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from tests.helpers import auth_header, seed_addon, seed_published_event


def test_event_booking_creates_payment_and_analytics(
    client: TestClient,
    db_session: Session,
    customer,
    organizer,  # noqa: ANN001
) -> None:
    event = seed_published_event(db_session, organizer)
    seats = client.get(f"/api/v1/events/{event.id}/seats").json()
    cust = auth_header(client, customer.email)
    created = client.post(
        "/api/v1/bookings",
        headers=cust,
        json={"event_id": str(event.id), "seat_ids": [seats[0]["id"]]},
    )
    assert created.status_code == 201, created.text
    booking_id = created.json()["id"]

    payments = client.get("/api/v1/payments/me", headers=cust)
    assert payments.status_code == 200
    assert any(p["booking_id"] == booking_id and p["status"] == "Paid" for p in payments.json())

    org = auth_header(client, organizer.email)
    overview = client.get("/api/v1/analytics/overview", headers=org)
    assert overview.status_code == 200
    assert overview.json()["total_bookings"] >= 1
    assert overview.json()["seats_sold"] >= 1


def test_hall_booking_uses_catalog_price(
    client: TestClient,
    db_session: Session,
    customer,
    organizer,  # noqa: ANN001
) -> None:
    seed_addon(db_session, "catering")
    org = auth_header(client, organizer.email)
    venue = client.post(
        "/api/v1/venues",
        headers=org,
        json={
            "name": "Banquet House",
            "type": "Hotel Banquet",
            "address": "Banani",
            "city": "Dhaka",
            "price_from": 10000,
        },
    )
    assert venue.status_code == 201, venue.text
    venue_id = venue.json()["id"]
    hall = client.post(
        f"/api/v1/venues/{venue_id}/halls",
        headers=org,
        json={
            "name": "Hall A",
            "capacity": 100,
            "price_full_day": 20000,
            "price_half_day": 12000,
            "price_per_hour": 3000,
        },
    )
    assert hall.status_code == 201, hall.text

    cust = auth_header(client, customer.email)
    booking_date = (date.today() + timedelta(days=21)).isoformat()
    created = client.post(
        "/api/v1/hall-bookings",
        headers=cust,
        json={
            "venue_id": venue_id,
            "hall_id": hall.json()["id"],
            "booking_date": booking_date,
            "start_time": "08:00",
            "end_time": "20:00",
            "duration_type": "full-day",
            "purpose": "Wedding",
            "guest_count": 10,
            "add_ons": ["catering"],
            "contact_name": "Ahmed",
            "contact_phone": "01700000000",
            "contact_email": "ahmed@example.com",
        },
    )
    assert created.status_code == 201, created.text
    # full-day 20000 + catering 500 * 10 guests
    assert created.json()["total"] == 25000
