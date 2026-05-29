"""Per-app configuration (Pydantic Settings).

Company Profile has NO authentication, so no JWT secret. Only the
service-role DB connection and CORS origins are needed.
"""

from __future__ import annotations

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    APP_NAME: str = "peken-cp-api"
    ENV: str = Field(default="local", pattern=r"^(local|staging|production)$")
    LOG_LEVEL: str = "INFO"

    # --- Supabase / DB --------------------------------------------------------
    # SUPABASE_URL kept for parity with other backends (not strictly needed here
    # since CP doesn't use the Supabase Admin SDK or Storage).
    SUPABASE_URL: str = ""
    SUPABASE_SERVICE_ROLE_KEY: str = ""
    SUPABASE_DB_URL: str = (
        # Empty default keeps unit tests independent of a real DB.
        # Production MUST set this to a +asyncpg DSN.
        ""
    )

    # --- CORS ----------------------------------------------------------------
    # Comma-separated list of allowed origins. Empty → ["*"]. Public CP can
    # be world-readable, but FE expects a friendly preflight from the configured
    # site origin.
    CORS_ORIGINS: str = ""

    # --- DB pool sizing -------------------------------------------------------
    DB_POOL_SIZE: int = 5
    DB_POOL_MAX_OVERFLOW: int = 3
    DB_POOL_TIMEOUT_SECONDS: int = 30

    def cors_origins_list(self) -> list[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]


settings = Settings()
