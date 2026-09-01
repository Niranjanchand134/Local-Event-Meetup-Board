from pydantic import BaseModel


class UserMeResponse(BaseModel):
    id: str
    name: str
    email: str
    role: str
    requested_role: str
    is_suspended: bool
    is_verified_organizer: bool

    class Config:
        from_attributes = True