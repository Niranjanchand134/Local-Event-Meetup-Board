from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from core.deps import get_current_user, require_admin
from database import get_db
from models.event import Event
from models.payment import Payment
from models.rsvp import RSVP
from models.user import User
from schemas.rsvp import AdminPaymentOut, RSVPWithPaymentOut

router = APIRouter(prefix="/admin", tags=["admin-payments"])


@router.get("/payments", response_model=list[AdminPaymentOut])
async def list_all_payments(
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    """
    Return every payment record in the system, enriched with
    user name/email and event title — for the admin payments panel.
    """
    result = await db.execute(
        select(Payment)
        .options(
            selectinload(Payment.rsvp),
        )
        .order_by(Payment.created_at.desc())
    )
    payments = result.scalars().all()

    # Collect all unique event_ids and user_ids to batch-fetch
    event_ids = {p.rsvp.event_id for p in payments if p.rsvp}
    user_ids = {p.rsvp.user_id for p in payments if p.rsvp}

    events_map: dict[str, Event] = {}
    if event_ids:
        evts = await db.execute(select(Event).where(Event.id.in_(event_ids)))
        for e in evts.scalars().all():
            events_map[e.id] = e

    users_map: dict[str, User] = {}
    if user_ids:
        usrs = await db.execute(select(User).where(User.id.in_(user_ids)))
        for u in usrs.scalars().all():
            users_map[u.id] = u

    out: list[AdminPaymentOut] = []
    for p in payments:
        rsvp = p.rsvp
        if not rsvp:
            continue
        event = events_map.get(rsvp.event_id)
        user = users_map.get(rsvp.user_id)
        out.append(
            AdminPaymentOut(
                payment_id=p.id,
                rsvp_id=rsvp.id,
                event_id=rsvp.event_id,
                event_title=event.title if event else "Unknown Event",
                user_id=rsvp.user_id,
                user_name=user.name if user else "Unknown",
                user_email=user.email if user else "",
                gateway=p.gateway.value,
                amount=p.amount,
                currency=p.currency,
                payment_status=p.status.value,
                rsvp_status=rsvp.status.value,
                merchant_transaction_id=p.merchant_transaction_id,
                gateway_reference=p.gateway_reference,
                created_at=p.created_at,
                verified_at=p.verified_at,
            )
        )
    return out


@router.get("/events/{event_id}/rsvps", response_model=list[RSVPWithPaymentOut])
async def list_event_rsvps(
    event_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Return all RSVPs (with optional payment) for a specific event.
    Accessible by admins (any event) and organizers (only their own events).
    """
    event = await db.get(Event, event_id)
    if event is None:
        raise HTTPException(404, "Event not found")

    # Organizers can only view their own event's RSVPs
    if current_user.role == "organizer" and event.created_by != current_user.id:
        raise HTTPException(403, "You can only view RSVPs for your own events")

    # Normal users have no access
    if current_user.role == "user":
        raise HTTPException(403, "Admin or organizer access required")

    result = await db.execute(
        select(RSVP)
        .options(selectinload(RSVP.payment))
        .where(RSVP.event_id == event_id)
        .order_by(RSVP.created_at.desc())
    )
    rsvps = result.scalars().all()

    user_ids = {r.user_id for r in rsvps}
    users_map: dict[str, User] = {}
    if user_ids:
        usrs = await db.execute(select(User).where(User.id.in_(user_ids)))
        for u in usrs.scalars().all():
            users_map[u.id] = u

    out: list[RSVPWithPaymentOut] = []
    for r in rsvps:
        u = users_map.get(r.user_id)
        out.append(
            RSVPWithPaymentOut(
                id=r.id,
                event_id=r.event_id,
                user_id=r.user_id,
                status=r.status.value,
                created_at=r.created_at,
                payment=r.payment,
                user_name=u.name if u else "Community Member",
                user_email=u.email if u else "",
            )
        )
    return out
