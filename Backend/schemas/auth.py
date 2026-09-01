from pydantic import BaseModel, EmailStr
from typing import Literal

class SignupRequest(BaseModel):
    name: str
    email: EmailStr
    password: str
    requested_role: Literal["attendee", "organizer"] = "attendee"


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"