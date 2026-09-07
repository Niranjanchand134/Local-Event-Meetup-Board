import enum


class UserRole(str, enum.Enum):
    user = "user"
    organizer = "organizer"
    admin = "admin"

class VerificationStatus(str, enum.Enum):
    not_submitted = "not_submitted"
    pending = "pending"
    approved = "approved"
    rejected = "rejected"


class DocumentType(str, enum.Enum):
    citizenship = "citizenship"
    passport = "passport"
    national_id = "national_id"

class EventCategory(str, enum.Enum):
    garage_sale = "garage_sale"
    free_tutoring = "free_tutoring"
    community_class = "community_class"
    park_cleanup = "park_cleanup"
    study_group = "study_group"
    workshop = "workshop"
    other = "other"


class EventStatus(str, enum.Enum):
    upcoming = "upcoming"
    completed = "completed"
    cancelled = "cancelled"