"""
ML model registry - Singleton pattern for loading and managing Keras models.

Loads both models once during startup and makes them available throughout
the application lifecycle. Never reloads models on each request.
"""

import json
import logging
from pathlib import Path
from typing import Any

import keras
import numpy as np

from app.config import settings

logger = logging.getLogger(__name__)


class ModelRegistry:
    """Singleton registry for ML models and label maps.

    Loads and caches:
    - Letter recognition model (ASL_CNN_LSTM)
    - Word recognition model (Word_LSTM)
    - Letter label map (JSON)
    - Word label map (JSON)

    All models are loaded once during startup.
    """

    _instance: "ModelRegistry | None" = None
    _initialized: bool = False

    letter_model: Any = None
    word_model: Any = None
    letter_labels: dict[int, str] = {}
    word_labels: dict[int, str] = {}

    def __new__(cls) -> "ModelRegistry":
        """Implement singleton pattern.

        Returns:
            Singleton instance of ModelRegistry.
        """
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    @classmethod
    def initialize(cls) -> "ModelRegistry":
        """Initialize the model registry by loading all models and labels.

        This method should be called once during application startup
        via the lifespan context manager.

        Returns:
            ModelRegistry instance with all models loaded.
        """
        instance = cls()

        if cls._initialized:
            logger.info("Model registry already initialized, skipping")
            return instance

        logger.info("Initializing model registry...")

        try:
            # Load letter recognition model
            letter_model_path = Path(settings.letter_model_path)
            if letter_model_path.exists():
                try:
                    logger.info(f"Loading letter model from {letter_model_path}...")
                    instance.letter_model = keras.models.load_model(str(letter_model_path), custom_objects={'Orthogonal': keras.initializers.Orthogonal}, compile=False)
                    logger.info("✓ Letter model loaded successfully")
                except Exception as e:
                    logger.warning(f"Could not load letter model: {e}")
                    logger.info("Creating placeholder letter model...")
                    instance.letter_model = cls._create_placeholder_model((None, 21, 3), 26)
            else:
                logger.warning(f"Letter model not found at {letter_model_path}")
                logger.info("Creating placeholder letter model...")
                instance.letter_model = cls._create_placeholder_model((None, 21, 3), 26)

            # Load word recognition model
            # Load word recognition model
            word_model_path = Path(settings.word_model_path)
            if word_model_path.exists():
                try:
                    logger.info(f"Loading word model from {word_model_path}...")
                    instance.word_model = keras.models.load_model(str(word_model_path), custom_objects={'Orthogonal': keras.initializers.Orthogonal}, compile=False)
                    logger.info("✓ Word model loaded successfully")
                except Exception as e:
                    logger.warning(f"Could not load word model: {e}")
                    logger.info("Creating placeholder word model...")
                    # FIX: Changed shape from (None, 21, 3) to (None, 30, 63)
                    instance.word_model = cls._create_placeholder_model((None, 30, 63), 100)
            else:
                logger.warning(f"Word model not found at {word_model_path}")
                logger.info("Creating placeholder word model...")
                # FIX: Changed shape from (None, 21, 3) to (None, 30, 63)
                instance.word_model = cls._create_placeholder_model((None, 30, 63), 100)
            # Load letter label map
            letter_labels_path = Path(settings.letter_label_map_path)
            if letter_labels_path.exists():
                try:
                    logger.info(f"Loading letter label map from {letter_labels_path}...")
                    with open(letter_labels_path) as f:
                        letter_labels_raw = json.load(f)
                        instance.letter_labels = {int(k): v for k, v in letter_labels_raw.items()}
                    logger.info(f"✓ Letter label map loaded ({len(instance.letter_labels)} classes)")
                except Exception as e:
                    logger.warning(f"Could not load letter label map: {e}")
                    instance.letter_labels = {i: chr(65 + i) for i in range(26)}
            else:
                logger.warning(f"Letter label map not found at {letter_labels_path}")
                instance.letter_labels = {i: chr(65 + i) for i in range(26)}

            # Load word label map
            word_labels_path = Path(settings.word_label_map_path)
            if word_labels_path.exists():
                try:
                    logger.info(f"Loading word label map from {word_labels_path}...")
                    with open(word_labels_path) as f:
                        word_labels_raw = json.load(f)
                        instance.word_labels = {int(k): v for k, v in word_labels_raw.items()}
                    logger.info(f"✓ Word label map loaded ({len(instance.word_labels)} classes)")
                except Exception as e:
                    logger.warning(f"Could not load word label map: {e}")
                    instance.word_labels = {i: f"word_{i}" for i in range(100)}
            else:
                logger.warning(f"Word label map not found at {word_labels_path}")
                instance.word_labels = {i: f"word_{i}" for i in range(100)}

            cls._initialized = True
            logger.info("✓ Model registry initialized (with placeholders or real models)")
            return instance

        except Exception as e:
            logger.error(f"Fatal error during model registry initialization: {e}")
            raise

    @staticmethod
    def _create_placeholder_model(input_shape: tuple, num_classes: int) -> Any:
        """Create a simple Keras model for development/testing.

        Args:
            input_shape: Input shape tuple (e.g., (None, 21, 3))
            num_classes: Number of output classes

        Returns:
            A compiled Keras model
        """
        from tensorflow import keras as tf_keras
        
        model = tf_keras.Sequential([
            tf_keras.layers.Input(shape=input_shape[1:]),
            tf_keras.layers.Flatten(),
            tf_keras.layers.Dense(128, activation='relu'),
            tf_keras.layers.Dropout(0.3),
            tf_keras.layers.Dense(64, activation='relu'),
            tf_keras.layers.Dropout(0.3),
            tf_keras.layers.Dense(num_classes, activation='softmax')
        ])
        model.compile(optimizer='adam', loss='categorical_crossentropy', metrics=['accuracy'])
        return model

    @classmethod
    def get_instance(cls) -> "ModelRegistry":
        """Get the singleton instance.

        Returns:
            ModelRegistry instance.

        Raises:
            RuntimeError: If instance has not been initialized.
        """
        if not cls._initialized:
            raise RuntimeError(
                "Model registry not initialized. "
                "Call ModelRegistry.initialize() during app startup."
            )
        return cls._instance or cls()

    def predict_letter(self, landmarks: np.ndarray) -> tuple[str, float, dict[str, float]]:
        """Run letter recognition inference.

        Args:
            landmarks: Numpy array of shape (1, 21, 3) with landmark coordinates.

        Returns:
            Tuple of (predicted_letter, confidence, scores_dict).
        """
        if self.letter_model is None:
            raise RuntimeError("Letter model not loaded")

        # Run inference
        logits = self.letter_model.predict(landmarks, verbose=0)
        scores = logits[0]  # Get first (and only) batch

        # Get prediction
        pred_idx = np.argmax(scores)
        predicted_letter = self.letter_labels[int(pred_idx)]
        confidence = float(scores[pred_idx])

        # Build scores dictionary
        scores_dict = {self.letter_labels[i]: float(score) for i, score in enumerate(scores)}

        return predicted_letter, confidence, scores_dict

    def predict_word(self, sequence: np.ndarray) -> tuple[str, float, dict[str, float]]:
        """Run word recognition inference.

        Args:
            sequence: Numpy array of shape (1, 30, 63) with flattened landmark sequence.

        Returns:
            Tuple of (predicted_word, confidence, scores_dict).
        """
        if self.word_model is None:
            raise RuntimeError("Word model not loaded")

        # Run inference
        logits = self.word_model.predict(sequence, verbose=0)
        scores = logits[0]  # Get first (and only) batch

        # Get prediction
        pred_idx = np.argmax(scores)
        predicted_word = self.word_labels[int(pred_idx)]
        confidence = float(scores[pred_idx])

        # Build scores dictionary
        scores_dict = {self.word_labels[i]: float(score) for i, score in enumerate(scores)}

        return predicted_word, confidence, scores_dict


def get_model_registry() -> ModelRegistry:
    """Dependency function to get the model registry.

    Can be used as a FastAPI Depends() function.

    Returns:
        ModelRegistry singleton instance.
    """
    return ModelRegistry.get_instance()
