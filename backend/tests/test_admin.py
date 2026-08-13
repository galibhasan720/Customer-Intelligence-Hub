"""Admin RBAC and user/category/add-on admin routes."""

from fastapi.testclient import TestClient

from tests.helpers import auth_header


def test_admin_routes_require_admin(
    client: TestClient, customer, organizer  # noqa: ANN001
) -> None:
    assert client.get("/api/v1/admin/users").status_code == 401
    cust = auth_header(client, customer.email)
    org = auth_header(client, organizer.email)
    assert client.get("/api/v1/admin/users", headers=cust).status_code == 403
    assert client.get("/api/v1/admin/users", headers=org).status_code == 403
    assert client.get("/api/v1/admin/bookings", headers=cust).status_code == 403
    assert client.post("/api/v1/admin/notifications/reminders", headers=org).status_code == 403


def test_admin_user_list_update_deactivate(
    client: TestClient, admin, customer  # noqa: ANN001
) -> None:
    headers = auth_header(client, admin.email)
    listed = client.get("/api/v1/admin/users", headers=headers)
    assert listed.status_code == 200
    assert any(u["email"] == customer.email for u in listed.json())

    one = client.get(f"/api/v1/admin/users/{customer.id}", headers=headers)
    assert one.status_code == 200

    updated = client.patch(
        f"/api/v1/admin/users/{customer.id}",
        headers=headers,
        json={"verified": True, "role": "organizer"},
    )
    assert updated.status_code == 200
    assert updated.json()["verified"] is True
    assert updated.json()["role"] == "organizer"

    deactivated = client.delete(f"/api/v1/admin/users/{customer.id}", headers=headers)
    assert deactivated.status_code == 204
    login = client.post(
        "/api/v1/auth/login",
        json={"email": customer.email, "password": "password123"},
    )
    assert login.status_code == 401


def test_admin_category_and_addon_crud(client: TestClient, admin) -> None:  # noqa: ANN001
    headers = auth_header(client, admin.email)
    created = client.post(
        "/api/v1/admin/categories",
        headers=headers,
        json={"name": "Hackathon", "description": "Tech builds"},
    )
    assert created.status_code == 201
    cat_id = created.json()["id"]

    patched = client.patch(
        f"/api/v1/admin/categories/{cat_id}",
        headers=headers,
        json={"description": "Updated"},
    )
    assert patched.status_code == 200
    assert patched.json()["description"] == "Updated"

    public = client.get("/api/v1/categories")
    assert public.status_code == 200
    assert any(c["name"] == "Hackathon" for c in public.json())

    deleted = client.delete(f"/api/v1/admin/categories/{cat_id}", headers=headers)
    assert deleted.status_code == 204

    addon = client.post(
        "/api/v1/admin/add-ons",
        headers=headers,
        json={"id": "av", "label": "AV Equipment Setup", "price": 5000, "unit": "flat"},
    )
    assert addon.status_code == 201
    listed = client.get("/api/v1/add-ons")
    assert listed.status_code == 200
    assert any(a["id"] == "av" for a in listed.json())
