from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile
from fastapi.responses import FileResponse
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from core.deps import get_current_user, require_verified_organizer
from core.ownership import get_event_or_404, require_event_owner
from core.rsvp_logic import count_confirmed
from core.storage import save_event_cover_image
from database import get_db
from models.event import Event
from models.event_schedule_item import EventScheduleItem
from models.user import User
from schemas.event import EventCreate, EventOut, EventUpdate, build_event_out

router = APIRouter(prefix="/events", tags=["events"])


# Fixed-path routes declared before /{event_id} — otherwise a request to
# /events/me/created would incorrectly match /{event_id} with event_id="me".

@router.get("/me/created", response_model=list[EventOut])
async def my_created_events(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    status_filter: Optional[str] = None,
):
    stmt = (
        select(Event)
        .options(selectinload(Event.schedule_items))
        .where(Event.created_by == current_user.id)
    )
    if status_filter:
        stmt = stmt.where(Event.status == status_filter)
    stmt = stmt.order_by(Event.start_time.desc())

    events = (await db.scalars(stmt)).all()
    result = []
    for e in events:
        cc = await count_confirmed(db, e.id)
        result.append(build_event_out(e, cc))
    return result


@router.post("", response_model=EventOut, status_code=201)
async def create_event(
    payload: EventCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_verified_organizer),
):
    event = Event(
        title=payload.title,
        description=payload.description,
        category=payload.category,
        start_time=payload.start_time,
        end_time=payload.end_time,
        venue_name=payload.venue_name,
        address=payload.address,
        city=payload.city,
        is_online=payload.is_online,
        meeting_link=payload.meeting_link,
        is_paid=payload.is_paid,
        price=payload.price,
        currency=payload.currency,
        max_attendees=payload.max_attendees,
        created_by=current_user.id,
    )

    for item in payload.schedule_items:
        event.schedule_items.append(
            EventScheduleItem(
                item_time=item.item_time,
                title=item.title,
                description=item.description,
                sort_order=item.sort_order,
            )
        )

    db.add(event)
    await db.commit()
    await db.refresh(event, attribute_names=["schedule_items"])

    return build_event_out(event)


@router.get("", response_model=list[EventOut])
async def list_events(
    db: AsyncSession = Depends(get_db),
    category: Optional[str] = None,
    city: Optional[str] = None,
    date_from: Optional[datetime] = None,
    date_to: Optional[datetime] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
):
    stmt = select(Event).options(selectinload(Event.schedule_items)).where(Event.status != "cancelled")
    if category:
        stmt = stmt.where(Event.category == category)
    if city:
        stmt = stmt.where(Event.city.ilike(f"%{city}%"))
    if date_from:
        stmt = stmt.where(Event.start_time >= date_from)
    if date_to:
        stmt = stmt.where(Event.start_time <= date_to)

    stmt = stmt.order_by(Event.start_time).offset(skip).limit(limit)
    events = (await db.scalars(stmt)).all()
    result = []
    for e in events:
        cc = await count_confirmed(db, e.id)
        result.append(build_event_out(e, cc))
    return result


@router.get("/{event_id}", response_model=EventOut)
async def get_event(event_id: str, db: AsyncSession = Depends(get_db)):
    event = await get_event_or_404(event_id, db)
    cc = await count_confirmed(db, event_id)
    return build_event_out(event, cc)


@router.patch("/{event_id}", response_model=EventOut)
async def update_event(
    event_id: str,
    payload: EventUpdate,
    event: Event = Depends(require_event_owner),
    db: AsyncSession = Depends(get_db),
):
    update_data = payload.model_dump(exclude_unset=True)

    merged_is_online = update_data.get("is_online", event.is_online)
    merged_address = update_data.get("address", event.address)
    merged_city = update_data.get("city", event.city)
    merged_meeting_link = update_data.get("meeting_link", event.meeting_link)

    if merged_is_online and not merged_meeting_link:
        raise HTTPException(400, "meeting_link is required for online events")
    if not merged_is_online and (not merged_address or not merged_city):
        raise HTTPException(400, "address and city are required for in-person events")

    merged_is_paid = update_data.get("is_paid", event.is_paid)
    merged_price = update_data.get("price", event.price)
    if merged_is_paid and (merged_price is None or merged_price <= 0):
        raise HTTPException(400, "price is required and must be greater than 0 for paid events")
    if not merged_is_paid and merged_price is not None:
        raise HTTPException(400, "price should not be set for free events")

    merged_start = update_data.get("start_time", event.start_time)
    merged_end = update_data.get("end_time", event.end_time)
    if merged_end and merged_end <= merged_start:
        raise HTTPException(400, "end_time must be after start_time")

    for field, value in update_data.items():
        setattr(event, field, value)

    await db.commit()
    await db.refresh(event, attribute_names=["schedule_items"])

    return build_event_out(event)


@router.post("/{event_id}/cover-image", response_model=EventOut)
async def upload_cover_image(
    event_id: str,
    image: UploadFile = File(...),
    event: Event = Depends(require_event_owner),
    db: AsyncSession = Depends(get_db),
):
    file_path = await save_event_cover_image(image)
    event.cover_image_path = file_path

    await db.commit()
    await db.refresh(event, attribute_names=["schedule_items"])

    return build_event_out(event)


@router.get("/{event_id}/cover-image")
async def get_cover_image(event_id: str, db: AsyncSession = Depends(get_db)):
    event = await get_event_or_404(event_id, db)
    if not event.cover_image_path:
        raise HTTPException(404, "This event has no cover image")
    return FileResponse(event.cover_image_path)