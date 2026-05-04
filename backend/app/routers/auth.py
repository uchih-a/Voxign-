"""
Authentication router - /auth endpoints.

Public endpoints:
- POST /auth/register - Register new user
- POST /auth/login - Login user
- POST /auth/refresh - Refresh tokens

Protected endpoints:
- POST /auth/logout - Logout user
"""

import logging
from re import match as re_match

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import CurrentUser, get_current_user
from app.core.exceptions import raise_bad_request, raise_conflict, raise_unauthorized
from app.database import get_session
from app.schemas import (
    LoginRequest,
    LogoutResponse,
    RefreshTokenRequest,
    RegisterRequest,
    TokenResponse,
    UserResponse,
)
from app.services import AuthService, UserService

router = APIRouter(prefix="/auth", tags=["auth"])
logger = logging.getLogger(__name__)


def _validate_password(password: str) -> bool:
    """Validate password strength requirements.

    Requirements:
    - At least 8 characters
    - At least one uppercase letter
    - At least one lowercase letter
    - At least one digit

    Args:
        password: Password to validate.

    Returns:
        True if password meets all requirements.
    """
    return (
        len(password) >= 8
        and any(c.isupper() for c in password)
        and any(c.islower() for c in password)
        and any(c.isdigit() for c in password)
    )


@router.post("/register", response_model=UserResponse, status_code=201)
async def register(
    request: RegisterRequest,
    session: AsyncSession = Depends(get_session),
) -> UserResponse:
    """Register a new user.

    Args:
        request: Registration request with email, password, and optional full_name.
        session: Database session.

    Returns:
        UserResponse with created user details (no password field).

    Raises:
        400: If password doesn't meet requirements.
        409: If email already exists.
    """
    # Validate password strength
    plain_password = request.password.get_secret_value()
    if not _validate_password(plain_password):
        raise_bad_request(
            "Password must be at least 8 characters with uppercase, lowercase, and digit"
        )

    # Check if email already exists
    try:
        user = await UserService.create_user(
            session=session,
            email=request.email,
            password=plain_password,
            full_name=request.full_name,
            role_id=2,  # Regular user role
        )
        await session.commit()
    except ValueError as e:
        raise_conflict(str(e))

    # Load the role relationship
    await session.refresh(user, ["role"])

    logger.info(f"User registered: {user.email}")

    return UserResponse(
        id=user.id,
        email=user.email,
        full_name=user.full_name,
        role_id=user.role_id,
        role_name=user.role.name,
        is_active=user.is_active,
        created_at=user.created_at,
        updated_at=user.updated_at,
    )


@router.post("/login", response_model=TokenResponse)
async def login(
    request: LoginRequest,
    session: AsyncSession = Depends(get_session),
) -> TokenResponse:
    """Login a user and return JWT tokens.

    Args:
        request: Login request with email and password.
        session: Database session.

    Returns:
        TokenResponse with access_token and refresh_token.

    Raises:
        401: If credentials are invalid.
        403: If user account is deactivated.
    """
    # Verify credentials
    user = await UserService.verify_credentials(
        session=session,
        email=request.email,
        password=request.password.get_secret_value(),
    )

    if not user:
        raise_unauthorized("Invalid email or password")

    if not user.is_active:
        raise_unauthorized("User account is deactivated")

    # Create tokens
    access_token, refresh_token = AuthService.create_tokens(
        user_id=str(user.id),
        role=user.role.name,
    )

    # Store hashed refresh token in database
    await UserService.set_refresh_token(session, user.id, refresh_token)
    await session.commit()

    logger.info(f"User logged in: {user.email}")

    return TokenResponse(access_token=access_token, refresh_token=refresh_token)


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(
    request: RefreshTokenRequest,
    session: AsyncSession = Depends(get_session),
) -> TokenResponse:
    """Refresh JWT tokens using a refresh token.

    Args:
        request: RefreshTokenRequest with valid refresh_token.
        session: Database session.

    Returns:
        TokenResponse with new access_token and refresh_token.

    Raises:
        401: If refresh token is invalid or expired.
    """
    try:
        payload = AuthService.decode_refresh_token(request.refresh_token)
        user_id = payload.get("sub")
    except Exception:
        raise_unauthorized("Invalid or expired refresh token")

    # Get user and verify refresh token
    user = await UserService.get_user_by_id(session, user_id)
    if not user:
        raise_unauthorized("User not found")

    # Verify the provided refresh token matches the stored hash
    if not await UserService.verify_refresh_token(
        session, user.id, request.refresh_token
    ):
        raise_unauthorized("Invalid refresh token")

    # Create new tokens
    access_token, new_refresh_token = AuthService.create_tokens(
        user_id=str(user.id),
        role=user.role.name,
    )

    # Rotate refresh token in database
    await UserService.set_refresh_token(session, user.id, new_refresh_token)
    await session.commit()

    logger.info(f"Tokens refreshed for user: {user.email}")

    return TokenResponse(access_token=access_token, refresh_token=new_refresh_token)


@router.post("/logout", response_model=LogoutResponse)
async def logout(
    current_user: CurrentUser,
    session: AsyncSession = Depends(get_session),
) -> LogoutResponse:
    """Logout a user by clearing their refresh token.

    Args:
        current_user: Current authenticated user.
        session: Database session.

    Returns:
        LogoutResponse with success message.
    """
    # Clear refresh token
    await UserService.set_refresh_token(session, current_user.id, None)
    await session.commit()

    logger.info(f"User logged out: {current_user.email}")

    return LogoutResponse(message="Logged out successfully")
