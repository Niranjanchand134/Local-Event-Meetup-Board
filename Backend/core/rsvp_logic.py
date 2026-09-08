from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from models.enums import RSVPStatus
from models.event import Event
from models.rsvp import RSVP


async def count_confirmed(db: AsyncSession, event_id: str) -> int:
    """Sum the quantity of all confirmed RSVPs for an event."""
    result = await db.execute(
        select(func.coalesce(func.sum(RSVP.quantity), 0)).where(
            RSVP.event_id == event_id, RSVP.status == RSVPStatus.confirmed
        )
    )
    return result.scalar_one() or 0


async def determine_initial_status(
    db: AsyncSession, event: Event, requested_quantity: int = 1
) -> RSVPStatus:
    """
    Used both for free events (right after reserving) and paid events
    (right after payment is verified) — capacity is only checked once
    money has actually settled or there's no money involved at all.
    Takes the requested quantity into account so that multiple tickets
    are atomically seat-checked.
    """
    if event.max_attendees is None:
        return RSVPStatus.confirmed
    confirmed = await count_confirmed(db, event.id)
    return (
        RSVPStatus.confirmed
        if confirmed + requested_quantity <= event.max_attendees
        else RSVPStatus.waitlisted
    )


async def promote_next_waitlisted(db: AsyncSession, event_id: str) -> RSVP | None:
    """
    Row-locked so two near-simultaneous cancellations can't both promote
    the same waitlisted person. Works identically for free and paid
    events — a waitlisted paid RSVP has already had its payment verified
    by the time it reaches waitlisted, so promoting it needs no new
    payment step, just a status flip.
    """
    result = await db.execute(
        select(RSVP)
        .where(RSVP.event_id == event_id, RSVP.status == RSVPStatus.waitlisted)
        .order_by(RSVP.created_at)
        .limit(1)
        .with_for_update()
    )
    next_rsvp = result.scalar_one_or_none()
    if next_rsvp:
        next_rsvp.status = RSVPStatus.confirmed
    return next_rsvp