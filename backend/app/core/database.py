from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from app.core.config import settings

# Create SQLAlchemy engine with connection pool configurations
engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,  # Test connection health before running queries
    pool_size=5,         # Maximum number of persistent connections in pool
    max_overflow=10      # Allowed temporary connections beyond pool_size
)

# Create SessionLocal session class for database transactions
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create base model class for SQLAlchemy models to inherit from
Base = declarative_base()

# FastAPI dependency to yield database session per request
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()  # Ensure connection is closed after request completes
