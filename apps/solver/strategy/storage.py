"""
Storage layer for push/fold charts.

Handles serialization to JSON and storage in PostgreSQL via the API.
Strategy key format: nlh:2:preflop:{stack_depth}:{position}
"""

import json
import logging
from typing import Dict, Optional, List, Any
from dataclasses import dataclass
from datetime import datetime

from .chart_generator import (
    chart_to_json_serializable,
    json_to_chart,
    generate_nash_push_chart,
)

logger = logging.getLogger(__name__)


@dataclass
class StoredStrategy:
    """Represents a stored strategy with metadata."""
    key: str
    game_type: str  # e.g., "nlh"
    players: int    # e.g., 2
    street: str     # e.g., "preflop"
    stack_depth: int
    position: str
    chart: Dict[str, str]  # JSON-serializable format
    created_at: datetime
    updated_at: datetime


class StrategyStorage:
    """
    Storage handler for push/fold charts.
    
    Supports:
    - JSON serialization for file storage
    - PostgreSQL storage via API
    - In-memory caching
    """
    
    # Strategy key components
    GAME_TYPE = "nlh"
    PLAYERS = 2
    STREET = "preflop"
    
    def __init__(self, api_base_url: Optional[str] = None):
        """
        Initialize strategy storage.
        
        Args:
            api_base_url: Base URL for the API (if None, only local storage)
        """
        self.api_base_url = api_base_url
        self._cache: Dict[str, StoredStrategy] = {}
    
    @staticmethod
    def make_strategy_key(stack_depth: int, position: str) -> str:
        """
        Generate a strategy key.
        
        Format: nlh:2:preflop:{stack_depth}:{position}
        
        Args:
            stack_depth: Stack size in big blinds
            position: Position name (lowercase)
            
        Returns:
            Strategy key string
        """
        return f"nlh:2:preflop:{stack_depth}:{position.lower()}"
    
    @staticmethod
    def parse_strategy_key(key: str) -> Dict[str, any]:
        """
        Parse a strategy key into components.
        
        Args:
            key: Strategy key like "nlh:2:preflop:20:btn"
            
        Returns:
            Dict with game_type, players, street, stack_depth, position
        """
        parts = key.split(":")
        if len(parts) != 5:
            raise ValueError(f"Invalid strategy key format: {key}")
        
        return {
            "game_type": parts[0],
            "players": int(parts[1]),
            "street": parts[2],
            "stack_depth": int(parts[3]),
            "position": parts[4],
        }
    
    def store_chart(
        self,
        stack_depth: int,
        position: str,
        chart: Dict[str, str]
    ) -> StoredStrategy:
        """
        Store a chart in memory and return stored strategy.
        
        Args:
            stack_depth: Stack size in big blinds
            position: Position name
            chart: Chart in JSON-serializable format
            
        Returns:
            StoredStrategy object
        """
        key = self.make_strategy_key(stack_depth, position)
        now = datetime.utcnow()
        
        strategy = StoredStrategy(
            key=key,
            game_type=self.GAME_TYPE,
            players=self.PLAYERS,
            street=self.STREET,
            stack_depth=stack_depth,
            position=position,
            chart=chart,
            created_at=now,
            updated_at=now,
        )
        
        self._cache[key] = strategy
        logger.info(f"Stored chart: {key}")
        
        return strategy
    
    def get_chart(self, stack_depth: int, position: str) -> Optional[Dict[str, str]]:
        """
        Get a chart from cache.
        
        Args:
            stack_depth: Stack size in big blinds
            position: Position name
            
        Returns:
            Chart in JSON-serializable format or None
        """
        key = self.make_strategy_key(stack_depth, position)
        strategy = self._cache.get(key)
        
        if strategy:
            return strategy.chart
        return None
    
    def get_or_generate_chart(
        self,
        stack_depth: int,
        position: str
    ) -> Dict[str, str]:
        """
        Get chart from cache or generate if not present.
        
        Args:
            stack_depth: Stack size in big blinds
            position: Position name
            
        Returns:
            Chart in JSON-serializable format
        """
        # Try cache first
        cached = self.get_chart(stack_depth, position)
        if cached:
            return cached
        
        # Generate new chart
        chart = generate_nash_push_chart(stack_depth, position)
        json_chart = chart_to_json_serializable(chart)
        
        # Store and return
        self.store_chart(stack_depth, position, json_chart)
        return json_chart
    
    def to_json(self, strategy: StoredStrategy) -> str:
        """
        Serialize a StoredStrategy to JSON string.
        
        Args:
            strategy: StoredStrategy to serialize
            
        Returns:
            JSON string
        """
        return json.dumps({
            "key": strategy.key,
            "game_type": strategy.game_type,
            "players": strategy.players,
            "street": strategy.street,
            "stack_depth": strategy.stack_depth,
            "position": strategy.position,
            "chart": strategy.chart,
            "created_at": strategy.created_at.isoformat(),
            "updated_at": strategy.updated_at.isoformat(),
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
            street=data["street"],
            stack_depth=data["stack_depth"],
            position=data["position"],
            chart=data["chart"],
            created_at=datetime.fromisoformat(data["created_at"]),
            updated_at=datetime.fromisoformat(data["updated_at"]),
        )


class StrategyCache:
    """
    In-memory cache for strategy lookups with TTL support.
    """
    
    def __init__(self, ttl_seconds: int = 3600):
        """
        Initialize cache.
        
        Args:
            ttl_seconds: Time-to-live for cached entries
        """
        self._cache: Dict[str, tuple] = {}  # key -> (value, timestamp)
        self.ttl_seconds = ttl_seconds
    
    def _is_expired(self, timestamp: float) -> bool:
        """Check if a cache entry has expired."""
        import time
        return time.time() - timestamp > self.ttl_seconds
    
    def get(self, key: str) -> Optional[Dict]:
        """Get value from cache if not expired."""
        if key in self._cache:
            value, timestamp = self._cache[key]
            if not self._is_expired(timestamp):
                return value
            del self._cache[key]
        return None
    
    def set(self, key: str, value: Dict):
        """Set value in cache with current timestamp."""
        import time
        self._cache[key] = (value, time.time())
    
    def clear(self):
        """Clear all cache entries."""
        self._cache.clear()


# Global cache instance
_strategy_cache = StrategyCache()


def get_cached_chart(stack_depth: int, position: str) -> Optional[Dict[str, str]]:
    """
    Get chart from global cache.
    
    Args:
        stack_depth: Stack size in big blinds
        position: Position name
        
    Returns:
        Chart or None if not cached
    """
    key = f"{stack_depth}:{position}"
    return _strategy_cache.get(key)


def set_cached_chart(stack_depth: int, position: str, chart: Dict[str, str]):
    """
    Store chart in global cache.
    
    Args:
        stack_depth: Stack size in big blinds
        position: Position name
        chart: Chart to cache
    """
    key = f"{stack_depth}:{position}"
    _strategy_cache.set(key, chart)
