"""
Inference service - Model predictions and session logging.

Handles running predictions and logging them to the database.
"""

import logging
from uuid import UUID

from sqlalchemy import and_, desc, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.ml.model_registry import ModelRegistry
from app.ml.preprocessor import preprocess_letter, preprocess_word
from app.models import SessionLog, User

logger = logging.getLogger(__name__)


class InferenceService:
    """Service for model inference and prediction logging."""

    @staticmethod
    async def predict_letter(
        session: AsyncSession,
        landmarks: list[list[float]],
        user_id: UUID | None = None,
    ) -> dict:
        """Run letter recognition and log the prediction.

        Args:
            session: Database session.
            landmarks: Array of 21 landmark points [x, y, z].
            user_id: Optional user ID for logging.

        Returns:
            Dictionary with prediction, confidence, scores, and session_id.
        """
        # Get model registry
        registry = ModelRegistry.get_instance()

        # Preprocess input
        preprocessed = preprocess_letter(landmarks)

        # Run inference
        prediction, confidence, scores = registry.predict_letter(preprocessed)

        # Log to database
        session_log = SessionLog(
            user_id=user_id,
            model_type="letter",
            prediction=prediction,
            confidence=confidence,
            raw_scores=scores,
            input_snapshot=landmarks,
        )

        session.add(session_log)
        await session.flush()

        logger.info(
            f"Letter prediction: {prediction} (confidence: {confidence:.4f}, "
            f"user_id: {user_id})"
        )

        return {
            "prediction": prediction,
            "confidence": confidence,
            "scores": scores,
            "session_id": session_log.id,
        }

    @staticmethod
    async def predict_word(
        session: AsyncSession,
        sequence: list[list[list[float]]],
        user_id: UUID | None = None,
    ) -> dict:
        """Run word recognition and log the prediction.

        Args:
            session: Database session.
            sequence: Array of 30 frames × 21 landmarks [x, y, z].
            user_id: Optional user ID for logging.

        Returns:
            Dictionary with prediction, confidence, scores, and session_id.
        """
        # Get model registry
        registry = ModelRegistry.get_instance()

        # Preprocess input
        preprocessed = preprocess_word(sequence)

        # Run inference
        prediction, confidence, scores = registry.predict_word(preprocessed)

        # Log to database
        session_log = SessionLog(
            user_id=user_id,
            model_type="word",
            prediction=prediction,
            confidence=confidence,
            raw_scores=scores,
            input_snapshot=sequence,
        )

        session.add(session_log)
        await session.flush()

        logger.info(
            f"Word prediction: {prediction} (confidence: {confidence:.4f}, "
            f"user_id: {user_id})"
        )

        return {
            "prediction": prediction,
            "confidence": confidence,
            "scores": scores,
            "session_id": session_log.id,
        }

    @staticmethod
    async def get_user_history(
        session: AsyncSession,
        user_id: UUID,
        page: int = 1,
        page_size: int = 20,
        model_type: str | None = None,
    ) -> tuple[int, list[SessionLog]]:
        """Get prediction history for a specific user.

        Args:
            session: Database session.
            user_id: UUID of the user.
            page: Page number (1-indexed).
            page_size: Items per page.
            model_type: Optional filter by model type (letter | word).

        Returns:
            Tuple of (total_count, logs_list).
        """
        # Build query
        query = select(SessionLog).where(SessionLog.user_id == user_id)

        if model_type:
            query = query.where(SessionLog.model_type == model_type)

        # Get total count
        count_query = select(func.count()).select_from(SessionLog).where(SessionLog.user_id == user_id)
        if model_type:
            count_query = count_query.where(SessionLog.model_type == model_type)

        count_result = await session.execute(count_query)
        total = count_result.scalar() or 0

        # Get paginated results, ordered by newest first
        offset = (page - 1) * page_size
        query = query.order_by(desc(SessionLog.created_at)).offset(offset).limit(page_size)

        result = await session.execute(query)
        logs = result.scalars().all()

        return total, logs

    @staticmethod
    async def get_all_history(
        session: AsyncSession,
        page: int = 1,
        page_size: int = 20,
        model_type: str | None = None,
    ) -> tuple[int, list[SessionLog]]:
        """Get all prediction history (admin only).

        Args:
            session: Database session.
            page: Page number (1-indexed).
            page_size: Items per page.
            model_type: Optional filter by model type (letter | word).

        Returns:
            Tuple of (total_count, logs_list).
        """
        # Build query
        query = select(SessionLog)

        if model_type:
            query = query.where(SessionLog.model_type == model_type)

        # Get total count
        count_query = select(func.count()).select_from(SessionLog)
        if model_type:
            count_query = count_query.where(SessionLog.model_type == model_type)

        count_result = await session.execute(count_query)
        total = count_result.scalar() or 0

        # Get paginated results, ordered by newest first
        offset = (page - 1) * page_size
        query = query.order_by(desc(SessionLog.created_at)).offset(offset).limit(page_size)

        result = await session.execute(query)
        logs = result.scalars().all()

        return total, logs

    @staticmethod
    async def get_history_by_user_id(
        session: AsyncSession,
        user_id: UUID,
        page: int = 1,
        page_size: int = 20,
        model_type: str | None = None,
    ) -> tuple[int, list[SessionLog]]:
        """Get prediction history for a specific user (same as get_user_history).

        Args:
            session: Database session.
            user_id: UUID of the user.
            page: Page number (1-indexed).
            page_size: Items per page.
            model_type: Optional filter by model type (letter | word).

        Returns:
            Tuple of (total_count, logs_list).
        """
        return await InferenceService.get_user_history(
            session, user_id, page, page_size, model_type
        )
