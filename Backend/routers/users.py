from fastapi import APIRouter, Depends

from core.deps import get_current_user, require_admin, require_organizer
from models.user import User
from schemas.user import UserMeResponse

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/me", response_model=UserMeResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    return current_user

@router.get("/me/operator-check", response_model=UserMeResponse)
async def operator_check(current_user: User = Depends(require_organizer)):
    return current_user

@router.get("/me/admin-check", response_model=UserMeResponse)
async def admin_check(current_user: User = Depends(require_admin)):
    return current_user