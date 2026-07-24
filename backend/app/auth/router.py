"""HTTP router for auth."""

from __future__ import annotations

from fastapi import APIRouter, Depends, Response
from sqlalchemy.orm import Session

from app.auth import controller
from app.auth.schemas import AuthResponse, LoginRequest, RegisterRequest
from app.database.session import get_db

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=AuthResponse)
def register(payload: RegisterRequest, db: Session = Depends(get_db)) -> AuthResponse:
    return controller.register(db, payload)


@router.post("/login", response_model=AuthResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)) -> AuthResponse:
    return controller.login(db, payload)


@router.post("/logout", status_code=204, response_class=Response)
def logout() -> Response:
    """Client discards JWT; endpoint kept for API symmetry."""
    return Response(status_code=204)