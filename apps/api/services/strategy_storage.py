"""
Strategy storage service for PostgreSQL.

Handles serialization and storage of solved GTO strategies.

Key format: {game_type}:{players}:{board}:{bet_sizes}:{stack_depth}
Example: nlh:2:flop:Kd7h2c:[10,25,50,100]:100
"""

import json
import logging
from datetime import datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel

logger = logging.getLogger(__name__)


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
    
    The strategy key format: {game_type}:{players}:{board}:{bet_sizes}:{stack_depth}
    
    Example keys:
    - nlh:2:preflop:[]:100
    - nlh:2:flop:Kd7h2c:[10,25,50]:100
    - plo:4:preflop:[]:200
    """
    
    def __init__(self, db_session=None):
        """
        Initialize strategy storage service.
        
        Args:
            db_session: SQLAlchemy database session (optional for direct usage)
        """
        self._db_session = db_session
        self._cache: Dict[str, StoredStrategy] = {}
    
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
    
    def store_strategy(
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
        Store a solved strategy.
        
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
        
        # Cache locally
        self._cache[key] = strategy
        
        # TODO: Persist to PostgreSQL via db_session
        # For now, just log
        logger.info(f"Stored strategy: {key} with {len(strategy_data)} actions")
        
        return strategy
    
    def get_strategy(self, key: str) -> Optional[StoredStrategy]:
        """
        Retrieve a strategy by key.
        
        Args:
            key: Strategy key
        
        Returns:
            StoredStrategy or None if not found
        """
        # Check cache first
        if key in self._cache:
            return self._cache[key]
        
        # TODO: Query PostgreSQL via db_session
        
        return None
    
    def get_strategy_by_params(
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
        return self.get_strategy(key)
    
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
