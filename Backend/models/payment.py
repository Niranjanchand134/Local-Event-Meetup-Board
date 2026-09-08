import uuid
from datetime import datetime
from decimal import Decimal

from sqlalchemy import DateTime, Enum, ForeignKey, Numeric, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database import Base
from models.enums import PaymentGateway, PaymentStatus


class Payment(Base):
    __tablename__ = "payments"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )

    rsvp_id: Mapped[str] = mapped_column(String(36), ForeignKey("rsvps.id"), nullable=False, unique=True)

    gateway: Mapped[PaymentGateway] = mapped_column(Enum(PaymentGateway, name="payment_gateway"), nullable=False)
    amount: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    currency: Mapped[str] = mapped_column(String(3), default="NPR", nullable=False)

    # Our own reference, sent to the gateway and matched on the way back —
    # this is what ties an incoming callback to the right RSVP.
    merchant_transaction_id: Mapped[str] = mapped_column(String(64), unique=True, nullable=False)

    # The gateway's own transaction identifier, populated once verified.
    gateway_reference: Mapped[str | None] = mapped_column(String(128), nullable=True)

    status: Mapped[PaymentStatus] = mapped_column(
        Enum(PaymentStatus, name="payment_status"), default=PaymentStatus.initiated, nullable=False
    )

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    verified_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    rsvp: Mapped["RSVP"] = relationship("RSVP", back_populates="payment")