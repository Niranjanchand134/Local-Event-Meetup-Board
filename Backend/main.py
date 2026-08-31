from fastapi import FastAPI
from database import engine, Base

app = FastAPI(title="Local Event & Meetup Board API")


@app.on_event("startup")
async def on_startup():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


@app.get("/")
async def root():
    return {"status": "ok", "service": "Local Event & Meetup Board API"}
