"""
Database configuration and session management using SQLAlchemy async.

This module provides:
- Async SQLAlchemy engine
- Session factory for async sessions
- Base class for ORM models
"""

from typing import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

from app.config import settings


class Base(DeclarativeBase):
    """Base class for all SQLAlchemy ORM models."""

    pass


# Create async engine with connection pooling
engine = create_async_engine(
    settings.database_url,
    echo=settings.app_env == "development",  # Log SQL in development
    future=True,
    pool_pre_ping=True,  # Verify connections before using them
    pool_size=10,
    max_overflow=20,
)

# Session factory for creating async sessions
async_session_maker = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,
    autocommit=False,
)


async def get_session() -> AsyncGenerator[AsyncSession, None]:
    """Dependency to get a database session.

    Yields an async session for use in route handlers.
    Session is automatically closed after use.

    Yields:
        AsyncSession: Database session for the request.
    """
    async with async_session_maker() as session:
        try:
            yield session
        finally:
            await session.close()


async def init_db() -> None:
    """Initialize the database by creating all tables.

    Runs all migrations and creates tables based on Base metadata.
    Should be called during application startup.
    """
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


async def dispose_db() -> None:
    """Dispose of the database engine and clean up resources.

    Should be called during application shutdown.
    """
    await engine.dispose()
