"""
Application configuration using pydantic-settings.

All environment variables are loaded from .env file and validated
using Pydantic's settings management.
"""

from typing import List

from pydantic import Field, SecretStr
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application configuration settings.

    All values are loaded from environment variables or .env file.
    Sensitive values like SECRET_KEY are SecretStr to avoid logging.
    """

    # Database configuration
    database_url: str = Field(
        default="postgresql+asyncpg://user:password@localhost:5432/asl_db",
        description="Async PostgreSQL connection string",
    )

    # JWT configuration
    secret_key: SecretStr = Field(
        default=SecretStr("your-secret-key-min-32-chars"),
        description="Secret key for JWT signing (min 32 characters)",
    )
    algorithm: str = Field(default="HS256", description="JWT signing algorithm")
    access_token_expire_minutes: int = Field(
        default=30, description="Access token lifetime in minutes"
    )
    refresh_token_expire_days: int = Field(
        default=7, description="Refresh token lifetime in days"
    )

    # Admin user seed configuration
    admin_email: str = Field(
        default="admin@asl.app", description="Default admin email address"
    )
    admin_password: str = Field(
        default="ChangeMe123!", description="Default admin password"
    )

    # ML model paths
    letter_model_path: str = Field(
        default="ml_models/asl_model_full.keras",
        description="Path to letter recognition model",
    )
    word_model_path: str = Field(
        default="ml_models/word_model.keras",
        description="Path to word recognition model",
    )
    letter_label_map_path: str = Field(
        default="ml_models/label_map.json",
        description="Path to letter label map JSON",
    )
    word_label_map_path: str = Field(
        default="ml_models/word_label_map.json",
        description="Path to word label map JSON",
    )

    # Application environment
    app_env: str = Field(default="development", description="Environment: development|production")

    # CORS configuration
    cors_origins: List[str] = Field(
        default=["http://localhost:5173"],
        description="Allowed CORS origins",
    )

    # Logging
    log_level: str = Field(default="INFO", description="Logging level")

    class Config:
        """Pydantic config."""

        env_file = ".env"
        case_sensitive = False

    @property
    def sql_alchemy_database_url(self) -> str:
        """Return the database URL as a string (not SecretStr)."""
        return self.database_url

    @property
    def jwt_secret_key(self) -> str:
        """Return the JWT secret key as a string (not SecretStr)."""
        return self.secret_key.get_secret_value()


# Single global settings instance
settings = Settings()
