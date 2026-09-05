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