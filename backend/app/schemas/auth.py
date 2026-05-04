"""
Authentication Pydantic schemas for request/response validation.

Handles registration, login, token refresh, and logout payloads.
"""

from pydantic import BaseModel, EmailStr, Field, SecretStr


class RegisterRequest(BaseModel):
    """Registration request schema.

    Attributes:
        email: Valid email address.
        password: Min 8 chars, uppercase, lowercase, digit required.
        full_name: Optional full name.
    """

    email: EmailStr
    password: SecretStr = Field(
        ...,
        min_length=8,
        description="Min 8 chars: uppercase, lowercase, digit required",
    )
    full_name: str | None = Field(None, max_length=255)


class LoginRequest(BaseModel):
    """Login request schema.

    Attributes:
        email: User email address.
        password: User password.
    """

    email: EmailStr
    password: SecretStr


class TokenResponse(BaseModel):
    """Token response schema.

    Attributes:
        access_token: JWT access token (30 min expiry).
        refresh_token: JWT refresh token (7 day expiry).
        token_type: Always "bearer".
    """

    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class RefreshTokenRequest(BaseModel):
    """Refresh token request schema.

    Attributes:
        refresh_token: Valid JWT refresh token.
    """

    refresh_token: str


class LogoutResponse(BaseModel):
    """Logout response schema.

    Attributes:
        message: Success message.
    """

    message: str = "Logged out successfully"
