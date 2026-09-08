import uuid
from decimal import Decimal
from typing import Union

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from core.deps import get_current_user
from core.ownership import get_event_or_404
from core.payments import get_gateway
from core.rsvp_logic import determine_initial_status, promote_next_waitlisted
from database import get_db
from models.enums import PaymentGateway, PaymentStatus, RSVPStatus
from models.payment import Payment
from models.rsvp import RSVP
from models.user import User
from schemas.rsvp import CheckoutOut, ReserveRequest, RSVPOut

router = APIRouter(tags=["rsvps"])


@router.post("/events/{event_id}/reserve", response_model=Union[RSVPOut, CheckoutOut], status_code=201)
async def reserve_event(
    event_id: str,
    payload: ReserveRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    event = await get_event_or_404(event_id, db)

    # Only regular users can reserve spots — organisers create events, not attend them
    if current_user.role in ("organizer", "admin"):
        raise HTTPException(403, "Organizers and admins cannot reserve spots")

    if event.status != "upcoming":
        raise HTTPException(400, "This event is not open for reservations")

    # Cap quantity at 10
    quantity = max(1, min(payload.quantity, 10))

    # Check if user already has an active reservation
    existing_result = await db.execute(
        select(RSVP).where(
            RSVP.event_id == event_id,
            RSVP.user_id == current_user.id,
            RSVP.status != RSVPStatus.cancelled,
        )
    )
    existing_rsvp = existing_result.scalar_one_or_none()

    # ── Pending payment: allow repay / gateway switch ─────────────────────────
    if existing_rsvp and existing_rsvp.status == RSVPStatus.pending_payment:
        if not event.is_paid:
            raise HTTPException(409, "You already have a reservation for this event")

        if payload.gateway is None:
            raise HTTPException(400, "gateway is required to complete or retry payment")

        # Update quantity on the existing RSVP if changed
        existing_rsvp.quantity = quantity

        # Determine total amount for the new quantity
        total_amount = Decimal(str(event.price)) * quantity

        # Replace or reuse existing payment record
        existing_payment_result = await db.execute(
            select(Payment).where(Payment.rsvp_id == existing_rsvp.id)
        )
        existing_payment = existing_payment_result.scalar_one_or_none()

        merchant_transaction_id = str(uuid.uuid4())

        if existing_payment:
            # Recycle the payment row: update gateway, amount, and transaction ID
            existing_payment.gateway = PaymentGateway(payload.gateway)
            existing_payment.amount = total_amount
            existing_payment.merchant_transaction_id = merchant_transaction_id
            existing_payment.status = PaymentStatus.initiated
            existing_payment.gateway_reference = None
            existing_payment.verified_at = None
            payment = existing_payment
        else:
            payment = Payment(
                rsvp_id=existing_rsvp.id,
                gateway=PaymentGateway(payload.gateway),
                amount=total_amount,
                currency=event.currency,
                merchant_transaction_id=merchant_transaction_id,
                status=PaymentStatus.initiated,
            )
            db.add(payment)

        client = get_gateway(PaymentGateway(payload.gateway))
        result = await client.initiate_payment(
            merchant_transaction_id=merchant_transaction_id,
            amount=total_amount,
            event_title=event.title,
        )

        if result.gateway_reference:
            payment.gateway_reference = result.gateway_reference

        await db.commit()

        return CheckoutOut(
            rsvp_id=existing_rsvp.id,
            payment_id=payment.id,
            checkout_url=result.checkout_url,
            method=result.method,
            fields=result.fields,
            merchant_transaction_id=merchant_transaction_id,
            quantity=quantity,
        )

    # ── Already confirmed or waitlisted ──────────────────────────────────────
    if existing_rsvp:
        raise HTTPException(409, "You already have an active reservation for this event")

    # ── Free event: confirm immediately, no payment involved ─────────────────
    if not event.is_paid:
        status_ = await determine_initial_status(db, event, quantity)
        rsvp = RSVP(
            user_id=current_user.id,
            event_id=event_id,
            status=status_,
            quantity=quantity,
        )
        db.add(rsvp)
        await db.commit()
        await db.refresh(rsvp)
        return rsvp

    # ── Paid event: hold a pending reservation, send to checkout ─────────────
    if payload.gateway is None:
        raise HTTPException(400, "gateway is required for a paid event (esewa or khalti)")

    total_amount = Decimal(str(event.price)) * quantity

    rsvp = RSVP(
        user_id=current_user.id,
        event_id=event_id,
        status=RSVPStatus.pending_payment,
        quantity=quantity,
    )
    db.add(rsvp)
    await db.flush()  # assigns rsvp.id without committing yet

    merchant_transaction_id = str(uuid.uuid4())
    payment = Payment(
        rsvp_id=rsvp.id,
        gateway=PaymentGateway(payload.gateway),
        amount=total_amount,
        currency=event.currency,
        merchant_transaction_id=merchant_transaction_id,
        status=PaymentStatus.initiated,
    )
    db.add(payment)

    client = get_gateway(PaymentGateway(payload.gateway))
    result = await client.initiate_payment(
        merchant_transaction_id=merchant_transaction_id,
        amount=total_amount,
        event_title=event.title,
    )

    if result.gateway_reference:
        payment.gateway_reference = result.gateway_reference

    await db.commit()

    return CheckoutOut(
        rsvp_id=rsvp.id,
        payment_id=payment.id,
        checkout_url=result.checkout_url,
        method=result.method,
        fields=result.fields,
        merchant_transaction_id=merchant_transaction_id,
        quantity=quantity,
    )


@router.delete("/rsvps/{rsvp_id}")
async def cancel_rsvp(
    rsvp_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    rsvp = await db.get(RSVP, rsvp_id)
    if rsvp is None or rsvp.user_id != current_user.id:
        raise HTTPException(404, "Reservation not found")

    # Allow cancelling pending_payment RSVPs so users can start over
    was_confirmed = rsvp.status == RSVPStatus.confirmed
    rsvp.status = RSVPStatus.cancelled

    if was_confirmed:
        promoted = await promote_next_waitlisted(db, rsvp.event_id)
        # TODO: once notifications exist, queue one for `promoted` here

    await db.commit()
    return {"detail": "cancelled"}


@router.get("/users/me/reservations", response_model=list[RSVPOut])
async def my_reservations(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(RSVP)
        .where(RSVP.user_id == current_user.id, RSVP.status != RSVPStatus.cancelled)
        .order_by(RSVP.created_at.desc())
    )
    return result.scalars().all()