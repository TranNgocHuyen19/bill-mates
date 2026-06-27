from fastapi import FastAPI
from app.core.config import settings

# Initialize FastAPI application
app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# Root status check endpoint
@app.get("/")
def read_root():
    return {"message": f"Welcome to {settings.PROJECT_NAME} API!"}
