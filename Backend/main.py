from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import Base, engine
from models import User  # noqa: F401 — registers model with Base.metadata
from routers import auth, users

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
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


app.include_router(auth.router)
app.include_router(users.router)


@app.get("/")
async def root():
    return {"status": "ok", "service": "Local Event & Meetup Board API"}
