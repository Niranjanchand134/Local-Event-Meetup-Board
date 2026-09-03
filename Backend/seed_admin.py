import asyncio
import os
from dotenv import load_dotenv
from sqlalchemy import select, text

from core.security import hash_password
from database import AsyncSessionLocal, Base, engine
from models.enums import UserRole
from models.user import User

load_dotenv()


async def create_admin():
    admin_email = os.getenv("SEED_ADMIN_EMAIL")
    admin_password = os.getenv("SEED_ADMIN_PASSWORD")

    if not admin_email or not admin_password:
        print("Admin email or password not found in environment variables.")
        return

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        columns_res = await conn.execute(text("PRAGMA table_info(users)"))
        columns = [row[1] for row in columns_res.fetchall()]
        if "is_verified_organizer" not in columns:
            await conn.execute(text("ALTER TABLE users ADD COLUMN is_verified_organizer BOOLEAN DEFAULT 0 NOT NULL"))

    async with AsyncSessionLocal() as db:
        result = await db.execute(select(User).where(User.email == admin_email))
        existing_admin = result.scalar_one_or_none()

        if existing_admin:
            existing_admin.role = UserRole.admin
            existing_admin.hashed_password = hash_password(admin_password)
            await db.commit()
            print(f"Admin already exists. Updated role & password for: {existing_admin.email}")
        else:
            admin = User(
                name="System Admin",
                email=admin_email,
                hashed_password=hash_password(admin_password),
                role=UserRole.admin,
            )
            db.add(admin)
            await db.commit()
            print(f"Admin created: {admin.email}")


if __name__ == "__main__":
    asyncio.run(create_admin())