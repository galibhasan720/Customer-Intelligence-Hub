"""Auth controller."""

from __future__ import annotations

from sqlalchemy.orm import Session

from app.auth.schemas import AuthResponse, LoginRequest, RegisterRequest
from app.auth.service import AuthService


def register(db: Session, payload: RegisterRequest) -> AuthResponse:
    return AuthService(db).register(payload)


def login(db: Session, payload: LoginRequest) -> AuthResponse:
    return AuthService(db).login(payload)
