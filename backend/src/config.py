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
    OCR_ENABLED: bool = True
    OCR_LANGUAGE: str = "vi"
    OCR_VERSION: str = "PP-OCRv5"
    OCR_DEVICE: str = "cpu"
    OCR_CPU_THREADS: int = 4
    OCR_ENABLE_MKLDNN: bool = False
    OCR_TEXT_DETECTION_MODEL: str = "PP-OCRv5_mobile_det"
    OCR_TEXT_RECOGNITION_MODEL: str = "latin_PP-OCRv5_mobile_rec"


settings = Settings()
