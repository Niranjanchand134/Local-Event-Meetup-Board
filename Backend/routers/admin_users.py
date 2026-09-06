from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from core.deps import require_admin
from database import get_db
from models.user import User
from schemas.admin_users import AdminUserOut, UserSuspendRequest

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/users", response_model=list[AdminUserOut])
async def list_all_users(
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    """
    Returns every user in the system. Search and role-filtering happen
    client-side (matches the current frontend design) — revisit with
    query params + pagination once the user base is large enough that
    shipping the full list every time becomes wasteful.
    """
    result = await db.execute(select(User).order_by(User.created_at.desc()))
    users = result.scalars().all()
    return [AdminUserOut.from_user(u) for u in users]


@router.patch("/users/{user_id}/suspend", response_model=AdminUserOut)
async def suspend_or_reactivate_user(
    user_id: str,
    payload: UserSuspendRequest,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
):
    """Toggles is_suspended — powers the block/restart_alt button per row."""
    user = await db.get(User, user_id)
    if user is None:
        raise HTTPException(404, "User not found")

    if user.id == admin.id and payload.suspend:
        raise HTTPException(400, "You cannot suspend your own account")

    user.is_suspended = payload.suspend
    await db.commit()
    await db.refresh(user)

    return AdminUserOut.from_user(user)