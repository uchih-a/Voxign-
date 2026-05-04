"""
Test configuration and fixtures for pytest.

Provides:
- Async test client
- Test database session
- Sample test data fixtures
"""

import pytest
import pytest_asyncio
from httpx import AsyncClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker

from app.config import settings
from app.database import Base, get_session
from app.main import app
from app.models import Role, User
from app.services import UserService


# Use in-memory SQLite for testing
TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"


@pytest.fixture(scope="session")
def event_loop():
    """Create event loop for async tests."""
    import asyncio

    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest_asyncio.fixture
async def test_db():
    """Create and migrate test database."""
    engine = create_async_engine(
        TEST_DATABASE_URL,
        connect_args={"check_same_thread": False},
        poolclass=None,
    )

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async_session = sessionmaker(
        engine, class_=AsyncSession, expire_on_commit=False
    )

    yield async_session

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)

    await engine.dispose()


@pytest_asyncio.fixture
async def db_session(test_db) -> AsyncSession:
    """Get a database session for tests."""
    async with test_db() as session:
        yield session


@pytest_asyncio.fixture
async def test_admin_user(db_session: AsyncSession) -> User:
    """Create a test admin user."""
    # Create role
    admin_role = Role(name="admin", description="Admin role")
    db_session.add(admin_role)
    await db_session.flush()

    # Create user
    user = await UserService.create_user(
        session=db_session,
        email="admin@test.com",
        password="TestPass123",
        full_name="Admin User",
        role_id=admin_role.id,
    )
    await db_session.commit()
    await db_session.refresh(user, ["role"])
    return user


@pytest_asyncio.fixture
async def test_regular_user(db_session: AsyncSession) -> User:
    """Create a test regular user."""
    # Create role
    result = await db_session.execute(select(Role).where(Role.name == "user"))
    user_role = result.scalar_one_or_none()

    if not user_role:
        user_role = Role(name="user", description="User role")
        db_session.add(user_role)
        await db_session.flush()

    # Create user
    user = await UserService.create_user(
        session=db_session,
        email="user@test.com",
        password="TestPass123",
        full_name="Regular User",
        role_id=user_role.id,
    )
    await db_session.commit()
    await db_session.refresh(user, ["role"])
    return user


@pytest_asyncio.fixture
async def async_client(db_session: AsyncSession) -> AsyncClient:
    """Create async HTTP client for testing.

    Overrides database dependency to use test session.
    """

    async def override_get_session():
        yield db_session

    app.dependency_overrides[get_session] = override_get_session

    async with AsyncClient(app=app, base_url="http://test") as client:
        yield client

    app.dependency_overrides.clear()
