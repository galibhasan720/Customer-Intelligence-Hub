"""Public add-on catalog routes."""

from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.addons import controller
from app.addons.schemas import AddOnOut
from app.database.session import get_db

router = APIRouter(prefix="/add-ons", tags=["add-ons"])


@router.get("", response_model=list[AddOnOut])
def list_add_ons(db: Session = Depends(get_db)) -> list[AddOnOut]:
    return controller.list_public(db)
