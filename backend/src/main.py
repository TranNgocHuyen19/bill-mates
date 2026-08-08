from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.api import configure_api
from src.config import settings
from src.health.router import router as health_router

from src.auth.router import router as auth_router
from src.debts.router import router as debts_router
from src.expenses.router import router as expenses_router
from src.rooms.router import router as rooms_router
from src.users.router import router as users_router

app_kwargs: dict[str, str | None] = {
    "title": settings.PROJECT_NAME,
    "openapi_url": f"{settings.API_V1_STR}/openapi.json",
}
if settings.ENVIRONMENT not in {"local", "development", "staging"}:
    app_kwargs["openapi_url"] = None

app = FastAPI(
    title=str(app_kwargs["title"]),
    openapi_url=app_kwargs["openapi_url"],
)
configure_api(app)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        settings.FRONTEND_URL,
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def read_root() -> dict[str, str]:
    return {"message": f"Welcome to {settings.PROJECT_NAME} API!"}


app.include_router(health_router, prefix=settings.API_V1_STR)
app.include_router(auth_router, prefix=settings.API_V1_STR)
app.include_router(users_router, prefix=settings.API_V1_STR)
app.include_router(rooms_router, prefix=settings.API_V1_STR)
app.include_router(expenses_router, prefix=settings.API_V1_STR)
app.include_router(debts_router, prefix=settings.API_V1_STR)
