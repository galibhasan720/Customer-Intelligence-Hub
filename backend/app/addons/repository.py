"""Add-on catalog repository."""

from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.addons.models import AddOn


class AddOnsRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def list_active(self) -> list[AddOn]:
        stmt = select(AddOn).where(AddOn.is_active.is_(True)).order_by(AddOn.label.asc())
        return list(self.db.scalars(stmt).all())

    def list_all(self) -> list[AddOn]:
        stmt = select(AddOn).order_by(AddOn.label.asc())
        return list(self.db.scalars(stmt).all())

    def get(self, addon_id: str) -> AddOn | None:
        return self.db.get(AddOn, addon_id)
