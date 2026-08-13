"""Analytics overview RBAC + empty zeros."""

from fastapi.testclient import TestClient

from tests.helpers import auth_header


def test_analytics_requires_organizer(client: TestClient, customer) -> None:  # noqa: ANN001
    assert client.get("/api/v1/analytics/overview").status_code == 401
    cust = auth_header(client, customer.email)
    assert client.get("/api/v1/analytics/overview", headers=cust).status_code == 403


def test_analytics_overview_zeros_and_admin(
    client: TestClient, organizer, admin  # noqa: ANN001
) -> None:
    org = auth_header(client, organizer.email)
    overview = client.get("/api/v1/analytics/overview", headers=org)
    assert overview.status_code == 200, overview.text
    body = overview.json()
    assert body["total_bookings"] == 0
    assert body["seats_sold"] == 0
    assert body["cancellation_rate"] == 0
    assert isinstance(body["weekly_trend"], list)
    assert isinstance(body["status_breakdown"], list)

    admin_headers = auth_header(client, admin.email)
    platform = client.get("/api/v1/analytics/overview", headers=admin_headers)
    assert platform.status_code == 200
