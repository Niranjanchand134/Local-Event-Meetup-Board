from datetime import datetime
from decimal import Decimal
from typing import Literal, Optional

from pydantic import BaseModel, Field


class ReserveRequest(BaseModel):
    gateway: Literal["esewa", "khalti"] | None = None  # required only when the event is paid
    quantity: int = Field(1, ge=1, le=10, description="Number of tickets to reserve (1 to 10)")


class RSVPOut(BaseModel):
    id: str
    event_id: str
    user_id: str
    status: str
    quantity: int = 1
    created_at: datetime

    class Config:
        from_attributes = True


class PaymentOut(BaseModel):
    id: str
    gateway: str
    amount: Decimal
    currency: str
    status: str
    merchant_transaction_id: str
    gateway_reference: Optional[str] = None
    created_at: datetime
    verified_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class RSVPWithPaymentOut(RSVPOut):
    """Extended RSVP with optional nested payment — used by admin/organizer panels."""
    payment: Optional[PaymentOut] = None
    user_name: Optional[str] = None
    user_email: Optional[str] = None

    class Config:
        from_attributes = True


class CheckoutOut(BaseModel):
    """
    Returned instead of RSVPOut when the event is paid — the frontend
    branches on `method`: GET means redirect the browser to checkout_url
    directly; POST means build a hidden form with `fields` and submit it
    to checkout_url (this is eSewa's requirement, see core/payments/esewa.py).
    """
    rsvp_id: str
    payment_id: str
    checkout_url: str
    method: Literal["GET", "POST"]
    fields: dict[str, str] = {}
    merchant_transaction_id: str
    quantity: int = 1


class VerifyPaymentRequest(BaseModel):
    merchant_transaction_id: str


class AdminPaymentOut(BaseModel):
    """Flat payment record enriched with user and event details — for admin panel."""
    payment_id: str
    rsvp_id: str
    event_id: str
    event_title: str
    user_id: str
    user_name: str
    user_email: str
    gateway: str
    amount: Decimal
    currency: str
    quantity: int = 1
    payment_status: str
    rsvp_status: str
    merchant_transaction_id: str
    gateway_reference: Optional[str] = None
    created_at: datetime
    verified_at: Optional[datetime] = None

    class Config:
        from_attributes = True