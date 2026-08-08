from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from src.config import settings
from src.users.dependencies import get_current_user

# Initialize FastAPI application
app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# Enable CORS for local frontend development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Root status check endpoint
@app.get("/")
async def read_root():
    return {"message": f"Welcome to {settings.PROJECT_NAME} API!"}

# Get current user profile endpoint
@app.get(f"{settings.API_V1_STR}/auth/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    return {
        "status": "success",
        "data": current_user
    }

# Backend Auth Login Endpoint
@app.post(f"{settings.API_V1_STR}/auth/login")
async def auth_login(data: dict):
    return {
        "status": "success",
        "message": "Auth login endpoint ready. Auth is verified via Supabase Token."
    }

# Backend Auth Register Endpoint
@app.post(f"{settings.API_V1_STR}/auth/register")
async def auth_register(data: dict):
    return {
        "status": "success",
        "message": "Auth register endpoint ready."
    }


