"""Booking get/patch/cancel + guest fields + admin force-cancel."""

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from tests.helpers import auth_header, seed_published_event


def test_booking_requires_auth(client: TestClient) -> None:
    assert client.get("/api/v1/bookings/me").status_code == 401


def test_booking_crud_guest_fields_and_force_cancel(
    client: TestClient,
    db_session: Session,
    customer,
    organizer,
    admin,  # noqa: ANN001
) -> None:
    event = seed_published_event(db_session, organizer)
    seats = client.get(f"/api/v1/events/{event.id}/seats").json()
    seat_id = seats[0]["id"]

    cust = auth_header(client, customer.email)
    created = client.post(
        "/api/v1/bookings",
        headers=cust,
        json={
            "event_id": str(event.id),
            "seat_ids": [seat_id],
            "guest_name": "Ahmed Rahman",
            "guest_email": "ahmed@example.com",
        },
    )
    assert created.status_code == 201, created.text
    booking_id = created.json()["id"]
    assert created.json()["guest_name"] == "Ahmed Rahman"
    assert created.json()["status"] == "Confirmed"

    fetched = client.get(f"/api/v1/bookings/{booking_id}", headers=cust)
    assert fetched.status_code == 200

    patched = client.patch(
        f"/api/v1/bookings/{booking_id}",
        headers=cust,
        json={"guest_name": "Fatema Khatun"},
    )
    assert patched.status_code == 200
    assert patched.json()["guest_name"] == "Fatema Khatun"

    other = auth_header(client, organizer.email)
    forbidden = client.get(f"/api/v1/bookings/{booking_id}", headers=other)
    assert forbidden.status_code == 403

    admin_headers = auth_header(client, admin.email)
    listed = client.get("/api/v1/admin/bookings", headers=admin_headers)
    assert listed.status_code == 200
    assert any(b["id"] == booking_id for b in listed.json())

    forced = client.post(
        f"/api/v1/admin/bookings/{booking_id}/cancel",
        headers=admin_headers,
    )
    assert forced.status_code == 200
    assert forced.json()["status"] == "Cancelled"
