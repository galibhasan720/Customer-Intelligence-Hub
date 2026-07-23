"""Smoke tests for API health endpoints."""

from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_health_ok():
    response = client.get("/health")
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "ok"
    assert "env" in body


def test_health_db_returns_status():
    # Settings are loaded at import; endpoint always soft-fails with a status payload.
    response = client.get("/health/db")
    assert response.status_code == 200
    assert response.json()["status"] in {"skipped", "ok", "error"}
