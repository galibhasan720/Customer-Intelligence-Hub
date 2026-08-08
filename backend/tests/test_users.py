"""Users /me CRUD smoke tests."""

from fastapi.testclient import TestClient

from tests.helpers import auth_header


def test_me_requires_auth(client: TestClient) -> None:
    assert client.get("/api/v1/users/me").status_code == 401
    assert client.get("/api/v1/users/me", headers={"Authorization": "Bearer bad"}).status_code == 401


def test_me_get_patch_and_password(client: TestClient, customer) -> None:  # noqa: ANN001
    headers = auth_header(client, customer.email)
    me = client.get("/api/v1/users/me", headers=headers)
    assert me.status_code == 200
    body = me.json()
    assert body["email"] == customer.email
    assert body["role"] == "customer"

    patched = client.patch(
        "/api/v1/users/me",
        headers=headers,
        json={"full_name": "Updated Customer", "city": "Dhaka", "phone": "01700000000"},
    )
    assert patched.status_code == 200
    assert patched.json()["full_name"] == "Updated Customer"
    assert patched.json()["city"] == "Dhaka"

    bad_pw = client.post(
        "/api/v1/users/me/password",
        headers=headers,
        json={"current_password": "wrong", "new_password": "newpass1"},
    )
    assert bad_pw.status_code == 401

    ok_pw = client.post(
        "/api/v1/users/me/password",
        headers=headers,
        json={"current_password": "password123", "new_password": "newpass1"},
    )
    assert ok_pw.status_code == 204
    relogin = client.post(
        "/api/v1/auth/login",
        json={"email": customer.email, "password": "newpass1"},
    )
    assert relogin.status_code == 200


def test_register_cannot_self_assign_admin(client: TestClient) -> None:
    response = client.post(
        "/api/v1/auth/register",
        json={
            "full_name": "Hacker",
            "email": "hacker@example.com",
            "password": "password123",
            "role": "admin",
        },
    )
    assert response.status_code == 422
