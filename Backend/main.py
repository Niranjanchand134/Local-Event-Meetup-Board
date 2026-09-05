from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import Base, engine
from models import User
from routers import auth, users, verifications

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

        print("STARTUP: tables created")


app.include_router(auth.router)
app.include_router(users.router)
app.include_router(verifications.router)