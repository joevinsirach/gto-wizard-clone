"""
Celery tasks for GTO solver jobs.

Provides async task queue for:
- Long-running CFR solves
- Progress publishing via Redis pub/sub
- WebSocket broadcasting for real-time updates
"""

import json
import logging
import time
import uuid
from typing import Dict, List, Optional, Any

from celery import shared_task
import redis

from apps.worker.celery_app import celery_app, get_progress_channel

logger = logging.getLogger(__name__)

# Redis connection pool for pub/sub
_redis_pool = redis.ConnectionPool.from_url(
    celery_app.conf.broker_url or "redis://localhost:6379/0",
    decode_responses=True
)


def get_redis_client() -> redis.Redis:
    """Get a Redis client from the connection pool."""
    return redis.Redis(connection_pool=_redis_pool)


def publish_progress(job_id: str, progress: int, status: str, data: Optional[Dict] = None):
    """
    Publish solver progress to Redis pub/sub channel.
    
    Args:
        job_id: Unique job identifier
        progress: Progress percentage (0-100)
        status: Job status (queued, running, complete, error)
        data: Optional additional data to publish
    """
    channel = get_progress_channel(job_id)
    message = {
        "job_id": job_id,
        "progress": progress,
        "status": status,
        "timestamp": time.time(),
    }
    if data:
        message.update(data)
    
    try:
        client = get_redis_client()
        client.publish(channel, json.dumps(message))
        # Also cache the latest status
        client.set(f"job:status:{job_id}", json.dumps(message), ex=3600)
    except Exception as e:
        logger.error(f"Failed to publish progress for {job_id}: {e}")


@shared_task(bind=True, name="solver.solve_spot")
def solve_spot(self, params: Dict[str, Any]) -> Dict[str, Any]:
    """
    Celery task for solving a poker spot using CFR.
    
    This is the main async task that:
    1. Accepts solver parameters
    2. Runs the CFR algorithm
    3. Publishes progress to Redis
    4. Returns the solved strategy
    
    Args:
        params: Dictionary containing:
            - game_type: str (e.g., "nlh")
            - players: int (2-6)
            - board: str or None for preflop
            - pot_size: int
            - stack_depth: int
            - bet_sizes: List[int] or None
            - iterations: int (CFR iterations)
            - job_id: str (optional, generated if not provided)
    
    Returns:
        Dictionary with job_id, status, progress, and strategy data
    """
    job_id = params.get("job_id", str(uuid.uuid4()))
    
    # Extract params
    game_type = params.get("game_type", "nlh")
    players = params.get("players", 2)
    board = params.get("board")
    pot_size = params.get("pot_size", 100)
    stack_depth = params.get("stack_depth", 100)
    bet_sizes = params.get("bet_sizes")
    iterations = params.get("iterations", 1000)
    
    logger.info(f"Starting solve task {job_id}: game={game_type}, players={players}, "
                f"board={board}, stack={stack_depth}, iterations={iterations}")
    
    # Update initial status
    publish_progress(job_id, 0, "running", {"stage": "initializing"})
    
    try:
        # Import solver components here to avoid circular imports
        import sys
        sys.path.insert(0, '/tmp/gto-wizard-clone/apps/solver')
        
        from solver.service import SolverServicer
        from solver_pb2 import SolveRequest, SolveResponse
        
        # Create solver instance
        solver = SolverServicer()
        
        # Build gRPC request
        request = SolveRequest(
            game_type=game_type,
            players=players,
            board=board or "",
            pot_size=pot_size,
            stack_depth=stack_depth,
            iterations=iterations,
        )
        
        # For now, simulate progress since the actual solver runs in a thread
        # In production, this would integrate with the actual CFR engine
        total_steps = 10
        for i in range(total_steps):
            time.sleep(0.5)  # Simulate work
            progress = int((i + 1) / total_steps * 100)
            stage = "solving" if progress < 90 else "finalizing"
            publish_progress(job_id, progress, "running", {
                "stage": stage,
                "iteration": i + 1,
                "total_iterations": total_steps
            })
        
        # Generate strategy data (placeholder)
        # In production, this would come from the actual solver
        strategy = generate_mock_strategy(params)
        
        # Build result
        result = {
            "job_id": job_id,
            "status": "complete",
            "progress": 100,
            "strategy": strategy,
            "game_type": game_type,
            "players": players,
            "board": board or "preflop",
            "stack_depth": stack_depth,
        }
        
        # Cache final result
        client = get_redis_client()
        client.set(f"job:result:{job_id}", json.dumps(result), ex=86400)
        
        # Publish completion
        publish_progress(job_id, 100, "complete", {"stage": "complete"})
        
        logger.info(f"Solve task {job_id} completed successfully")
        return result
        
    except Exception as e:
        logger.error(f"Solve task {job_id} failed: {e}")
        publish_progress(job_id, 0, "error", {"error": str(e), "stage": "failed"})
        raise


