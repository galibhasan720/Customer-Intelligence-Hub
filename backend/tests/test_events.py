"""Event RBAC: drafts hidden, ownership, organizer write."""

from datetime import datetime, timedelta, timezone

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.events.models import Category, Event
from tests.helpers import auth_header, seed_published_event


def test_customer_cannot_create_event(client: TestClient, customer) -> None:  # noqa: ANN001
    headers = auth_header(client, customer.email)
    response = client.post(
        "/api/v1/events",
        headers=headers,
        json={
            "title": "Nope",
            "venue": "Hall",
            "event_date": (datetime.now(timezone.utc) + timedelta(days=10)).isoformat(),
            "price": 100,
            "category": "Concert",
        },
    )
    assert response.status_code == 403


def test_draft_hidden_from_public(
    client: TestClient, db_session: Session, organizer  # noqa: ANN001
) -> None:
    category = Category(name="Concert", description="Music")
    db_session.add(category)
    db_session.flush()
    draft = Event(
        organizer_id=organizer.id,
        category_id=category.id,
        title="Secret Draft",
        venue="Hidden Hall",
        event_date=datetime.now(timezone.utc) + timedelta(days=20),
        price=100,
        status="Draft",
        booking_window_open=False,
    )
    db_session.add(draft)
    db_session.commit()
    db_session.refresh(draft)

    public = client.get("/api/v1/events")
    assert public.status_code == 200
    assert all(e["title"] != "Secret Draft" for e in public.json())

    guest_get = client.get(f"/api/v1/events/{draft.id}")
    assert guest_get.status_code == 404

    owner = auth_header(client, organizer.email)
    owner_get = client.get(f"/api/v1/events/{draft.id}", headers=owner)
    assert owner_get.status_code == 200
    assert owner_get.json()["title"] == "Secret Draft"


def test_organizer_cannot_update_others_event(
    client: TestClient,
    db_session: Session,
    organizer,
    organizer_b,  # noqa: ANN001
) -> None:
    event = seed_published_event(db_session, organizer)
    headers = auth_header(client, organizer_b.email)
    response = client.patch(
        f"/api/v1/events/{event.id}",
        headers=headers,
        json={"title": "Hijacked"},
    )
    assert response.status_code == 403
