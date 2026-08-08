from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from src.config import settings

# Import Domain Routers
from src.auth.router import router as auth_router
from src.users.router import router as users_router
from src.rooms.router import router as rooms_router
from src.expenses.router import router as expenses_router
from src.debts.router import router as debts_router

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
async def read_root() -> dict[str, str]:
    return {"message": f"Welcome to {settings.PROJECT_NAME} API!"}

# Register Domain Routers under /api/v1
app.include_router(auth_router, prefix=settings.API_V1_STR)
app.include_router(users_router, prefix=settings.API_V1_STR)
app.include_router(rooms_router, prefix=settings.API_V1_STR)
app.include_router(expenses_router, prefix=settings.API_V1_STR)
app.include_router(debts_router, prefix=settings.API_V1_STR)
