"""
Inference Pydantic schemas for prediction request/response validation.

Handles letter and word recognition requests with strict shape validation.
"""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field, field_validator


class LandmarkPoint(BaseModel):
    """Single landmark point with x, y, z coordinates.

    All coordinates must be normalized floats in [0.0, 1.0].
    """

    x: float = Field(..., ge=0.0, le=1.0)
    y: float = Field(..., ge=0.0, le=1.0)
    z: float = Field(..., ge=-2.0, le=2.0)


class LetterPredictionRequest(BaseModel):
    """Letter recognition inference request.

    Attributes:
        landmarks: Array of exactly 21 landmark points (hand landmarks).
                   x, y are normalized to [0.0, 1.0].
                   z is relative depth (negative = closer to camera).
    """

    landmarks: list[list[float]] = Field(
        ...,
        description="21 hand landmark points, each [x, y, z]",
    )

    @field_validator("landmarks", mode="before")
    @classmethod
    def validate_landmarks(cls, v: list) -> list:
        """Validate landmark array shape and values."""
        if not isinstance(v, list):
            raise ValueError("landmarks must be a list")

        if len(v) != 21:
            raise ValueError(f"landmarks must have exactly 21 items, got {len(v)}")

        validated_landmarks = []
        for i, landmark in enumerate(v):
            if not isinstance(landmark, (list, tuple)):
                raise ValueError(f"landmark {i} must be a list/tuple, got {type(landmark)}")

            if len(landmark) != 3:
                raise ValueError(
                    f"landmark {i} must have exactly 3 coordinates, got {len(landmark)}"
                )

            try:
                x, y, z = float(landmark[0]), float(landmark[1]), float(landmark[2])
            except (TypeError, ValueError) as e:
                raise ValueError(f"landmark {i} coordinates must be numbers: {e}")

            # X and Y must be in [0.0, 1.0] (normalized screen coordinates)
            if not (0.0 <= x <= 1.0 and 0.0 <= y <= 1.0):
                raise ValueError(
                    f"landmark {i} x,y coordinates must be in [0.0, 1.0], "
                    f"got ({x}, {y})"
                )
            
            # Z is relative depth, typically in range [-0.5, 0.5] or similar
            # Negative = closer to camera than wrist, Positive = further away
            # Allow reasonable range, e.g., [-1.0, 1.0] or wider
            if not (-2.0 <= z <= 2.0):
                raise ValueError(
                    f"landmark {i} z coordinate must be in [-2.0, 2.0], got {z}"
                )

            validated_landmarks.append([x, y, z])

        return validated_landmarks


class WordPredictionRequest(BaseModel):
    """Word recognition inference request.

    Attributes:
        sequence: Array of exactly 30 frames, each with 21 landmarks [x, y, z].
    """

    sequence: list[list[list[float]]] = Field(
        ...,
        description="30 frames of 21 landmark points, each [x, y, z]",
    )

    @field_validator("sequence", mode="before")
    @classmethod
    def validate_sequence(cls, v: list) -> list:
        """Validate landmark sequence shape and values.

        Args:
            v: Sequence array from request.

        Returns:
            Validated sequence array.

        Raises:
            ValueError: If array shape or values are invalid.
        """
        if not isinstance(v, list):
            raise ValueError("sequence must be a list")

        if len(v) != 30:
            raise ValueError(f"sequence must have exactly 30 frames, got {len(v)}")

        validated_sequence = []
        for frame_idx, frame in enumerate(v):
            if not isinstance(frame, (list, tuple)):
                raise ValueError(
                    f"frame {frame_idx} must be a list/tuple, got {type(frame)}"
                )

            if len(frame) != 21:
                raise ValueError(
                    f"frame {frame_idx} must have 21 landmarks, got {len(frame)}"
                )

            validated_frame = []
            for landmark_idx, landmark in enumerate(frame):
                if not isinstance(landmark, (list, tuple)):
                    raise ValueError(
                        f"frame {frame_idx} landmark {landmark_idx} must be "
                        f"a list/tuple, got {type(landmark)}"
                    )

                if len(landmark) != 3:
                    raise ValueError(
                        f"frame {frame_idx} landmark {landmark_idx} must have 3 coords, "
                        f"got {len(landmark)}"
                    )

                try:
                    x, y, z = (
                        float(landmark[0]),
                        float(landmark[1]),
                        float(landmark[2]),
                    )
                except (TypeError, ValueError) as e:
                    raise ValueError(
                        f"frame {frame_idx} landmark {landmark_idx} coordinates "
                        f"must be numbers: {e}"
                    )

               # In WordPredictionRequest.validate_sequence:
                if not (0.0 <= x <= 1.0 and 0.0 <= y <= 1.0):
                    raise ValueError(
                        f"frame {frame_idx} landmark {landmark_idx} x,y must be "
                        f"in [0.0, 1.0], got ({x}, {y})"
                    )

                if not (-2.0 <= z <= 2.0):
                    raise ValueError(
                        f"frame {frame_idx} landmark {landmark_idx} z must be "
                        f"in [-2.0, 2.0], got {z}"
                    )

                validated_frame.append([x, y, z])

            validated_sequence.append(validated_frame)

        return validated_sequence


class PredictionResponse(BaseModel):
    """Prediction response schema.

    Attributes:
        prediction: Predicted label (letter or word).
        confidence: Top softmax probability (0.0-1.0).
        scores: Dictionary mapping all possible labels to their scores.
        session_id: UUID of the logged session.
    """

    prediction: str
    confidence: float = Field(..., ge=0.0, le=1.0)
    scores: dict[str, float]
    session_id: UUID


class SessionLogResponse(BaseModel):
    """Session log record response.

    Attributes:
        id: Session UUID.
        user_id: User UUID (null for anonymous sessions).
        model_type: Model used (letter | word).
        prediction: Predicted label.
        confidence: Confidence score.
        raw_scores: Full scores dictionary.
        created_at: When prediction was made.
    """

    id: UUID
    user_id: UUID | None
    model_type: str
    prediction: str
    confidence: float
    raw_scores: dict | None
    created_at: datetime


class SessionLogListResponse(BaseModel):
    """Paginated session log list response.

    Attributes:
        total: Total number of logs.
        page: Current page.
        page_size: Items per page.
        items: Logs on current page.
    """

    total: int
    page: int
    page_size: int
    items: list[SessionLogResponse]