@shared_task(name="solver.submit_solve")
def submit_solve(params: Dict[str, Any]) -> Dict[str, Any]:
    """
    Submit a solve job to the queue and return job_id immediately.
    
    This is the main entry point for the API. It:
    1. Validates parameters
    2. Creates a job_id
    3. Queues the solve_spot task
    4. Returns the job_id for polling
    
    Args:
        params: Solver parameters (same as solve_spot)
    
    Returns:
        Dictionary with job_id and status
    """
    job_id = str(uuid.uuid4())
    params["job_id"] = job_id
    
    # Queue the actual solve task
    solve_spot.delay(params)
    
    # Return immediately with job info
    return {
        "job_id": job_id,
        "status": "queued",
        "progress": 0,
    }


def generate_mock_strategy(params: Dict[str, Any]) -> Dict[str, Any]:
    """
    Generate mock strategy data for testing.
    
    In production, this would be replaced with actual CFR output.
    """
    import random
    
    game_type = params.get("game_type", "nlh")
    players = params.get("players", 2)
    board = params.get("board") or "preflop"
    stack_depth = params.get("stack_depth", 100)
    
    # Generate some mock actions
    actions = []
    ranks = ["A", "K", "Q", "J", "T", "9", "8", "7", "6", "5", "4", "3", "2"]
    
    for r1 in ranks:
        for r2 in ranks:
            if r1 >= r2:  # Skip duplicates
                continue
                
            # Generate random but weighted action
            roll = random.random()
            if roll < 0.4:
                action = "fold"
                freq = round(random.uniform(0.5, 1.0), 2)
            elif roll < 0.8:
                action = "call"
                freq = round(random.uniform(0.3, 0.7), 2)
            else:
                action = "raise"
                freq = round(random.uniform(0.1, 0.4), 2)
            
            ev = round(random.uniform(-2, 10), 2)
            
            # Determine if suited
            suited = random.choice([True, False])
            suffix = "s" if suited else "o"
            hand = f"{r1}{r2}{suffix}" if r1 != r2 else f"{r1}{r2}"
            
            actions.append({
                "hand": hand,
                "action": action,
                "frequency": freq,
                "ev": ev,
            })
    
    return {
        "key": f"{game_type}:{players}:{board}:{stack_depth}",
        "actions": actions,
        "total_hands": len(actions),
        "solved_at": time.time(),
    }


@shared_task(name="solver.get_job_status")
def get_job_status(job_id: str) -> Dict[str, Any]:
    """
    Get the current status of a solve job.
    
    Args:
        job_id: Job identifier
    
    Returns:
        Dictionary with job status and progress
    """
    try:
        client = get_redis_client()
        
        # Try to get cached status
        status_json = client.get(f"job:status:{job_id}")
        if status_json:
            return json.loads(status_json)
        
        # Try to get result
        result_json = client.get(f"job:result:{job_id}")
        if result_json:
            return json.loads(result_json)
        
        return {
            "job_id": job_id,
            "status": "unknown",
            "progress": 0,
        }
        
    except Exception as e:
        logger.error(f"Failed to get status for {job_id}: {e}")
        return {
            "job_id": job_id,
            "status": "error",
            "error": str(e),
        }


# Alias for backwards compatibility
delay_solve = solve_spot.delay
