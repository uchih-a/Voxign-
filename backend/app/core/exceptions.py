"""
Custom exceptions and HTTP error handlers.

Provides standardized error responses with consistent JSON structure.
"""

import logging
from typing import Any

from fastapi import HTTPException, Request, status
from fastapi.responses import JSONResponse
from sqlalchemy.exc import IntegrityError

logger = logging.getLogger(__name__)


class ErrorResponse(dict):
    """Standard error response format."""

    def __init__(
        self,
        error: bool = True,
        status_code: int = 500,
        message: str = "Internal server error",
        detail: Any = None,
    ):
        """Initialize error response.

        Args:
            error: Always True for errors.
            status_code: HTTP status code.
            message: Error message.
            detail: Additional error details.
        """
        super().__init__(
            error=error,
            status_code=status_code,
            message=message,
            detail=detail,
        )


def raise_bad_request(message: str, detail: Any = None) -> None:
    """Raise 400 Bad Request error.

    Args:
        message: Error message.
        detail: Optional additional details.

    Raises:
        HTTPException: 400 Bad Request.
    """
    logger.debug(f"Bad request: {message}")
    raise HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail={
            "error": True,
            "status_code": 400,
            "message": message,
            "detail": detail,
        },
    )


def raise_unauthorized(message: str = "Unauthorized", detail: Any = None) -> None:
    """Raise 401 Unauthorized error.

    Args:
        message: Error message.
        detail: Optional additional details.

    Raises:
        HTTPException: 401 Unauthorized.
    """
    logger.debug(f"Unauthorized: {message}")
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail={
            "error": True,
            "status_code": 401,
            "message": message,
            "detail": detail,
        },
    )


def raise_forbidden(message: str = "Forbidden", detail: Any = None) -> None:
    """Raise 403 Forbidden error.

    Args:
        message: Error message.
        detail: Optional additional details.

    Raises:
        HTTPException: 403 Forbidden.
    """
    logger.debug(f"Forbidden: {message}")
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail={
            "error": True,
            "status_code": 403,
            "message": message,
            "detail": detail,
        },
    )


def raise_not_found(message: str = "Not found", detail: Any = None) -> None:
    """Raise 404 Not Found error.

    Args:
        message: Error message.
        detail: Optional additional details.

    Raises:
        HTTPException: 404 Not Found.
    """
    logger.debug(f"Not found: {message}")
    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail={
            "error": True,
            "status_code": 404,
            "message": message,
            "detail": detail,
        },
    )


def raise_conflict(message: str, detail: Any = None) -> None:
    """Raise 409 Conflict error (email already exists, etc).

    Args:
        message: Error message.
        detail: Optional additional details.

    Raises:
        HTTPException: 409 Conflict.
    """
    logger.debug(f"Conflict: {message}")
    raise HTTPException(
        status_code=status.HTTP_409_CONFLICT,
        detail={
            "error": True,
            "status_code": 409,
            "message": message,
            "detail": detail,
        },
    )


def raise_unprocessable_entity(
    message: str,
    detail: Any = None,
) -> None:
    """Raise 422 Unprocessable Entity error (validation error).

    Args:
        message: Error message.
        detail: Optional additional details.

    Raises:
        HTTPException: 422 Unprocessable Entity.
    """
    logger.debug(f"Unprocessable entity: {message}")
    raise HTTPException(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        detail={
            "error": True,
            "status_code": 422,
            "message": message,
            "detail": detail,
        },
    )


async def http_exception_handler(
    request: Request,
    exc: HTTPException,
) -> JSONResponse:
    """Handle HTTPException with standard error response format.

    Args:
        request: FastAPI request.
        exc: HTTPException to handle.

    Returns:
        JSONResponse with standard error format.
    """
    detail = exc.detail or {
        "error": True,
        "status_code": exc.status_code,
        "message": exc.detail or "An error occurred",
        "detail": None,
    }

    # If detail is already a dict with our error format, use it
    if isinstance(detail, dict) and "error" in detail and "status_code" in detail:
        return JSONResponse(status_code=exc.status_code, content=detail)

    # Otherwise, wrap in standard format
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": True,
            "status_code": exc.status_code,
            "message": str(detail),
            "detail": None,
        },
    )


async def general_exception_handler(
    request: Request,
    exc: Exception,
) -> JSONResponse:
    """Handle unexpected exceptions with sanitized response.

    Args:
        request: FastAPI request.
        exc: Exception to handle.

    Returns:
        JSONResponse with generic error message.
    """
    logger.error(f"Unhandled exception: {exc}", exc_info=True)

    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": True,
            "status_code": 500,
            "message": "Internal server error",
            "detail": None,
        },
    )


async def integrity_error_handler(
    request: Request,
    exc: IntegrityError,
) -> JSONResponse:
    """Handle database integrity errors.

    Args:
        request: FastAPI request.
        exc: IntegrityError from SQLAlchemy.

    Returns:
        JSONResponse with appropriate message.
    """
    logger.error(f"Database integrity error: {exc}")

    # Check for unique constraint violations
    if "unique constraint" in str(exc).lower():
        return JSONResponse(
            status_code=status.HTTP_409_CONFLICT,
            content={
                "error": True,
                "status_code": 409,
                "message": "Resource already exists",
                "detail": None,
            },
        )

    return JSONResponse(
        status_code=status.HTTP_400_BAD_REQUEST,
        content={
            "error": True,
            "status_code": 400,
            "message": "Invalid data",
            "detail": None,
        },
    )
