"""
ML input preprocessor - Validation and shape enforcement for model inputs.

Converts and validates incoming landmark and sequence data to the exact
shapes required by the Keras models.
"""

import logging
from typing import Any

import numpy as np

logger = logging.getLogger(__name__)


class LandmarkPreprocessor:
    """Preprocessor for hand landmark data.

    Validates landmarks and reshapes them for model inference.
    """

    @staticmethod
    def preprocess_letter_landmarks(landmarks: list[list[float]]) -> np.ndarray:
        """Preprocess landmarks for letter recognition.

        Converts list of 21 landmarks to numpy array of shape (1, 21, 3).

        Args:
            landmarks: List of [x, y, z] coordinates (21 landmarks).

        Returns:
            Numpy array of shape (1, 21, 3) with dtype float32.

        Raises:
            ValueError: If landmarks don't have exact shape.
        """
        if len(landmarks) != 21:
            raise ValueError(f"Expected 21 landmarks, got {len(landmarks)}")

        landmarks_array = np.array(landmarks, dtype=np.float32)

        if landmarks_array.shape != (21, 3):
            raise ValueError(
                f"Expected shape (21, 3), got {landmarks_array.shape}"
            )

        # Add batch dimension: (21, 3) -> (1, 21, 3)
        batch = np.expand_dims(landmarks_array, axis=0)
        return batch

    @staticmethod
    def preprocess_word_sequence(
        sequence: list[list[list[float]]],
    ) -> np.ndarray:
        """Preprocess landmark sequence for word recognition.

        Converts sequence of 30 frames × 21 landmarks to numpy array
        of shape (1, 30, 63). Each frame is flattened: 21 × 3 = 63.

        Args:
            sequence: List of 30 frames, each with 21 [x, y, z] landmarks.

        Returns:
            Numpy array of shape (1, 30, 63) with dtype float32.

        Raises:
            ValueError: If sequence doesn't have exact shape.
        """
        if len(sequence) != 30:
            raise ValueError(f"Expected 30 frames, got {len(sequence)}")

        sequence_array = np.array(sequence, dtype=np.float32)

        if sequence_array.shape != (30, 21, 3):
            raise ValueError(
                f"Expected shape (30, 21, 3), got {sequence_array.shape}"
            )

        # Flatten each frame: (30, 21, 3) -> (30, 63)
        flattened = sequence_array.reshape(30, 63)

        # Add batch dimension: (30, 63) -> (1, 30, 63)
        batch = np.expand_dims(flattened, axis=0)
        return batch

    @staticmethod
    def validate_and_preprocess_letter(
        landmarks: Any,
    ) -> np.ndarray:
        """Validate and preprocess letter landmarks in one step.

        Args:
            landmarks: Raw landmark data from request.

        Returns:
            Preprocessed numpy array ready for model inference.

        Raises:
            ValueError: If landmarks are invalid.
        """
        if not isinstance(landmarks, list):
            raise ValueError("landmarks must be a list")

        if len(landmarks) != 21:
            raise ValueError(f"landmarks must have 21 items, got {len(landmarks)}")

        for i, landmark in enumerate(landmarks):
            if not isinstance(landmark, (list, tuple)):
                raise ValueError(f"landmark {i} must be a list")
            if len(landmark) != 3:
                raise ValueError(f"landmark {i} must have 3 coords, got {len(landmark)}")

        return LandmarkPreprocessor.preprocess_letter_landmarks(landmarks)

    @staticmethod
    def validate_and_preprocess_word(
        sequence: Any,
    ) -> np.ndarray:
        """Validate and preprocess word sequence in one step.

        Args:
            sequence: Raw sequence data from request.

        Returns:
            Preprocessed numpy array ready for model inference.

        Raises:
            ValueError: If sequence is invalid.
        """
        if not isinstance(sequence, list):
            raise ValueError("sequence must be a list")

        if len(sequence) != 30:
            raise ValueError(f"sequence must have 30 frames, got {len(sequence)}")

        for i, frame in enumerate(sequence):
            if not isinstance(frame, (list, tuple)):
                raise ValueError(f"frame {i} must be a list")
            if len(frame) != 21:
                raise ValueError(f"frame {i} must have 21 landmarks, got {len(frame)}")
            for j, landmark in enumerate(frame):
                if not isinstance(landmark, (list, tuple)):
                    raise ValueError(f"frame {i} landmark {j} must be a list")
                if len(landmark) != 3:
                    raise ValueError(
                        f"frame {i} landmark {j} must have 3 coords, got {len(landmark)}"
                    )

        return LandmarkPreprocessor.preprocess_word_sequence(sequence)


# Export preprocessor functions as module-level functions
def preprocess_letter(landmarks: list[list[float]]) -> np.ndarray:
    """Preprocess landmarks for letter recognition model.

    Args:
        landmarks: 21 hand landmarks with [x, y, z] coordinates.

    Returns:
        Numpy array of shape (1, 21, 3) ready for model inference.
    """
    return LandmarkPreprocessor.preprocess_letter_landmarks(landmarks)


def preprocess_word(sequence: list[list[list[float]]]) -> np.ndarray:
    """Preprocess landmark sequence for word recognition model.

    Args:
        sequence: 30 frames of 21 landmarks with [x, y, z] coordinates.

    Returns:
        Numpy array of shape (1, 30, 63) ready for model inference.
    """
    return LandmarkPreprocessor.preprocess_word_sequence(sequence)
