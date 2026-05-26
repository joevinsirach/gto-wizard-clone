"""
SQLAlchemy models for GTO Wizard API.
"""

import uuid
from datetime import datetime
from typing import List

from sqlalchemy import DateTime, Index, Integer, String, Text, func
from sqlalchemy.dialects.postgresql import ARRAY, JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from apps.api.services.database import Base


class Strategy(Base):
    """
    Strategy model for storing solved GTO strategies.
    
    Stores strategy data with efficient indexing for lookups by
    game_type, players, board, stack_depth, and bet_sizes.
    """
    __tablename__ = "strategies"

    # Primary key
    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    # Unique strategy key for lookups
    key: Mapped[str] = mapped_column(
        String(255),
        unique=True,
        nullable=False,
        index=True,
    )

    # Game configuration
    game_type: Mapped[str] = mapped_column(String(10), nullable=False, index=True)
    players: Mapped[int] = mapped_column(Integer, nullable=False)
    board: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    pot_size: Mapped[int] = mapped_column(Integer, nullable=False, default=100)
    stack_depth: Mapped[int] = mapped_column(Integer, nullable=False, index=True)
    bet_sizes: Mapped[List[int]] = mapped_column(ARRAY(Integer), nullable=False)

    # Strategy data as JSONB for efficient querying
    strategy_data: Mapped[dict] = mapped_column(JSONB, nullable=False)

    # Timestamps
    solved_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=datetime.utcnow,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=datetime.utcnow,
        server_default=func.now(),
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=datetime.utcnow,
        server_default=func.now(),
        onupdate=datetime.utcnow,
    )

    # Composite indexes for common query patterns
    __table_args__ = (
        # Index for lookup by game params (excludes bet_sizes since it's an array)
        Index(
            "ix_strategies_game_lookup",
            "game_type",
            "players",
            "board",
            "stack_depth",
        ),
        # Index for finding strategies by game type and stack depth
        Index(
            "ix_strategies_game_stack",
            "game_type",
            "stack_depth",
        ),
    )

    def __repr__(self) -> str:
        return f"<Strategy(key='{self.key}', game={self.game_type}, players={self.players})>"
