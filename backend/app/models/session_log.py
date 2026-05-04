"""
SessionLog model - Audit log for prediction sessions.

Tracks all predictions made by users for analytics and auditing.
"""

from datetime import datetime
from uuid import UUID, uuid4

from sqlalchemy import DateTime, Float, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import JSON, UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.database import Base


class SessionLog(Base):
    """Prediction session log table.

    Records every prediction made by users for auditing and analytics.

    Attributes:
        id: Primary key (UUID)
        user_id: Foreign key to users table (nullable for anonymous sessions)
        model_type: Type of model used (letter | word)
        prediction: The predicted label/string
        confidence: Top softmax probability (0.0-1.0)
        raw_scores: Full softmax array as JSONB
        input_snapshot: Original landmark data sent by client as JSONB
        created_at: Timestamp when prediction was made
        user: Relationship to User object
    """

    __tablename__ = "session_logs"

    id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        primary_key=True,
        default=uuid4,
        index=True,
    )
    user_id: Mapped[UUID | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    model_type: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        index=True,
    )
    prediction: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    confidence: Mapped[float] = mapped_column(Float, nullable=False)
    raw_scores: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    input_snapshot: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
        index=True,
    )

    # Relationships
    user: Mapped["User | None"] = relationship("User", back_populates="session_logs")

    def __repr__(self) -> str:
        """String representation of session log."""
        return (
            f"<SessionLog(id={self.id}, user_id={self.user_id}, "
            f"model_type={self.model_type}, prediction={self.prediction})>"
        )
