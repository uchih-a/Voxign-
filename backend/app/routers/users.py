"""
Users router - /users endpoints.

Protected endpoints with RBAC:
- GET /users/me - Get current user profile
- PUT /users/me - Update current user profile
- GET /users/ - List all users (admin only)
- GET /users/{user_id} - Get specific user (admin only)
- PUT /users/{user_id} - Update specific user (admin only)
- DELETE /users/{user_id} - Soft-delete user (admin only)
- PUT /users/{user_id}/role - Change user role (admin only)
"""

import logging
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import AdminUser, CurrentUser, get_current_user, require_active_user
from app.core.exceptions import (
    raise_bad_request,
    raise_forbidden,
    raise_not_found,
)
from app.database import get_session
from app.schemas import (
    RoleChangeRequest,
    UserListResponse,
    UserResponse,
    UserUpdate,
)
from app.services import UserService

router = APIRouter(prefix="/users", tags=["users"])
logger = logging.getLogger(__name__)


@router.get("/me", response_model=UserResponse)
async def get_current_user_profile(
    current_user: CurrentUser,
) -> UserResponse:
    """Get the current authenticated user's profile.

    Args:
        current_user: Current authenticated user from JWT.

    Returns:
        UserResponse with user details.
    """
    return UserResponse(
        id=current_user.id,
        email=current_user.email,
        full_name=current_user.full_name,
        role_id=current_user.role_id,
        role_name=current_user.role.name,
        is_active=current_user.is_active,
        created_at=current_user.created_at,
        updated_at=current_user.updated_at,
    )


@router.put("/me", response_model=UserResponse)
async def update_current_user_profile(
    request: UserUpdate,
    current_user: CurrentUser,
    session: AsyncSession = Depends(get_session),
) -> UserResponse:
    """Update the current user's profile.

    Can update:
    - full_name
    - password (requires current_password verification)

    Args:
        request: Update request.
        current_user: Current authenticated user.
        session: Database session.

    Returns:
        UserResponse with updated user details.

    Raises:
        400: If password change attempted without current_password or with invalid current password.
    """
    # Validate password change
    if request.new_password:
        if not request.current_password:
            raise_bad_request("current_password is required to change password")

        # Verify current password
        from app.core.security import verify_password

        if not verify_password(
            request.current_password.get_secret_value(),
            current_user.hashed_password,
        ):
            raise_bad_request("Current password is incorrect")

    # Update user
    updated_user = await UserService.update_user(
        session=session,
        user_id=current_user.id,
        full_name=request.full_name,
        password=request.new_password.get_secret_value() if request.new_password else None,
    )

    if not updated_user:
        raise_not_found("User not found")

    await session.commit()
    await session.refresh(updated_user, ["role"])

    logger.info(f"User profile updated: {updated_user.email}")

    return UserResponse(
        id=updated_user.id,
        email=updated_user.email,
        full_name=updated_user.full_name,
        role_id=updated_user.role_id,
        role_name=updated_user.role.name,
        is_active=updated_user.is_active,
        created_at=updated_user.created_at,
        updated_at=updated_user.updated_at,
    )


@router.get("/", response_model=UserListResponse)
async def list_users(
    current_user: AdminUser,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    session: AsyncSession = Depends(get_session),
) -> UserListResponse:
    """List all users with pagination (admin only).

    Args:
        page: Page number (1-indexed).
        page_size: Items per page.
        current_user: Must be admin user.
        session: Database session.

    Returns:
        UserListResponse with paginated user list.
    """
    total, users = await UserService.list_users(session, page, page_size)

    return UserListResponse(
        total=total,
        page=page,
        page_size=page_size,
        items=[
            UserResponse(
                id=user.id,
                email=user.email,
                full_name=user.full_name,
                role_id=user.role_id,
                role_name=user.role.name,
                is_active=user.is_active,
                created_at=user.created_at,
                updated_at=user.updated_at,
            )
            for user in users
        ],
    )


@router.get("/{user_id}", response_model=UserResponse)
async def get_user_by_id(
    user_id: UUID,
    current_user: AdminUser,
    session: AsyncSession = Depends(get_session),
) -> UserResponse:
    """Get a specific user by ID (admin only).

    Args:
        user_id: UUID of the user.
        current_user: Must be admin user.
        session: Database session.

    Returns:
        UserResponse with user details.

    Raises:
        404: If user not found.
    """
    user = await UserService.get_user_by_id(session, user_id)
    if not user:
        raise_not_found(f"User {user_id} not found")

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


@router.put("/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: UUID,
    request: UserUpdate,
    current_user: AdminUser,
    session: AsyncSession = Depends(get_session),
) -> UserResponse:
    """Update a specific user (admin only).

    Can update:
    - full_name
    - is_active (soft delete by setting to False)

    Args:
        user_id: UUID of the user to update.
        request: Update request.
        current_user: Must be admin user.
        session: Database session.

    Returns:
        UserResponse with updated user details.

    Raises:
        404: If user not found.
        400: If trying to change password (use their own endpoint).
    """
    if request.new_password or request.current_password:
        raise_bad_request("Cannot change password via this endpoint")

    user = await UserService.update_user(
        session=session,
        user_id=user_id,
        full_name=request.full_name,
    )

    if not user:
        raise_not_found(f"User {user_id} not found")

    await session.commit()
    await session.refresh(user, ["role"])

    logger.info(f"Admin updated user: {user.email}")

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


@router.delete("/{user_id}", status_code=204)
async def delete_user(
    user_id: UUID,
    current_user: AdminUser,
    session: AsyncSession = Depends(get_session),
) -> None:
    """Soft-delete a user by setting is_active to False (admin only).

    Args:
        user_id: UUID of the user to delete.
        current_user: Must be admin user.
        session: Database session.

    Raises:
        404: If user not found.
    """
    user = await UserService.deactivate_user(session, user_id)
    if not user:
        raise_not_found(f"User {user_id} not found")

    await session.commit()

    logger.info(f"Admin deactivated user: {user.email}")


@router.put("/{user_id}/role", response_model=UserResponse)
async def change_user_role(
    user_id: UUID,
    request: RoleChangeRequest,
    current_user: AdminUser,
    session: AsyncSession = Depends(get_session),
) -> UserResponse:
    """Change a user's role (admin only).

    Args:
        user_id: UUID of the user.
        request: RoleChangeRequest with new role_name.
        current_user: Must be admin user.
        session: Database session.

    Returns:
        UserResponse with updated user details.

    Raises:
        403: If trying to demote self.
        404: If user or role not found.
    """
    # Prevent admins from demoting themselves
    if user_id == current_user.id and request.role_name != "admin":
        raise_forbidden("Cannot demote yourself")

    # Get the target role
    target_role = await UserService.get_role_by_name(session, request.role_name)
    if not target_role:
        raise_not_found(f"Role '{request.role_name}' not found")

    # Update user role
    user = await UserService.set_user_role(session, user_id, target_role.id)
    if not user:
        raise_not_found(f"User {user_id} not found")

    await session.commit()
    await session.refresh(user, ["role"])

    logger.info(f"Admin changed user {user.email} role to {request.role_name}")

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
