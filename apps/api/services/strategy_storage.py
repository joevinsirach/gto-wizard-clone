"""
Strategy storage service for PostgreSQL.

Handles serialization and storage of solved GTO strategies.
Uses Redis as L1 cache and PostgreSQL as backing store.

Key format: {game_type}:{players}:{board}:{bet_sizes}:{stack_depth}
Example: nlh:2:flop:Kd7h2c:[10,25,50,100]:100
"""

import json
import logging
import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from apps.api.services.database import get_session_context
from apps.api.services.models import Strategy
from apps.api.services.redis_service import RedisService

logger = logging.getLogger(__name__)

# Redis cache TTL (7 days)
CACHE_TTL = 604800


class StrategyAction(BaseModel):
    """Single action in a strategy."""
    hand: str  # e.g., "AKs", "TT", "72o"
    action: str  # "raise", "call", "fold"
    frequency: float  # Probability of action (0-1)
    ev: float  # Expected value in big blinds


class StoredStrategy(BaseModel):
    """Full stored strategy with metadata."""
    id: Optional[str] = None
    key: str  # Strategy key
    game_type: str  # "nlh", "plo"
    players: int
    board: str  # Board cards or "preflop"
    pot_size: int
    stack_depth: int
    bet_sizes: List[int]
    strategy_data: List[Dict[str, Any]]  # Actions with frequencies and EVs
    solved_at: datetime


