from datetime import date, datetime
from decimal import Decimal
from typing import Literal

from pydantic import BaseModel, Field, field_validator, model_validator

MAX_CAPACITY = 10_000


class ScheduleItemIn(BaseModel):
    item_time: datetime
    title: str = Field(..., min_length=2, max_length=150)
    description: str | None = Field(None, max_length=1000)
    sort_order: int = 0

    @field_validator("title")
    @classmethod
    def title_not_blank(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Schedule item title cannot be blank")
        return v


class ScheduleItemOut(BaseModel):
    id: str
    item_time: datetime
    title: str
    description: str | None = None
    sort_order: int

    class Config:
        from_attributes = True


class EventCreate(BaseModel):
    title: str = Field(..., min_length=3, max_length=150)
    description: str = Field(..., min_length=10, max_length=5000)
    category: Literal[
        "garage_sale", "free_tutoring", "community_class",
        "park_cleanup", "study_group", "workshop", "other",
    ]

    start_time: datetime
    end_time: datetime | None = None

    venue_name: str | None = Field(None, max_length=150)
    address: str | None = Field(None, max_length=255)
    city: str | None = Field(None, max_length=100)
    is_online: bool = False
    meeting_link: str | None = Field(None, max_length=500)

    is_paid: bool = False
    price: Decimal | None = Field(None, ge=0, le=1_000_000)
    currency: str = Field("NPR", min_length=3, max_length=3)

    max_attendees: int | None = Field(None, ge=1, le=MAX_CAPACITY)

    schedule_items: list[ScheduleItemIn] = Field(default_factory=list)

    # ---------- field-level checks ----------

    @field_validator("title")
    @classmethod
    def title_not_blank(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Title cannot be blank")
        return v

    @field_validator("description")
    @classmethod
    def description_not_blank(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Description cannot be blank")
        return v

    @field_validator("start_time")
    @classmethod
    def start_time_in_future(cls, v: datetime) -> datetime:
        if v <= datetime.now(v.tzinfo):
            raise ValueError("start_time must be in the future")
        return v

    @field_validator("meeting_link")
    @classmethod
    def valid_meeting_link(cls, v: str | None) -> str | None:
        if v and not (v.startswith("http://") or v.startswith("https://")):
            raise ValueError("meeting_link must be a valid URL")
        return v

    # ---------- cross-field checks ----------

    @model_validator(mode="after")
    def check_end_after_start(self) -> "EventCreate":
        if self.end_time and self.end_time <= self.start_time:
            raise ValueError("end_time must be after start_time")
        return self

    @model_validator(mode="after")
    def check_location_fields(self) -> "EventCreate":
        if self.is_online:
            if not self.meeting_link:
                raise ValueError("meeting_link is required for online events")
        else:
            if not self.address or not self.city:
                raise ValueError("address and city are required for in-person events")
        return self

    @model_validator(mode="after")
    def check_pricing_fields(self) -> "EventCreate":
        if self.is_paid and (self.price is None or self.price <= 0):
            raise ValueError("price is required and must be greater than 0 for paid events")
        if not self.is_paid and self.price is not None:
            raise ValueError("price should not be set for free events")
        return self

    @model_validator(mode="after")
    def check_schedule_items_within_event(self) -> "EventCreate":
        """
        Schedule items should fall on the same calendar day as start_time —
        prevents an accidental typo (e.g. item_time a year off) from
        silently attaching a schedule item to the wrong date.
        """
        event_date = self.start_time.date()
        for item in self.schedule_items:
            if item.item_time.date() != event_date:
                raise ValueError(
                    f"Schedule item '{item.title}' must be on the same date as the event ({event_date})"
                )
        return self


class EventUpdate(BaseModel):
    """All fields optional — used for PATCH, including the cancel action
    via {"status": "cancelled"}."""
    title: str | None = Field(None, min_length=3, max_length=150)
    description: str | None = Field(None, min_length=10, max_length=5000)
    category: Literal[
        "garage_sale", "free_tutoring", "community_class",
        "park_cleanup", "study_group", "workshop", "other",
    ] | None = None

    start_time: datetime | None = None
    end_time: datetime | None = None

    venue_name: str | None = Field(None, max_length=150)
    address: str | None = Field(None, max_length=255)
    city: str | None = Field(None, max_length=100)
    is_online: bool | None = None
    meeting_link: str | None = Field(None, max_length=500)

    is_paid: bool | None = None
    price: Decimal | None = Field(None, ge=0, le=1_000_000)
    currency: str | None = Field(None, min_length=3, max_length=3)

    max_attendees: int | None = Field(None, ge=1, le=MAX_CAPACITY)

    status: Literal["upcoming", "completed", "cancelled"] | None = None


class EventOut(BaseModel):
    id: str
    title: str
    description: str
    category: str

    start_time: datetime
    end_time: datetime | None = None

    venue_name: str | None = None
    address: str | None = None
    city: str | None = None
    is_online: bool
    meeting_link: str | None = None

    is_paid: bool
    price: Decimal | None = None
    currency: str

    max_attendees: int | None = None
    confirmed_count: int = 0
    spots_left: int | None = None

    cover_image_path: str | None = None
    created_by: str
    status: str
    created_at: datetime

    schedule_items: list[ScheduleItemOut] = []

    class Config:
        from_attributes = True

def build_event_out(event, confirmed_count: int = 0) -> EventOut:
    """
    Maps an Event ORM row -> EventOut, computing spots_left.
    confirmed_count defaults to 0 for now — TODO: once the RSVP model
    exists, pass the real count from a query instead of the default.
    """
    spots_left = None
    if event.max_attendees is not None:
        spots_left = max(event.max_attendees - confirmed_count, 0)

    data = EventOut.model_validate(event)
    data.confirmed_count = confirmed_count
    data.spots_left = spots_left
    return data