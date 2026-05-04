"""
User service - CRUD operations for users.

All database operations are async. No HTTP concerns here.
"""

import logging
from uuid import UUID

from sqlalchemy import and_, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.security import hash_password, verify_password
from app.models import Role, User

logger = logging.getLogger(__name__)


class UserService:
    """Service for user CRUD operations."""

    @staticmethod
    async def create_user(
        session: AsyncSession,
        email: str,
        password: str,
        full_name: str | None = None,
        role_id: int = 2,  # Default to 'user' role
    ) -> User:
        """Create a new user.

        Args:
            session: Database session.
            email: User email address.
            password: Plain text password (will be hashed).
            full_name: Optional full name.
            role_id: Role ID (defaults to user role).

        Returns:
            Created User object.

        Raises:
            ValueError: If email already exists.
        """
        # Check if email already exists
        existing = await session.execute(select(User).where(User.email == email))
        if existing.scalar_one_or_none():
            raise ValueError(f"Email {email} already exists")

        # Hash password
        hashed_pwd = hash_password(password)

        # Create user
        user = User(
            email=email,
            hashed_password=hashed_pwd,
            full_name=full_name,
            role_id=role_id,
        )

        session.add(user)
        await session.flush()  # Get the ID without committing
        logger.info(f"Created user {user.id} with email {email}")

        return user

    @staticmethod
    async def get_user_by_id(session: AsyncSession, user_id: UUID) -> User | None:
        """Get a user by ID with role relationship eagerly loaded.

        Args:
            session: Database session.
            user_id: UUID of the user.

        Returns:
            User object or None if not found.
        """
        result = await session.execute(
            select(User)
            .where(User.id == user_id)
            .options(selectinload(User.role))
        )
        return result.scalar_one_or_none()

    @staticmethod
    async def get_user_by_email(session: AsyncSession, email: str) -> User | None:
        """Get a user by email with role relationship eagerly loaded.

        Args:
            session: Database session.
            email: Email address.

        Returns:
            User object or None if not found.
        """
        result = await session.execute(
            select(User)
            .where(User.email == email)
            .options(selectinload(User.role))
        )
        return result.scalar_one_or_none()

    @staticmethod
    async def verify_credentials(
        session: AsyncSession,
        email: str,
        password: str,
    ) -> User | None:
        """Verify user credentials.

        Args:
            session: Database session.
            email: User email.
            password: Plain text password.

        Returns:
            User object if credentials are valid, None otherwise.
        """
        user = await UserService.get_user_by_email(session, email)
        if not user:
            return None

        if not verify_password(password, user.hashed_password):
            return None

        return user

    @staticmethod
    async def update_user(
        session: AsyncSession,
        user_id: UUID,
        full_name: str | None = None,
        password: str | None = None,
    ) -> User | None:
        """Update a user's profile.

        Args:
            session: Database session.
            user_id: UUID of the user to update.
            full_name: New full name (optional).
            password: New password (optional, will be hashed).

        Returns:
            Updated User object or None if not found.
        """
        user = await UserService.get_user_by_id(session, user_id)
        if not user:
            return None

        if full_name is not None:
            user.full_name = full_name

        if password is not None:
            user.hashed_password = hash_password(password)

        await session.flush()
        logger.info(f"Updated user {user_id}")

        return user

    @staticmethod
    async def set_refresh_token(
        session: AsyncSession,
        user_id: UUID,
        refresh_token: str | None,
    ) -> User | None:
        """Set or clear the refresh token for a user.

        Args:
            session: Database session.
            user_id: UUID of the user.
            refresh_token: New refresh token (hashed) or None to clear.

        Returns:
            Updated User object or None if not found.
        """
        user = await UserService.get_user_by_id(session, user_id)
        if not user:
            return None

        # Hash refresh token before storing
        if refresh_token:
            user.refresh_token = hash_password(refresh_token)
        else:
            user.refresh_token = None

        await session.flush()
        return user

    @staticmethod
    async def verify_refresh_token(
        session: AsyncSession,
        user_id: UUID,
        refresh_token: str,
    ) -> bool:
        """Verify a refresh token against stored hash.

        Args:
            session: Database session.
            user_id: UUID of the user.
            refresh_token: Plain refresh token from client.

        Returns:
            True if token is valid, False otherwise.
        """
        user = await UserService.get_user_by_id(session, user_id)
        if not user or not user.refresh_token:
            return False

        return verify_password(refresh_token, user.refresh_token)

    @staticmethod
    async def deactivate_user(session: AsyncSession, user_id: UUID) -> User | None:
        """Soft-delete a user by setting is_active to False.

        Args:
            session: Database session.
            user_id: UUID of the user.

        Returns:
            Deactivated User object or None if not found.
        """
        user = await UserService.get_user_by_id(session, user_id)
        if not user:
            return None

        user.is_active = False
        await session.flush()
        logger.info(f"Deactivated user {user_id}")

        return user

    @staticmethod
    async def set_user_role(
        session: AsyncSession,
        user_id: UUID,
        role_id: int,
    ) -> User | None:
        """Change a user's role.

        Args:
            session: Database session.
            user_id: UUID of the user.
            role_id: New role ID.

        Returns:
            Updated User object or None if not found.
        """
        user = await UserService.get_user_by_id(session, user_id)
        if not user:
            return None

        user.role_id = role_id
        await session.flush()
        logger.info(f"Changed user {user_id} role to {role_id}")

        return user

    @staticmethod
    async def list_users(
        session: AsyncSession,
        page: int = 1,
        page_size: int = 20,
    ) -> tuple[int, list[User]]:
        """List all users with pagination and roles eagerly loaded.

        Args:
            session: Database session.
            page: Page number (1-indexed).
            page_size: Number of items per page.

        Returns:
            Tuple of (total_count, users_list).
        """
        # Get total count
        count_result = await session.execute(select(func.count()).select_from(User))
        total = count_result.scalar() or 0

        # Get paginated results
        offset = (page - 1) * page_size
        result = await session.execute(
            select(User)
            .options(selectinload(User.role))
            .offset(offset)
            .limit(page_size)
        )
        users = result.scalars().all()

        return total, users

    @staticmethod
    async def get_role_by_name(session: AsyncSession, role_name: str) -> Role | None:
        """Get a role by name.

        Args:
            session: Database session.
            role_name: Role name (admin or user).

        Returns:
            Role object or None if not found.
        """
        result = await session.execute(select(Role).where(Role.name == role_name))
        return result.scalar_one_or_none()
    