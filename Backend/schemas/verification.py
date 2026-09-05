import re
from datetime import date, datetime
from typing import Literal

from fastapi import Form
from pydantic import BaseModel, Field, field_validator, model_validator

NAME_PATTERN = re.compile(r"^[A-Za-z\s.'-]+$")
MIN_BIRTH_YEAR = 1900

# Nepal specific document patterns
CITIZENSHIP_PATTERN = re.compile(r"^[0-9]+([/-][0-9]+)*$")
PASSPORT_PATTERN = re.compile(r"^[A-Za-z0-9]{7,9}$")


class VerificationSubmitRequest(BaseModel):
    full_legal_name: str = Field(..., min_length=2, max_length=150)
    date_of_birth: date
    address: str = Field(..., min_length=5, max_length=300)
    document_type: Literal["citizenship", "passport", "national_id"]
    document_number: str = Field(..., min_length=3, max_length=50)

    @field_validator("full_legal_name")
    @classmethod
    def valid_name(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Full legal name cannot be blank")
        if not NAME_PATTERN.match(v):
            raise ValueError("Full legal name can only contain letters, spaces, apostrophes, periods, and hyphens")
        return v

    @field_validator("date_of_birth")
    @classmethod
    def must_be_adult_and_realistic(cls, v: date) -> date:
        today = date.today()

        if v > today:
            raise ValueError("Date of birth cannot be in the future")

        if v.year < MIN_BIRTH_YEAR:
            raise ValueError(f"Date of birth cannot be before {MIN_BIRTH_YEAR}")

        age = today.year - v.year - ((today.month, today.day) < (v.month, v.day))
        if age < 18:
            raise ValueError("Organizer must be at least 18 years old")
        if age > 120:
            raise ValueError("Please check the date of birth entered")

        return v

    @field_validator("address")
    @classmethod
    def valid_address(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Address cannot be blank")
        return v

    @field_validator("document_type")
    @classmethod
    def valid_document_type(cls, v: str) -> str:
        allowed = {"citizenship", "passport", "national_id"}
        if v not in allowed:
            raise ValueError(f"document_type must be one of: {', '.join(sorted(allowed))}")
        return v

    @model_validator(mode="after")
    def validate_nepal_document(self) -> "VerificationSubmitRequest":
        doc_type = self.document_type
        doc_num = self.document_number.strip()
        self.document_number = doc_num

        if not doc_num:
            raise ValueError("Document number cannot be blank")

        if doc_type == "citizenship":
            # Nepal citizenship numbers: e.g. 27-01-78-12345, 1234/5678, 271045/123
            digits_only = re.sub(r"[/-]", "", doc_num)
            if not CITIZENSHIP_PATTERN.match(doc_num) or len(digits_only) < 3 or len(doc_num) > 30:
                raise ValueError("Invalid Nepal Citizenship number format (e.g., 27-01-78-12345 or 1234/5678)")
        elif doc_type == "passport":
            # Nepal MRP or E-passport: 7 to 9 alphanumeric chars e.g. 08123456, PA0123456, N12345678
            clean_num = doc_num.replace(" ", "")
            if not PASSPORT_PATTERN.match(clean_num) or not any(c.isdigit() for c in clean_num):
                raise ValueError("Invalid Nepal Passport number (7-9 characters, e.g., 08123456 or PA0123456)")
            self.document_number = clean_num.upper()
        elif doc_type == "national_id":
            # Nepal National Identity Number (NIN): 10-digit number e.g. 1234567890 or 123-456-7890
            digits_only = re.sub(r"[-\s]", "", doc_num)
            if not (digits_only.isdigit() and len(digits_only) == 10):
                raise ValueError("Nepal National ID must be a 10-digit number (e.g., 1234567890 or 123-456-7890)")

        return self


def verification_form(
    full_legal_name: str = Form(...),
    date_of_birth: date = Form(...),
    address: str = Form(...),
    document_type: str = Form(...),
    document_number: str = Form(...),
) -> VerificationSubmitRequest:
    """
    Multipart Form(...) fields skip Pydantic validation by default —
    this dependency funnels them through VerificationSubmitRequest so
    every validator above actually runs before the route body executes.
    """
    return VerificationSubmitRequest(
        full_legal_name=full_legal_name,
        date_of_birth=date_of_birth,
        address=address,
        document_type=document_type,
        document_number=document_number,
    )


class VerificationOut(BaseModel):
    id: str
    status: str
    document_type: str
    submitted_at: datetime
    reviewed_at: datetime | None = None
    admin_note: str | None = None

    class Config:
        from_attributes = True


class VerificationAdminOut(VerificationOut):
    user_id: str
    full_legal_name: str
    date_of_birth: date
    address: str
    document_number: str
    reviewed_by: str | None = None


class VerificationStatsOut(BaseModel):
    pending: int
    approved: int
    rejected: int
    total: int


class VerificationReviewRequest(BaseModel):
    decision: Literal["approved", "rejected"]
    admin_note: str | None = Field(None, max_length=500)

    @field_validator("admin_note")
    @classmethod
    def note_required_if_rejected(cls, v: str | None, info) -> str | None:
        decision = info.data.get("decision")
        if decision == "rejected" and (v is None or not v.strip()):
            raise ValueError("admin_note is required when rejecting an application")
        return v.strip() if v else v