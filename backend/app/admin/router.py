"""Admin-only routes."""

from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Depends, Response, status
from sqlalchemy.orm import Session

from app.addons import controller as addons_controller
from app.addons.schemas import AddOnCreate, AddOnOut, AddOnUpdate
from app.bookings import controller as bookings_controller
from app.bookings.schemas import BookingOut
from app.core.dependencies import require_admin
from app.database.session import get_db
from app.events import controller as events_controller
from app.events.schemas import CategoryCreate, CategoryOut, CategoryUpdate
from app.notifications import controller as notifications_controller
from app.users import controller as users_controller
from app.users.models import Profile
from app.users.schemas import AdminUserUpdate, ProfileOut

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/users", response_model=list[ProfileOut])
def list_users(
    _: Profile = Depends(require_admin),
    db: Session = Depends(get_db),
) -> list[ProfileOut]:
    return users_controller.list_users(db)


@router.get("/users/{user_id}", response_model=ProfileOut)
def get_user(
    user_id: UUID,
    _: Profile = Depends(require_admin),
    db: Session = Depends(get_db),
) -> ProfileOut:
    return users_controller.get_user(db, user_id)


@router.patch("/users/{user_id}", response_model=ProfileOut)
def update_user(
    user_id: UUID,
    payload: AdminUserUpdate,
    actor: Profile = Depends(require_admin),
    db: Session = Depends(get_db),
) -> ProfileOut:
    return users_controller.admin_update(db, actor, user_id, payload)


@router.delete("/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def deactivate_user(
    user_id: UUID,
    actor: Profile = Depends(require_admin),
    db: Session = Depends(get_db),
) -> Response:
    users_controller.deactivate(db, actor, user_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("/categories", response_model=list[CategoryOut])
def list_categories(
    _: Profile = Depends(require_admin),
    db: Session = Depends(get_db),
) -> list[CategoryOut]:
    return events_controller.list_categories(db)


@router.post("/categories", response_model=CategoryOut, status_code=status.HTTP_201_CREATED)
def create_category(
    payload: CategoryCreate,
    _: Profile = Depends(require_admin),
    db: Session = Depends(get_db),
) -> CategoryOut:
    return events_controller.create_category(db, payload)


@router.patch("/categories/{category_id}", response_model=CategoryOut)
def update_category(
    category_id: UUID,
    payload: CategoryUpdate,
    _: Profile = Depends(require_admin),
    db: Session = Depends(get_db),
) -> CategoryOut:
    return events_controller.update_category(db, category_id, payload)


@router.delete("/categories/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_category(
    category_id: UUID,
    _: Profile = Depends(require_admin),
    db: Session = Depends(get_db),
) -> Response:
    events_controller.delete_category(db, category_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("/add-ons", response_model=list[AddOnOut])
def list_add_ons(
    _: Profile = Depends(require_admin),
    db: Session = Depends(get_db),
) -> list[AddOnOut]:
    return addons_controller.list_admin(db)


@router.post("/add-ons", response_model=AddOnOut, status_code=status.HTTP_201_CREATED)
def create_add_on(
    payload: AddOnCreate,
    _: Profile = Depends(require_admin),
    db: Session = Depends(get_db),
) -> AddOnOut:
    return addons_controller.create(db, payload)


@router.patch("/add-ons/{addon_id}", response_model=AddOnOut)
def update_add_on(
    addon_id: str,
    payload: AddOnUpdate,
    _: Profile = Depends(require_admin),
    db: Session = Depends(get_db),
) -> AddOnOut:
    return addons_controller.update(db, addon_id, payload)


@router.delete("/add-ons/{addon_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_add_on(
    addon_id: str,
    _: Profile = Depends(require_admin),
    db: Session = Depends(get_db),
) -> Response:
    addons_controller.delete(db, addon_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("/bookings", response_model=list[BookingOut])
def list_bookings(
    _: Profile = Depends(require_admin),
    db: Session = Depends(get_db),
) -> list[BookingOut]:
    return bookings_controller.list_all(db)


@router.post("/bookings/{booking_id}/cancel", response_model=BookingOut)
def force_cancel_booking(
    booking_id: UUID,
    admin: Profile = Depends(require_admin),
    db: Session = Depends(get_db),
) -> BookingOut:
    return bookings_controller.cancel(db, admin, booking_id, force=True)


@router.post("/notifications/reminders")
def send_reminders(
    _: Profile = Depends(require_admin),
    db: Session = Depends(get_db),
) -> dict[str, int]:
    return notifications_controller.send_reminders(db)
