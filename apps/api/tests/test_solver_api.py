"""
Tests for solver API endpoints.

Tests:
- Job submission
- Job status polling
- Strategy retrieval
"""

import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock
import uuid


def test_submit_solve_request():
    """Test that submit solve request model works."""
    from apps.api.routers.solver import SolveRequest
    
    req = SolveRequest(
        game_type="nlh",
        players=2,
        board=None,
        pot_size=100,
        stack_depth=100,
    )
    
    assert req.game_type == "nlh"
    assert req.players == 2
    assert req.stack_depth == 100


def test_solve_job_response():
    """Test that solve job response model works."""
    from apps.api.routers.solver import SolveJobResponse
    
    resp = SolveJobResponse(
        id="test-job-123",
        status="queued",
        progress=0,
    )
    
    assert resp.id == "test-job-123"
    assert resp.status == "queued"
    assert resp.progress == 0


def test_strategy_key_parsing():
    """Test strategy key parsing."""
    from apps.api.services.strategy_storage import StrategyStorageService
    
    key = "nlh:2:preflop::0:100"
    parsed = StrategyStorageService.parse_strategy_key(key)
    
    assert parsed["game_type"] == "nlh"
    assert parsed["players"] == 2
    assert parsed["street"] == "preflop"
    assert parsed["stack_depth"] == 100


def test_strategy_key_creation():
    """Test strategy key creation."""
    from apps.api.services.strategy_storage import StrategyStorageService
    
    key = StrategyStorageService.make_strategy_key(
        street="flop",
        board_hash="",
        bet_size=0.5,
        stack_depth=100,
        game_type="nlh",
        players=2,
    )
    
    assert key == "nlh:2:flop::0.5:100"


@pytest.mark.asyncio
async def test_strategy_storage_service():
    """Test strategy storage service."""
    from apps.api.services.strategy_storage import StrategyStorageService
    
    storage = StrategyStorageService()
    
    # Store a strategy
    strategy = await storage.store_strategy(
        street="preflop",
        board_hash="",
        bet_size=0.0,
        stack_depth=100,
        game_type="nlh",
        players=2,
        strategy_data={
            "hands": [
                {"hand": "AA", "action": "raise", "frequency": 1.0, "ev": 10.5},
                {"hand": "KK", "action": "raise", "frequency": 0.95, "ev": 8.2},
            ]
        },
    )

    assert "nlh:2:preflop" in strategy.key
    assert len(strategy.strategy_data["hands"]) == 2

    # Retrieve it
    retrieved = await storage.get_strategy(strategy.key)
    assert retrieved is not None
    assert retrieved.key == strategy.key


def test_websocket_manager_initialization():
    """Test WebSocket manager initializes correctly."""
    from apps.api.websocket.manager import WebSocketManager
    
    manager = WebSocketManager()
    assert manager.connection_count == 0


def test_redis_service_initialization():
    """Test Redis service initializes correctly."""
    from apps.api.services.redis_service import RedisService
    
    # Get singleton instance
    service = RedisService.get_instance()
    assert service is not None
    assert service.client is not None


def test_celery_app_configuration():
    """Test Celery app configuration."""
    from apps.worker.celery_app import celery_app, get_progress_channel
    
    assert celery_app is not None
    assert celery_app.conf.task_serializer == "json"
    assert get_progress_channel("job-123") == "solver:progress:job-123"


def test_progress_channel_format():
    """Test progress channel format."""
    from apps.worker.celery_app import get_progress_channel
    
    job_id = "abc-123"
    channel = get_progress_channel(job_id)
    assert channel == f"solver:progress:{job_id}"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
