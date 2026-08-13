"""Payments controller."""

from __future__ import annotations

from uuid import UUID

from sqlalchemy.orm import Session

from app.payments.schemas import PaymentCreate, PaymentOut
from app.payments.service import PaymentsService
from app.users.models import Profile


def list_mine(db: Session, user: Profile) -> list[PaymentOut]:
    return PaymentsService(db).list_mine(user)


def get(db: Session, user: Profile, payment_id: UUID) -> PaymentOut:
    return PaymentsService(db).get(user, payment_id)


def create(db: Session, user: Profile, payload: PaymentCreate) -> PaymentOut:
    return PaymentsService(db).create(user, payload)


def refund(db: Session, payment_id: UUID) -> PaymentOut:
    return PaymentsService(db).refund(payment_id)
