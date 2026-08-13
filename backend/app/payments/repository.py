"""Payments repository."""

from __future__ import annotations

from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.payments.models import Payment


class PaymentsRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def list_for_user(self, user_id: UUID) -> list[Payment]:
        stmt = select(Payment).where(Payment.user_id == user_id).order_by(Payment.created_at.desc())
        return list(self.db.scalars(stmt).all())

    def get(self, payment_id: UUID) -> Payment | None:
        return self.db.get(Payment, payment_id)
