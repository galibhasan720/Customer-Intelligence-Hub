"""Auth service — register / login."""

from __future__ import annotations

from sqlalchemy.orm import Session

from app.auth.repository import AuthRepository
from app.auth.schemas import AuthResponse, LoginRequest, RegisterRequest, UserOut
from app.core.exceptions import ConflictError, UnauthorizedError
from app.core.security import create_access_token, hash_password, verify_password


class AuthService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.repository = AuthRepository(db)

    def register(self, payload: RegisterRequest) -> AuthResponse:
        if self.repository.get_by_email(payload.email):
            raise ConflictError("Email already registered")
        user = self.repository.create(
            full_name=payload.full_name,
            email=payload.email,
            password_hash=hash_password(payload.password),
            role=payload.role,
        )
        self.db.commit()
        self.db.refresh(user)
        return self._token_response(user)

    def login(self, payload: LoginRequest) -> AuthResponse:
        user = self.repository.get_by_email(payload.email)
        if user is None or not verify_password(payload.password, user.password_hash):
            raise UnauthorizedError("Invalid email or password")
        if not user.is_active:
            raise UnauthorizedError("Account is inactive")
        return self._token_response(user)

    def _token_response(self, user) -> AuthResponse:
        token = create_access_token(
            user_id=user.id,
            email=user.email,
            role=user.role,
            full_name=user.full_name,
        )
        return AuthResponse(
            access_token=token,
            user=UserOut.model_validate(user),
        )
