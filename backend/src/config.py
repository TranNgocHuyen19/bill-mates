from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    # Specify the configuration model config to read .env file
    model_config = SettingsConfigDict(
        env_file=".env", 
        env_ignore_empty=True, 
        extra="ignore"
    )

    PROJECT_NAME: str = "Room Expense Manager"
    API_V1_STR: str = "/api/v1"
    
    # Database configuration
    DATABASE_URL: str
    
    # Supabase authentication configurations
    SUPABASE_URL: str
    SUPABASE_JWT_SECRET: str
    SUPABASE_SERVICE_ROLE_KEY: str

# Create settings singleton instance
settings = Settings()
