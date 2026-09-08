from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import Base, engine
from models import User
from routers import auth, users, verifications, admin_users, events, rsvps, payments, admin_payments

# Local Event & Meetup Board Backend Application
app = FastAPI(title="Local Event & Meetup Board API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def on_startup():
    print("STARTUP: connecting to database...")

    async with engine.begin() as conn:
        print("STARTUP: database connected")

        await conn.run_sync(Base.metadata.create_all)
        # Ensure quantity column exists on existing rsvps table if created previously
        try:
            from sqlalchemy import text
            await conn.execute(text("ALTER TABLE rsvps ADD COLUMN quantity INTEGER DEFAULT 1 NOT NULL"))
        except Exception:
            pass

        print("STARTUP: tables created")


app.include_router(auth.router)
app.include_router(users.router)
app.include_router(verifications.router)
app.include_router(admin_users.router)
app.include_router(events.router)
app.include_router(rsvps.router)
app.include_router(payments.router)
app.include_router(admin_payments.router)