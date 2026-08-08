"""Add-on catalog controller."""

from __future__ import annotations

from sqlalchemy.orm import Session

from app.addons.schemas import AddOnCreate, AddOnOut, AddOnUpdate
from app.addons.service import AddOnsService


def list_public(db: Session) -> list[AddOnOut]:
    return AddOnsService(db).list_public()


def list_admin(db: Session) -> list[AddOnOut]:
    return AddOnsService(db).list_admin()


def create(db: Session, payload: AddOnCreate) -> AddOnOut:
    return AddOnsService(db).create(payload)


def update(db: Session, addon_id: str, payload: AddOnUpdate) -> AddOnOut:
    return AddOnsService(db).update(addon_id, payload)


def delete(db: Session, addon_id: str) -> None:
    AddOnsService(db).delete(addon_id)
