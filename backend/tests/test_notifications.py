"""Notification inbox + booking side-effects."""

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from tests.helpers import auth_header, seed_published_event


def test_notifications_require_auth(client: TestClient) -> None:
    assert client.get("/api/v1/notifications").status_code == 401


def test_notification_on_book_and_cancel(
    client: TestClient, db_session: Session, customer, organizer  # noqa: ANN001
) -> None:
    event = seed_published_event(db_session, organizer)
    seats = client.get(f"/api/v1/events/{event.id}/seats").json()
    headers = auth_header(client, customer.email)

    created = client.post(
        "/api/v1/bookings",
        headers=headers,
        json={"event_id": str(event.id), "seat_ids": [seats[0]["id"]]},
    )
    assert created.status_code == 201, created.text
    booking_id = created.json()["id"]

    inbox = client.get("/api/v1/notifications", headers=headers)
    assert inbox.status_code == 200
    assert any(n["type"] == "booking_confirmed" for n in inbox.json())
    notif_id = inbox.json()[0]["id"]

    marked = client.patch(f"/api/v1/notifications/{notif_id}/read", headers=headers)
    assert marked.status_code == 200
    assert marked.json()["read"] is True

    cancelled = client.post(f"/api/v1/bookings/{booking_id}/cancel", headers=headers)
    assert cancelled.status_code == 200
    inbox2 = client.get("/api/v1/notifications", headers=headers)
    assert any(n["type"] == "booking_cancelled" for n in inbox2.json())

    assert client.post("/api/v1/notifications/read-all", headers=headers).status_code == 204
    assert client.delete("/api/v1/notifications", headers=headers).status_code == 204
    cleared = client.get("/api/v1/notifications", headers=headers)
    assert cleared.json() == []
