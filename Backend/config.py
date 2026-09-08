from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    environment: str = "development"
    app_name: str = "Local Event & Meetup Board API"

    database_url: str = "sqlite+aiosqlite:///./event_board.db"

    frontend_base_url: str = "http://localhost:5173"

    jwt_secret_key: str = "CHANGE_ME_IN_PROD"
    jwt_algorithm: str = "HS256"

    # Local disk storage for uploaded verification documents.
    upload_dir: str = "uploads/verifications"
    max_upload_size_mb: int = 5

    # eSewa sandbox defaults — swap for real merchant credentials before launch.
    esewa_merchant_code: str = "EPAYTEST"
    esewa_secret_key: str = "8gBm/:&EnhH.1/q"
    esewa_form_url: str = "https://rc-epay.esewa.com.np/api/epay/main/v2/form"
    esewa_status_url: str = "https://rc.esewa.com.np/api/epay/transaction/status/"

    # Khalti sandbox defaults.
    khalti_secret_key: str = "test_secret_key_replace_me"
    khalti_initiate_url: str = "https://dev.khalti.com/api/v2/epayment/initiate/"
    khalti_lookup_url: str = "https://dev.khalti.com/api/v2/epayment/lookup/"


@lru_cache
def get_settings() -> Settings:
    return Settings()