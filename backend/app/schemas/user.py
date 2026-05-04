"""
User Pydantic schemas for request/response validation.

Handles user profile, creation, and update operations.
"""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr, Field, SecretStr


class UserBase(BaseModel):
    """Base user schema with common fields."""

    email: EmailStr
    full_name: str | None = Field(None, max_length=255)


class UserCreate(UserBase):
    """Schema for user creation/registration.

    Attributes:
        password: User password (min 8 chars, uppercase, lowercase, digit).
    """

    password: SecretStr = Field(
        ...,
        min_length=8,
        description="Min 8 chars: uppercase, lowercase, digit required",
    )


class UserUpdate(BaseModel):
    """Schema for user profile update.

    Attributes:
        full_name: New full name (optional).
        current_password: Required if changing password.
        new_password: New password (optional, requires current_password).
    """

    full_name: str | None = Field(None, max_length=255)
    current_password: SecretStr | None = None
    new_password: SecretStr | None = Field(None, min_length=8)


class UserResponse(UserBase):
    """User response schema - sent to clients.

    Never includes hashed_password or refresh_token.

    Attributes:
        id: User UUID.
        role_id: ID of user's role.
        role_name: Name of user's role (admin or user).
        is_active: Whether user account is active.
        created_at: Account creation timestamp.
        updated_at: Last update timestamp.
    """

    id: UUID
    role_id: int
    role_name: str
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class UserListResponse(BaseModel):
    """Paginated user list response.

    Attributes:
        total: Total number of users.
        page: Current page number.
        page_size: Number of items per page.
        items: List of users on current page.
    """

    total: int
    page: int
    page_size: int
    items: list[UserResponse]


class RoleChangeRequest(BaseModel):
    """Schema for changing a user's role.

    Attributes:
        role_name: New role name (admin | user).
    """

    role_name: str = Field(..., pattern="^(admin|user)$")
