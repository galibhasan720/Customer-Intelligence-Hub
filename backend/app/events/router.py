"""HTTP router for the events domain.

Event stubs (Features 5-6).
"""

from __future__ import annotations

from fastapi import APIRouter

from app.events import controller

router = APIRouter(prefix="/events", tags=["events"])


@router.get("/ping")
def ping() -> dict[str, str]:
    """Stub endpoint proving Router → Controller → Service → Repository."""
    return controller.ping()
