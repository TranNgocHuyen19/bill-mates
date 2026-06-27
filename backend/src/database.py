from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from src.config import settings

# Create async engine with connection pooling
engine = create_async_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True
)

# Session factory for generating AsyncSession instances
SessionFactory = async_sessionmaker(
    bind=engine,
    expire_on_commit=False,
    class_=AsyncSession
)

# Dependency to provide an AsyncSession per request
async def get_db() -> AsyncSession:
    async with SessionFactory() as session:
        yield session
