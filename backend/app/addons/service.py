"""Add-on catalog service."""

from __future__ import annotations

from sqlalchemy.orm import Session

from app.addons.models import AddOn
from app.addons.repository import AddOnsRepository
from app.addons.schemas import AddOnCreate, AddOnOut, AddOnUpdate
from app.core.exceptions import ConflictError, NotFoundError


class AddOnsService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.repository = AddOnsRepository(db)

    def _to_out(self, row: AddOn) -> AddOnOut:
        return AddOnOut(
            id=row.id,
            label=row.label,
            price=float(row.price or 0),
            unit=row.unit,
            is_active=row.is_active,
        )

    def list_public(self) -> list[AddOnOut]:
        return [self._to_out(r) for r in self.repository.list_active()]

    def list_admin(self) -> list[AddOnOut]:
        return [self._to_out(r) for r in self.repository.list_all()]

    def create(self, payload: AddOnCreate) -> AddOnOut:
        if self.repository.get(payload.id) is not None:
            raise ConflictError("Add-on id already exists")
        row = AddOn(
            id=payload.id,
            label=payload.label,
            price=payload.price,
            unit=payload.unit,
            is_active=payload.is_active,
        )
        self.db.add(row)
        self.db.commit()
        self.db.refresh(row)
        return self._to_out(row)

    def update(self, addon_id: str, payload: AddOnUpdate) -> AddOnOut:
        row = self.repository.get(addon_id)
        if row is None:
            raise NotFoundError("Add-on not found")
        data = payload.model_dump(exclude_unset=True)
        for key, value in data.items():
            setattr(row, key, value)
        self.db.commit()
        self.db.refresh(row)
        return self._to_out(row)

    def delete(self, addon_id: str) -> None:
        row = self.repository.get(addon_id)
        if row is None:
            raise NotFoundError("Add-on not found")
        row.is_active = False
        self.db.commit()
