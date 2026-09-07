import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, Enum, ForeignKey, Numeric, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database import Base
from models.enums import EventCategory, EventStatus


class Event(Base):
    __tablename__ = "events"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )

    # Core content
    title: Mapped[str] = mapped_column(String(150), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    category: Mapped[EventCategory] = mapped_column(
        Enum(EventCategory, name="event_category"), nullable=False
    )

    # Schedule (single-day, optional end time)
    start_time: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    end_time: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    # Location
    venue_name: Mapped[str | None] = mapped_column(String(150), nullable=True)
    address: Mapped[str | None] = mapped_column(String(255), nullable=True)
    city: Mapped[str | None] = mapped_column(String(100), nullable=True)
    is_online: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    meeting_link: Mapped[str | None] = mapped_column(String(500), nullable=True)

    # Pricing (informational only — no checkout integration yet)
    is_paid: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    price: Mapped[float | None] = mapped_column(Numeric(10, 2), nullable=True)
    currency: Mapped[str] = mapped_column(String(3), default="NPR", nullable=False)

    # Capacity
    max_attendees: Mapped[int | None] = mapped_column(nullable=True)

    # Media
    cover_image_path: Mapped[str | None] = mapped_column(String(255), nullable=True)

    # Ownership + lifecycle
    created_by: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), nullable=False)
    status: Mapped[EventStatus] = mapped_column(
        Enum(EventStatus, name="event_status"), default=EventStatus.upcoming, nullable=False
    )

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    schedule_items: Mapped[list["EventScheduleItem"]] = relationship(
        "EventScheduleItem", back_populates="event", cascade="all, delete-orphan",
        order_by="EventScheduleItem.item_time", lazy="selectin"
    )