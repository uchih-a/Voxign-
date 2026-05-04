"""
Authentication service - Business logic for JWT and password operations.

No database or HTTP concerns here - pure authentication logic.
"""

import logging
from datetime import datetime, timedelta, timezone

from jose import JWTError

from app.core.security import create_access_token, create_refresh_token, decode_token

logger = logging.getLogger(__name__)


class AuthService:
    """Service for JWT token creation and validation."""

    @staticmethod
    def create_tokens(user_id: str, role: str) -> tuple[str, str]:
        """Create access and refresh tokens for a user.

        Args:
            user_id: UUID of the user as string.
            role: Role name (admin or user).

        Returns:
            Tuple of (access_token, refresh_token).
        """
        token_data = {"sub": user_id, "role": role}
        access_token = create_access_token(data=token_data)
        refresh_token = create_refresh_token(data=token_data)

        logger.info(f"Created tokens for user {user_id}")
        return access_token, refresh_token

    @staticmethod
    def decode_access_token(token: str) -> dict:
        """Decode and validate an access token.

        Args:
            token: JWT access token string.

        Returns:
            Decoded token payload.

        Raises:
            JWTError: If token is invalid or expired.
        """
        return decode_token(token)

    @staticmethod
    def decode_refresh_token(token: str) -> dict:
        """Decode and validate a refresh token.

        Args:
            token: JWT refresh token string.

        Returns:
            Decoded token payload.

        Raises:
            JWTError: If token is invalid or expired.
        """
        payload = decode_token(token)

        # Check token type
        if payload.get("type") != "refresh":
            raise JWTError("Invalid token type")

        return payload
