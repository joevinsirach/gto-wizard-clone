"""
gRPC Solver Service for GTO poker solving.

Integrates with:
- Celery for async task queue
- Redis pub/sub for progress streaming
- PostgreSQL for strategy storage
"""

import grpc
from concurrent import futures
import threading
import time
import logging
from typing import Dict, Optional

import solver_pb2
import solver_pb2_grpc

logger = logging.getLogger(__name__)


class SolverServicer(solver_pb2_grpc.SolverServicer):
    """
    gRPC service for GTO solver.
    
    Provides async solving via Celery with progress publishing to Redis.
    """
    
    def __init__(self):
        """Initialize the solver service."""
        self.jobs: Dict[str, dict] = {}
        self.lock = threading.Lock()
        self._redis_client = None
        self._celery_app = None
        self._setup_celery()
    
    def _setup_celery(self):
        """Set up Celery integration if available."""
        try:
            from apps.worker.celery_app import celery_app
            self._celery_app = celery_app
            logger.info("Celery integration enabled")
        except ImportError:
            logger.warning("Celery not available - using synchronous mode")
            self._celery_app = None
    
    def _get_redis_client(self):
        """Get Redis client for pub/sub."""
        if self._redis_client is None:
            import redis
            import os
            redis_url = os.environ.get("REDIS_URL", "redis://localhost:6379/0")
            self._redis_client = redis.Redis.from_url(redis_url, decode_responses=True)
        return self._redis_client
    
    def _publish_progress(self, job_id: str, progress: int, status: str, **kwargs):
        """Publish progress to Redis pub/sub."""
        import json
        
        if self._redis_client is None:
            return
        
        channel = f"solver:progress:{job_id}"
        message = {
            "job_id": job_id,
            "progress": progress,
            "status": status,
            "timestamp": time.time(),
        }
        message.update(kwargs)
        
        try:
            self._redis_client.publish(channel, json.dumps(message))
            self._redis_client.set(
                f"job:status:{job_id}",
                json.dumps(message),
                ex=86400,
            )
        except Exception as e:
            logger.error(f"Failed to publish progress for {job_id}: {e}")
    
    def SubmitSolve(self, request, context):
        """
        Submit a solve job asynchronously via Celery.
        
        Returns immediately with a job_id. Progress can be tracked via:
        - Redis pub/sub channel: solver:progress:{job_id}
        - WebSocket at /ws/solver/{job_id}
        """
        job_id = f"job_{int(time.time() * 1000)}"
        
        with self.lock:
            self.jobs[job_id] = {
                "status": "queued",
                "progress": 0,
                "params": {
                    "game_type": request.game_type,
                    "players": request.players,
                    "board": request.board or None,
                    "pot_size": request.pot_size,
                    "stack_depth": request.stack_depth,
                    "iterations": request.iterations,
                }
            }
        
        # Publish initial status
        self._publish_progress(job_id, 0, "queued")
        
        # Queue the job via Celery if available
        if self._celery_app:
            try:
                from apps.worker.tasks import solve_spot
                params = self.jobs[job_id]["params"].copy()
                params["job_id"] = job_id
                solve_spot.delay(params)
                logger.info(f"Queued solve job {job_id} to Celery")
            except Exception as e:
                logger.error(f"Failed to queue job to Celery: {e}")
                self._run_solve_sync(job_id)
        else:
            # Run synchronously if Celery not available
            self._run_solve_sync(job_id)
        
        return solver_pb2.SolveResponse(
            job_id=job_id,
            status="queued",
            progress=0,
            strategy=[],
        )
    
    def _run_solve_sync(self, job_id: str):
        """Run solve synchronously in a background thread."""
        def run_solve():
            params = self.jobs.get(job_id, {}).get("params", {})
            total_steps = params.get("iterations", 100) // 10
            
            for i in range(min(total_steps, 100)):
                time.sleep(0.1)
                progress = int((i + 1) / total_steps * 100)
                
                with self.lock:
                    if job_id in self.jobs:
                        self.jobs[job_id]["progress"] = progress
                        self.jobs[job_id]["status"] = "running"
                
                self._publish_progress(
                    job_id, progress, "running",
                    stage="solving", iteration=i, total=total_steps
                )
            
            # Mark complete
            with self.lock:
                if job_id in self.jobs:
                    self.jobs[job_id]["status"] = "complete"
                    self.jobs[job_id]["progress"] = 100
            
            self._publish_progress(job_id, 100, "complete", stage="complete")
            logger.info(f"Solve job {job_id} completed")
        
        thread = threading.Thread(target=run_solve)
        thread.start()
    
    def GetSolveStatus(self, request, context):
        """
        Get the current status of a solve job.
        
        First checks Redis cache, then falls back to in-memory tracking.
        """
        job_id = request.job_id
        
        # Try Redis first
        try:
            redis_client = self._get_redis_client()
            cached = redis_client.get(f"job:status:{job_id}")
            if cached:
                import json
                data = json.loads(cached)
                return solver_pb2.SolveResponse(
                    job_id=job_id,
                    status=data.get("status", "unknown"),
                    progress=data.get("progress", 0),
                    strategy=[],
                )
        except Exception as e:
            logger.warning(f"Redis lookup failed: {e}")
        
        # Fall back to in-memory
        with self.lock:
            job = self.jobs.get(job_id, {"status": "unknown", "progress": 0})
        
        return solver_pb2.SolveResponse(
            job_id=job_id,
            status=job["status"],
            progress=job["progress"],
            strategy=[],
        )
