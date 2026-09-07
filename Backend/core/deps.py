from fastapi import Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from core.security import decode_access_token
from database import get_db
from models.enums import UserRole
from models.user import User

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")


async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db),
) -> User:
    credentials_error = HTTPException(401, "Could not validate credentials")

    try:
        payload = decode_access_token(token)
        user_id = payload.get("sub")
        if user_id is None:
            raise credentials_error
    except JWTError:
        raise credentials_error

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()

    if user is None:
        raise credentials_error
    if user.is_suspended:
        raise HTTPException(403, "This account has been suspended")

    return user


def require_admin(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role != UserRole.admin:
        raise HTTPException(403, "Admin access required")
    return current_user

def require_organizer(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role != UserRole.organizer:
        raise HTTPException(403, "Organizer access required")
    return current_user

def require_verified_organizer(current_user: User = Depends(get_current_user)) -> User:
    """
    Gates event creation specifically. An organizer who hasn't been
    approved through the verification workflow can log in and see their
    dashboard, but cannot create an event until is_verified_organizer
    is true — this is the actual anti-scam gate from the original goal.
    """
    if current_user.role != UserRole.organizer:
        raise HTTPException(403, "Organizer access required")
    if not current_user.is_verified_organizer:
        raise HTTPException(
            403,
            "Your organizer account must be verified before you can create events. "
            "Submit a verification application from your dashboard.",
        )
    return current_user