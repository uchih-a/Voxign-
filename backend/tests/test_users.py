"""Tests for user management endpoints."""

import pytest
from httpx import AsyncClient

from app.core.security import create_access_token
from app.models import User


class TestUsers:
    """User management endpoint tests."""

    @pytest.mark.asyncio
    async def test_get_user_profile_without_auth(self, async_client: AsyncClient):
        """Test getting profile without authentication."""
        response = await async_client.get("/users/me")
        assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_get_user_profile_with_auth(
        self,
        async_client: AsyncClient,
        test_regular_user: User,
    ):
        """Test getting own profile with valid token."""
        token = create_access_token(
            {"sub": str(test_regular_user.id), "role": "user"}
        )

        response = await async_client.get(
            "/users/me",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == test_regular_user.email
        assert "hashed_password" not in data
        assert "refresh_token" not in data

    @pytest.mark.asyncio
    async def test_list_users_without_admin(
        self,
        async_client: AsyncClient,
        test_regular_user: User,
    ):
        """Test listing users without admin role."""
        token = create_access_token(
            {"sub": str(test_regular_user.id), "role": "user"}
        )

        response = await async_client.get(
            "/users/?page=1&page_size=20",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert response.status_code == 403

    @pytest.mark.asyncio
    async def test_list_users_with_admin(
        self,
        async_client: AsyncClient,
        test_admin_user: User,
    ):
        """Test listing users with admin role."""
        token = create_access_token(
            {"sub": str(test_admin_user.id), "role": "admin"}
        )

        response = await async_client.get(
            "/users/?page=1&page_size=20",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert response.status_code == 200
        data = response.json()
        assert "total" in data
        assert "items" in data
        assert "page" in data

    @pytest.mark.asyncio
    async def test_update_own_profile(
        self,
        async_client: AsyncClient,
        test_regular_user: User,
    ):
        """Test updating own profile."""
        token = create_access_token(
            {"sub": str(test_regular_user.id), "role": "user"}
        )

        response = await async_client.put(
            "/users/me",
            json={"full_name": "Updated Name"},
            headers={"Authorization": f"Bearer {token}"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["full_name"] == "Updated Name"
