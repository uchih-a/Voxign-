"""
Role model - RBAC role definitions.

Roles: admin, user (exactly two roles, no more).
"""

from datetime import datetime
from typing import List

from sqlalchemy import DateTime, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.database import Base


class Role(Base):
    """Role table for RBAC.

    Attributes:
        id: Primary key (auto-increment)
        name: Unique role name (admin | user)
        description: Human-readable role description
        created_at: Timestamp when role was created
        users: Relationship to users with this role
    """

    __tablename__ = "roles"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(50), unique=True, nullable=False, index=True)
    description: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    # Relationships
    users: Mapped[List["User"]] = relationship("User", back_populates="role")

    def __repr__(self) -> str:
        """String representation of role."""
        return f"<Role(id={self.id}, name={self.name})>"
