"""HTTP router for the bookings domain.

Booking stubs (Features 9-11).
"""

from __future__ import annotations

from fastapi import APIRouter

from app.bookings import controller

router = APIRouter(prefix="/bookings", tags=["bookings"])


@router.get("/ping")
def ping() -> dict[str, str]:
    """Stub endpoint proving Router → Controller → Service → Repository."""
    return controller.ping()
