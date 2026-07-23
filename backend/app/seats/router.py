"""HTTP router for the seats domain.

Seat stubs (Features 7-8).
"""

from __future__ import annotations

from fastapi import APIRouter

from app.seats import controller

router = APIRouter(prefix="/seats", tags=["seats"])


@router.get("/ping")
def ping() -> dict[str, str]:
    """Stub endpoint proving Router → Controller → Service → Repository."""
    return controller.ping()
