from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from core.deps import get_current_user
from core.payments import get_gateway
from core.rsvp_logic import determine_initial_status
from database import get_db
from models.enums import PaymentStatus, RSVPStatus
from models.event import Event
from models.payment import Payment
from models.rsvp import RSVP
from models.user import User
from schemas.rsvp import RSVPOut, VerifyPaymentRequest

router = APIRouter(prefix="/payments", tags=["payments"])


@router.post("/verify", response_model=RSVPOut)
async def verify_payment(
    payload: VerifyPaymentRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Called by the frontend once the gateway redirects the user back —
    never trusts redirect query params alone, always re-verifies with
    the gateway's own server-side API before touching the RSVP.
    """
    result = await db.execute(
        select(Payment).where(Payment.merchant_transaction_id == payload.merchant_transaction_id)
    )
    payment = result.scalar_one_or_none()
    if payment is None:
        raise HTTPException(404, "Payment not found")

    rsvp = await db.get(RSVP, payment.rsvp_id)
    if rsvp is None or rsvp.user_id != current_user.id:
        raise HTTPException(403, "Not your reservation")

    if payment.status == PaymentStatus.verified:
        return rsvp  # idempotent — safe if the frontend calls this twice (e.g. page refresh)

    client = get_gateway(payment.gateway)
    verification = await client.verify_payment(
        merchant_transaction_id=payment.merchant_transaction_id,
        amount=payment.amount,
        gateway_reference=payment.gateway_reference,
    )

    if not verification.success:
        payment.status = PaymentStatus.failed
        rsvp.status = RSVPStatus.cancelled
        await db.commit()
        raise HTTPException(400, "Payment could not be verified")

    payment.status = PaymentStatus.verified
    payment.gateway_reference = verification.gateway_reference or payment.gateway_reference
    payment.verified_at = datetime.now(timezone.utc)

    event = await db.get(Event, rsvp.event_id)
    rsvp.status = await determine_initial_status(db, event, getattr(rsvp, "quantity", 1))

    await db.commit()
    await db.refresh(rsvp)
    return rsvp