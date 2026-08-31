from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    environment: str = "development"
    app_name: str = "Local Event & Meetup Board API"

    # SQLite for now — swap this one line for a postgresql+asyncpg:// URL later
    database_url: str = "sqlite+aiosqlite:///./event_board.db"

    jwt_secret_key: str = "CHANGE_ME_IN_PROD"
    jwt_algorithm: str = "HS256"


@lru_cache
def get_settings() -> Settings:
    return Settings()