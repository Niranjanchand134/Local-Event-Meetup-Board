from fastapi import Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from core.deps import get_current_user
from database import get_db
from models.enums import UserRole
from models.event import Event
from models.user import User


async def get_event_or_404(event_id: str, db: AsyncSession) -> Event:
    stmt = select(Event).options(selectinload(Event.schedule_items)).where(Event.id == event_id)
    event = (await db.scalars(stmt)).first()
    if event is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Event not found")
    return event


async def require_event_owner(
    event_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Event:
    """Only the event's creator or an admin may edit/cancel it."""
    event = await get_event_or_404(event_id, db)

    is_owner = event.created_by == current_user.id
    is_admin = current_user.role == UserRole.admin

    if not (is_owner or is_admin):
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Only the event's organizer or an admin can do this")

    return event