class StrategyStorageService:
    """
    Service for storing and retrieving GTO strategies from PostgreSQL.
    
    Uses Redis as L1 cache with PostgreSQL as backing store.
    
    The strategy key format: {game_type}:{players}:{board}:{bet_sizes}:{stack_depth}
    
    Example keys:
    - nlh:2:preflop:[]:100
    - nlh:2:flop:Kd7h2c:[10,25,50]:100
    - plo:4:preflop:[]:200
    """
    
    def __init__(self, db_session: Optional[AsyncSession] = None):
        """
        Initialize strategy storage service.
        
        Args:
            db_session: SQLAlchemy async database session (optional)
        """
        self._db_session = db_session
        self._redis = RedisService.get_instance()
    
    @staticmethod
    def make_strategy_key(
        game_type: str,
        players: int,
        board: str,
        bet_sizes: List[int],
        stack_depth: int,
    ) -> str:
        """
        Generate a strategy key.
        
        Args:
            game_type: Game type (nlh, plo)
            players: Number of players
            board: Board cards or "preflop"
            bet_sizes: List of allowed bet sizes
            stack_depth: Stack depth in big blinds
        
        Returns:
            Strategy key string
        """
        bet_sizes_str = ",".join(map(str, sorted(bet_sizes))) if bet_sizes else ""
        return f"{game_type}:{players}:{board}:{bet_sizes_str}:{stack_depth}"
    
    @staticmethod
    def parse_strategy_key(key: str) -> Dict[str, Any]:
        """
        Parse a strategy key into its components.
        
        Args:
            key: Strategy key string
        
        Returns:
            Dictionary with key components
        
        Raises:
            ValueError: If key format is invalid
        """
        parts = key.split(":")
        if len(parts) != 5:
            raise ValueError(f"Invalid strategy key format: {key}")
        
        game_type, players, board, bet_sizes_str, stack_depth = parts
        
        bet_sizes = []
        if bet_sizes_str:
            bet_sizes = [int(x) for x in bet_sizes_str.split(",")]
        
        return {
            "game_type": game_type,
            "players": int(players),
            "board": board,
            "bet_sizes": bet_sizes,
            "stack_depth": int(stack_depth),
        }
    
    def _cache_to_redis(self, strategy: StoredStrategy) -> None:
        """Cache strategy to Redis."""
        try:
            cache_key = f"strategy:{strategy.key}"
            cache_data = {
                "key": strategy.key,
                "game_type": strategy.game_type,
                "players": strategy.players,
                "board": strategy.board,
                "pot_size": strategy.pot_size,
                "stack_depth": strategy.stack_depth,
                "bet_sizes": strategy.bet_sizes,
                "strategy_data": strategy.strategy_data,
                "solved_at": strategy.solved_at.isoformat(),
            }
            self._redis.client.setex(cache_key, CACHE_TTL, json.dumps(cache_data))
            
            # Update index
            index_key = f"strategy:index:{strategy.game_type}:{strategy.players}:{strategy.board}"
            self._redis.client.zadd(index_key, {strategy.key: strategy.stack_depth})
        except Exception as e:
            logger.warning(f"Failed to cache strategy {strategy.key} to Redis: {e}")
    
    async def store_strategy(
        self,
        game_type: str,
        players: int,
        board: str,
        stack_depth: int,
        strategy_data: List[Dict[str, Any]],
        pot_size: int = 100,
        bet_sizes: Optional[List[int]] = None,
    ) -> StoredStrategy:
        """
        Store a solved strategy to PostgreSQL.
        
        Args:
            game_type: Game type
            players: Number of players
            board: Board cards or "preflop"
            stack_depth: Stack depth in big blinds
            strategy_data: List of action dictionaries
            pot_size: Pot size in big blinds
            bet_sizes: Allowed bet sizes
        
        Returns:
            StoredStrategy object
        """
        if bet_sizes is None:
            bet_sizes = []
        
        key = self.make_strategy_key(
            game_type, players, board, bet_sizes, stack_depth
        )
        
        now = datetime.utcnow()
        strategy = StoredStrategy(
            key=key,
            game_type=game_type,
            players=players,
            board=board,
            pot_size=pot_size,
            stack_depth=stack_depth,
            bet_sizes=bet_sizes,
            strategy_data=strategy_data,
            solved_at=now,
        )
        
        async with get_session_context() as session:
            # Check if strategy with this key already exists
            stmt = select(Strategy).where(Strategy.key == key)
            result = await session.execute(stmt)
            existing = result.scalar_one_or_none()
            
            if existing:
                # Update existing strategy
                existing.strategy_data = strategy_data
                existing.pot_size = pot_size
                existing.bet_sizes = bet_sizes
                existing.solved_at = now
                existing.updated_at = now
                strategy.id = str(existing.id)
            else:
                # Create new strategy record
                db_strategy = Strategy(
                    key=key,
                    game_type=game_type,
                    players=players,
                    board=board,
                    pot_size=pot_size,
                    stack_depth=stack_depth,
                    bet_sizes=bet_sizes,
                    strategy_data=strategy_data,
                    solved_at=now,
                )
                session.add(db_strategy)
                await session.flush()
                strategy.id = str(db_strategy.id)
        
        # Cache to Redis
        self._cache_to_redis(strategy)
        
        logger.info(f"Stored strategy: {key} with {len(strategy_data)} actions")
        
        return strategy
    
    async def get_strategy(self, key: str) -> Optional[StoredStrategy]:
        """
        Retrieve a strategy by key.
        
        Checks Redis cache first (L1), then PostgreSQL (backing store).
        
        Args:
            key: Strategy key
        
        Returns:
            StoredStrategy or None if not found
        """
        # Check Redis cache first (L1)
        try:
            cache_key = f"strategy:{key}"
            cached = self._redis.client.get(cache_key)
            if cached:
                data = json.loads(cached)
                return StoredStrategy(
                    id=data.get("id"),
                    key=data["key"],
                    game_type=data["game_type"],
                    players=data["players"],
                    board=data["board"],
                    pot_size=data["pot_size"],
                    stack_depth=data["stack_depth"],
                    bet_sizes=data["bet_sizes"],
                    strategy_data=data["strategy_data"],
                    solved_at=datetime.fromisoformat(data["solved_at"]),
                )
        except Exception as e:
            logger.warning(f"Redis cache lookup failed for {key}: {e}")
        
        # Query PostgreSQL (backing store)
        async with get_session_context() as session:
            stmt = select(Strategy).where(Strategy.key == key)
            result = await session.execute(stmt)
            db_strategy = result.scalar_one_or_none()
            
            if db_strategy is None:
                return None
            
            strategy = StoredStrategy(
                id=str(db_strategy.id),
                key=db_strategy.key,
                game_type=db_strategy.game_type,
                players=db_strategy.players,
                board=db_strategy.board,
                pot_size=db_strategy.pot_size,
                stack_depth=db_strategy.stack_depth,
                bet_sizes=db_strategy.bet_sizes,
                strategy_data=db_strategy.strategy_data,
                solved_at=db_strategy.solved_at,
            )
        
        # Cache to Redis for future lookups
        self._cache_to_redis(strategy)
        
        return strategy
    
    async def get_strategy_by_params(
        self,
        game_type: str,
        players: int,
        board: str,
        stack_depth: int,
        bet_sizes: Optional[List[int]] = None,
    ) -> Optional[StoredStrategy]:
        """
        Retrieve a strategy by its parameters.
        
        Args:
            game_type: Game type
            players: Number of players
            board: Board cards or "preflop"
            stack_depth: Stack depth in big blinds
            bet_sizes: Allowed bet sizes
        
        Returns:
            StoredStrategy or None if not found
        """
        key = self.make_strategy_key(
            game_type, players, board, bet_sizes or [], stack_depth
        )
        return await self.get_strategy(key)
    
    async def delete_strategy(self, key: str) -> bool:
        """
        Delete a strategy by key.
        
        Args:
            key: Strategy key
        
        Returns:
            True if deleted, False if not found
        """
        deleted = False
        
        async with get_session_context() as session:
            stmt = select(Strategy).where(Strategy.key == key)
            result = await session.execute(stmt)
            db_strategy = result.scalar_one_or_none()
            
            if db_strategy:
                await session.delete(db_strategy)
                deleted = True
        
        # Remove from Redis cache
        try:
            cache_key = f"strategy:{key}"
            self._redis.client.delete(cache_key)
            
            # Remove from index
            if deleted:
                index_key = f"strategy:index:{db_strategy.game_type}:{db_strategy.players}:{db_strategy.board}"
                self._redis.client.zrem(index_key, key)
        except Exception as e:
            logger.warning(f"Failed to delete strategy {key} from Redis: {e}")
        
        return deleted
    
    def to_json(self, strategy: StoredStrategy) -> str:
        """
        Serialize a StoredStrategy to JSON string.
        
        Args:
            strategy: Strategy to serialize
        
        Returns:
            JSON string
        """
        return json.dumps({
            "key": strategy.key,
            "game_type": strategy.game_type,
            "players": strategy.players,
            "board": strategy.board,
            "pot_size": strategy.pot_size,
            "stack_depth": strategy.stack_depth,
            "bet_sizes": strategy.bet_sizes,
            "strategy_data": strategy.strategy_data,
            "solved_at": strategy.solved_at.isoformat(),
        })
    
    def from_json(self, json_str: str) -> StoredStrategy:
        """
        Deserialize a StoredStrategy from JSON string.
        
        Args:
            json_str: JSON string
        
        Returns:
            StoredStrategy object
        """
        data = json.loads(json_str)
        return StoredStrategy(
            id=data.get("id"),
            key=data["key"],
            game_type=data["game_type"],
            players=data["players"],
            board=data["board"],
            pot_size=data["pot_size"],
            stack_depth=data["stack_depth"],
            bet_sizes=data["bet_sizes"],
            strategy_data=data["strategy_data"],
            solved_at=datetime.fromisoformat(data["solved_at"]),
        )


# Global storage instance
_strategy_storage: Optional[StrategyStorageService] = None


def get_strategy_storage() -> StrategyStorageService:
    """Get or create global strategy storage instance."""
    global _strategy_storage
    if _strategy_storage is None:
        _strategy_storage = StrategyStorageService()
    return _strategy_storage
