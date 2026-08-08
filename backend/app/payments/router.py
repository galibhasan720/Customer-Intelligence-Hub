"""HTTP router for simulated payments."""

from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user, require_admin
from app.database.session import get_db
from app.payments import controller
from app.payments.schemas import PaymentCreate, PaymentOut
from app.users.models import Profile

router = APIRouter(prefix="/payments", tags=["payments"])


@router.get("/me", response_model=list[PaymentOut])
def my_payments(
    user: Profile = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[PaymentOut]:
    return controller.list_mine(db, user)


@router.post("", response_model=PaymentOut, status_code=status.HTTP_201_CREATED)
def create_payment(
    payload: PaymentCreate,
    user: Profile = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> PaymentOut:
    return controller.create(db, user, payload)


@router.get("/{payment_id}", response_model=PaymentOut)
def get_payment(
    payment_id: UUID,
    user: Profile = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> PaymentOut:
    return controller.get(db, user, payment_id)


@router.post("/{payment_id}/refund", response_model=PaymentOut)
def refund_payment(
    payment_id: UUID,
    _: Profile = Depends(require_admin),
    db: Session = Depends(get_db),
) -> PaymentOut:
    return controller.refund(db, payment_id)
