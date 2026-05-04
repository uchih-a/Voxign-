"""
FastAPI dependency functions for authentication and RBAC.

All authorization logic flows through these dependencies - no inline checks allowed.
"""

import logging
from typing import Annotated
from uuid import UUID

from fastapi import Depends, Header
from jose import JWTError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import raise_unauthorized, raise_forbidden
from app.database import get_session
from app.models import User
from app.services.auth_service import AuthService
from app.services.user_service import UserService

logger = logging.getLogger(__name__)


def _get_token(authorization: str | None = Header(None)) -> str:
    if not authorization:
        raise_unauthorized("Missing authorization header")
    if not authorization.startswith("Bearer "):
        raise_unauthorized("Invalid authorization header format")
    token = authorization[7:]
    if not token:
        raise_unauthorized("Missing token")
    return token


async def get_current_user(
    token: str = Depends(_get_token),
    session: AsyncSession = Depends(get_session),
) -> User:
    try:
        payload = AuthService.decode_access_token(token)
        user_id_str = payload.get("sub")
        if not user_id_str:
            raise_unauthorized("Invalid token payload")
        try:
            user_id = UUID(user_id_str)
        except ValueError:
            raise_unauthorized("Invalid token payload")
    except JWTError:
        raise_unauthorized("Invalid or expired token")

    user = await UserService.get_user_by_id(session, user_id)
    if not user:
        raise_unauthorized("User not found")

    return user


async def require_active_user(
    current_user: User = Depends(get_current_user),
) -> User:
    if not current_user.is_active:
        raise_forbidden("User account is deactivated")
    return current_user


async def require_admin(
    current_user: User = Depends(require_active_user),
) -> User:
    if current_user.role.name != "admin":
        raise_forbidden("Admin access required")
    return current_user


# Type annotations for commonly used dependencies
CurrentUser = Annotated[User, Depends(require_active_user)]
AdminUser = Annotated[User, Depends(require_admin)]
