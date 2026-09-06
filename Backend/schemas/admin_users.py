from datetime import datetime
from typing import Literal

from pydantic import BaseModel, computed_field

from models.user import User


class AdminUserOut(BaseModel):
    """
    Shaped to AdminUserRecord — uppercase
    role/status strings, camelCase-friendly field names via alias.
    """
    id: str
    name: str
    email: str
    role: Literal["USER", "ORGANIZER", "ADMIN"]
    status: Literal["ACTIVE", "SUSPENDED"]
    events_created: int = 0
    events_joined: int = 0
    created_at: datetime

    class Config:
        populate_by_name = True

    @staticmethod
    def from_user(user: User) -> "AdminUserOut":
        """
        Single place that maps a User row -> the admin table shape.
        events_created/events_joined are hardcoded to 0 for now —
        TODO: once the Event/RSVP models exist, replace with real
        counts (COUNT of events where created_by == user.id, and
        COUNT of rsvps where user_id == user.id).
        """
        return AdminUserOut(
            id=user.id,
            name=user.name,
            email=user.email,
            role=user.role.value.upper(),
            status="SUSPENDED" if user.is_suspended else "ACTIVE",
            events_created=0,
            events_joined=0,
            created_at=user.created_at,
        )


class UserSuspendRequest(BaseModel):
    suspend: bool  # true = suspend, false = reactivate