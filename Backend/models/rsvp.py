import uuid
from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database import Base
from models.enums import RSVPStatus


class RSVP(Base):
    __tablename__ = "rsvps"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )

    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    event_id: Mapped[str] = mapped_column(String(36), ForeignKey("events.id"), nullable=False, index=True)

    status: Mapped[RSVPStatus] = mapped_column(
        Enum(RSVPStatus, name="rsvp_status"), default=RSVPStatus.confirmed, nullable=False
    )
    quantity: Mapped[int] = mapped_column(default=1, nullable=False)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    payment: Mapped["Payment | None"] = relationship(
        "Payment", back_populates="rsvp", uselist=False, cascade="all, delete-orphan"
    )