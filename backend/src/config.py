from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_ignore_empty=True,
        extra="ignore",
        case_sensitive=False,
    )

    PROJECT_NAME: str = "Room Expense Manager"
    API_V1_STR: str = "/api/v1"
    ENVIRONMENT: str = "local"
    FRONTEND_URL: str = "http://localhost:3000"
    DATABASE_URL: str
    SUPABASE_URL: str
    SUPABASE_JWT_SECRET: str
    SUPABASE_SERVICE_ROLE_KEY: str
    SUPABASE_JWT_AUDIENCE: str = "authenticated"


settings = Settings()
