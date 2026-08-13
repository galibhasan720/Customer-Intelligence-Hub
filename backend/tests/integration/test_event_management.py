"""Venue + hall write CRUD smoke."""

from fastapi.testclient import TestClient

from tests.helpers import auth_header


def test_venue_and_hall_write(
    client: TestClient, organizer, customer  # noqa: ANN001
) -> None:
    cust = auth_header(client, customer.email)
    denied = client.post(
        "/api/v1/venues",
        headers=cust,
        json={
            "name": "Denied Hall",
            "type": "Hotel Banquet",
            "address": "Gulshan",
            "city": "Dhaka",
        },
    )
    assert denied.status_code == 403

    headers = auth_header(client, organizer.email)
    venue = client.post(
        "/api/v1/venues",
        headers=headers,
        json={
            "name": "Gulshan Convention",
            "type": "Convention Center",
            "address": "Gulshan 2",
            "city": "Dhaka",
            "description": "Test venue",
            "amenities": ["WiFi"],
            "price_from": 20000,
        },
    )
    assert venue.status_code == 201, venue.text
    venue_id = venue.json()["id"]

    hall = client.post(
        f"/api/v1/venues/{venue_id}/halls",
        headers=headers,
        json={
            "name": "Grand Ballroom",
            "capacity": 200,
            "area_sqft": 4000,
            "floor": 1,
            "price_per_hour": 5000,
            "price_half_day": 20000,
            "price_full_day": 35000,
            "amenities": ["AC"],
        },
    )
    assert hall.status_code == 201, hall.text
    hall_id = hall.json()["id"]

    public_hall = client.get(f"/api/v1/halls/{hall_id}")
    assert public_hall.status_code == 200
    assert public_hall.json()["name"] == "Grand Ballroom"

    patched = client.patch(
        f"/api/v1/halls/{hall_id}",
        headers=headers,
        json={"capacity": 250},
    )
    assert patched.status_code == 200
    assert patched.json()["capacity"] == 250
