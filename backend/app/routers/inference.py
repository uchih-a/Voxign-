"""
Inference router - /inference endpoints.

ML prediction endpoints:
- POST /inference/letter - Letter recognition
- POST /inference/word - Word recognition
- GET /inference/history - Get prediction history
- GET /inference/history/{user_id} - Get user's history (admin only)
"""

import logging
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import AdminUser, CurrentUser, require_active_user, require_admin
from app.core.exceptions import raise_not_found
from app.database import get_session
from app.schemas import (
    LetterPredictionRequest,
    PredictionResponse,
    SessionLogListResponse,
    SessionLogResponse,
    WordPredictionRequest,
)
from app.services import InferenceService
from fastapi.exceptions import RequestValidationError
from fastapi import Request

router = APIRouter(prefix="/inference", tags=["inference"])
logger = logging.getLogger(__name__)


@router.post("/letter", response_model=PredictionResponse)
async def predict_letter(
    request: LetterPredictionRequest,
    current_user: CurrentUser,
    session: AsyncSession = Depends(get_session),
) -> PredictionResponse:
    """Run letter recognition inference.

    Args:
        request: LetterPredictionRequest with 21 landmarks (shape [21][3]).
        current_user: Authenticated user.
        session: Database session.

    Returns:
        PredictionResponse with prediction, confidence, and scores.
    """
    result = await InferenceService.predict_letter(
        session=session,
        landmarks=request.landmarks,
        user_id=current_user.id,
    )

    await session.commit()

    return PredictionResponse(
        prediction=result["prediction"],
        confidence=result["confidence"],
        scores=result["scores"],
        session_id=result["session_id"],
    )


@router.post("/word", response_model=PredictionResponse)
async def predict_word(
    request: WordPredictionRequest,
    current_user: CurrentUser,
    session: AsyncSession = Depends(get_session),
) -> PredictionResponse:
    """Run word recognition inference.

    Args:
        request: WordPredictionRequest with 30 frames × 21 landmarks (shape [30][21][3]).
        current_user: Authenticated user.
        session: Database session.

    Returns:
        PredictionResponse with prediction, confidence, and scores.
    """
    result = await InferenceService.predict_word(
        session=session,
        sequence=request.sequence,
        user_id=current_user.id,
    )

    await session.commit()

    return PredictionResponse(
        prediction=result["prediction"],
        confidence=result["confidence"],
        scores=result["scores"],
        session_id=result["session_id"],
    )


@router.get("/history", response_model=SessionLogListResponse)
async def get_history(
    current_user: CurrentUser,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    model_type: str | None = Query(None, regex="^(letter|word)?$"),
    session: AsyncSession = Depends(get_session),
) -> SessionLogListResponse:
    """Get prediction history.

    - Regular users see only their own history.
    - Admins see all users' history.

    Args:
        current_user: Authenticated user.
        page: Page number (1-indexed).
        page_size: Items per page.
        model_type: Optional filter (letter | word).
        session: Database session.

    Returns:
        SessionLogListResponse with paginated history.
    """
    # Check if user is admin
    is_admin = current_user.role.name == "admin"

    if is_admin:
        total, logs = await InferenceService.get_all_history(
            session, page, page_size, model_type
        )
    else:
        total, logs = await InferenceService.get_user_history(
            session, current_user.id, page, page_size, model_type
        )

    return SessionLogListResponse(
        total=total,
        page=page,
        page_size=page_size,
        items=[
            SessionLogResponse(
                id=log.id,
                user_id=log.user_id,
                model_type=log.model_type,
                prediction=log.prediction,
                confidence=log.confidence,
                raw_scores=log.raw_scores,
                created_at=log.created_at,
            )
            for log in logs
        ],
    )


@router.get("/history/{user_id}", response_model=SessionLogListResponse)
async def get_user_history(
    user_id: UUID,
    current_user: AdminUser,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    model_type: str | None = Query(None, regex="^(letter|word)?$"),
    session: AsyncSession = Depends(get_session),
) -> SessionLogListResponse:
    """Get prediction history for a specific user (admin only).

    Args:
        user_id: UUID of the user.
        current_user: Must be admin.
        page: Page number (1-indexed).
        page_size: Items per page.
        model_type: Optional filter (letter | word).
        session: Database session.

    Returns:
        SessionLogListResponse with paginated history.

    Raises:
        404: If user not found.
    """
    # Verify user exists
    from app.services import UserService

    user = await UserService.get_user_by_id(session, user_id)
    if not user:
        raise_not_found(f"User {user_id} not found")

    total, logs = await InferenceService.get_history_by_user_id(
        session, user_id, page, page_size, model_type
    )

    return SessionLogListResponse(
        total=total,
        page=page,
        page_size=page_size,
        items=[
            SessionLogResponse(
                id=log.id,
                user_id=log.user_id,
                model_type=log.model_type,
                prediction=log.prediction,
                confidence=log.confidence,
                raw_scores=log.raw_scores,
                created_at=log.created_at,
            )
            for log in logs
        ],
    )
