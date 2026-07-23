"""HTTP router for the users domain.

User profile stubs (Features 2-3).
"""

from __future__ import annotations

from fastapi import APIRouter

from app.users import controller

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/ping")
def ping() -> dict[str, str]:
    """Stub endpoint proving Router → Controller → Service → Repository."""
    return controller.ping()
