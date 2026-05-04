"""Tests for authentication endpoints."""

import pytest
import pytest_asyncio
from httpx import AsyncClient

from app.core.security import decode_token
from app.models import User
from app.services import UserService


class TestAuth:
    """Authentication endpoint tests."""

    @pytest.mark.asyncio
    async def test_register_success(self, async_client: AsyncClient):
        """Test successful user registration."""
        response = await async_client.post(
            "/auth/register",
            json={
                "email": "newuser@test.com",
                "password": "Password123",
                "full_name": "New User",
            },
        )
        assert response.status_code == 201
        data = response.json()
        assert data["email"] == "newuser@test.com"
        assert data["full_name"] == "New User"
        assert "id" in data
        assert "hashed_password" not in data

    @pytest.mark.asyncio
    async def test_register_weak_password(self, async_client: AsyncClient):
        """Test registration with weak password."""
        response = await async_client.post(
            "/auth/register",
            json={
                "email": "newuser@test.com",
                "password": "weak",
                "full_name": "New User",
            },
        )
        assert response.status_code == 400
        data = response.json()
        assert data["error"] is True

    @pytest.mark.asyncio
    async def test_register_duplicate_email(
        self,
        async_client: AsyncClient,
        test_regular_user: User,
    ):
        """Test registration with duplicate email."""
        response = await async_client.post(
            "/auth/register",
            json={
                "email": test_regular_user.email,
                "password": "Password123",
            },
        )
        assert response.status_code == 409
        data = response.json()
        assert data["error"] is True

    @pytest.mark.asyncio
    async def test_login_success(
        self,
        async_client: AsyncClient,
        test_regular_user: User,
    ):
        """Test successful login."""
        response = await async_client.post(
            "/auth/login",
            json={
                "email": test_regular_user.email,
                "password": "TestPass123",
            },
        )
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert "refresh_token" in data
        assert data["token_type"] == "bearer"

    @pytest.mark.asyncio
    async def test_login_invalid_email(self, async_client: AsyncClient):
        """Test login with invalid email."""
        response = await async_client.post(
            "/auth/login",
            json={
                "email": "nonexistent@test.com",
                "password": "SomePassword123",
            },
        )
        assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_login_invalid_password(
        self,
        async_client: AsyncClient,
        test_regular_user: User,
    ):
        """Test login with invalid password."""
        response = await async_client.post(
            "/auth/login",
            json={
                "email": test_regular_user.email,
                "password": "WrongPassword123",
            },
        )
        assert response.status_code == 401
