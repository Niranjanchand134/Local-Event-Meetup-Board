import asyncio
import os

from core.security import hash_password
from database import AsyncSessionLocal
from models.enums import UserRole
from models.user import User


async def create_admin():
    admin_email = os.getenv("SEED_ADMIN_EMAIL")
    admin_password = os.getenv("SEED_ADMIN_PASSWORD")

    if not admin_email or not admin_password:
        print("Set SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD in your .env first.")
        return

    async with AsyncSessionLocal() as db:
        admin = User(
            name="Admin",
            email=admin_email,
            hashed_password=hash_password(admin_password),
            role=UserRole.admin,
        )
        db.add(admin)
        await db.commit()
        print(f"Admin created: {admin.email}")


if __name__ == "__main__":
    asyncio.run(create_admin())