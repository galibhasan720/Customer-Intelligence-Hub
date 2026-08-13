"""Seat hold / release."""

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from tests.helpers import auth_header, seed_published_event


def test_hold_requires_auth(
    client: TestClient, db_session: Session, organizer  # noqa: ANN001
) -> None:
    event = seed_published_event(db_session, organizer)
    seats = client.get(f"/api/v1/events/{event.id}/seats").json()
    response = client.post(
        f"/api/v1/events/{event.id}/seats/hold",
        json={"seat_ids": [seats[0]["id"]]},
    )
    assert response.status_code == 401


def test_hold_and_release(
    client: TestClient, db_session: Session, customer, organizer  # noqa: ANN001
) -> None:
    event = seed_published_event(db_session, organizer)
    seats = client.get(f"/api/v1/events/{event.id}/seats").json()
    seat_id = seats[0]["id"]
    headers = auth_header(client, customer.email)

    held = client.post(
        f"/api/v1/events/{event.id}/seats/hold",
        headers=headers,
        json={"seat_ids": [seat_id]},
    )
    assert held.status_code == 200, held.text
    locked = next(s for s in held.json() if s["id"] == seat_id)
    assert locked["status"] == "Locked"

    released = client.post(
        f"/api/v1/events/{event.id}/seats/release",
        headers=headers,
        json={"seat_ids": [seat_id]},
    )
    assert released.status_code == 200
    free = next(s for s in released.json() if s["id"] == seat_id)
    assert free["status"] == "Available"
