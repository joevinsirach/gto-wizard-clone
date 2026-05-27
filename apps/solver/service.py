"""
gRPC Solver Service for GTO poker solving.

Integrates with:
- Celery for async task queue
- Redis pub/sub for progress streaming
- PostgreSQL for strategy storage
- ICM calculator for tournament equity
"""

import grpc
from concurrent import futures
import threading
import asyncio
import time
import logging
from typing import Dict, Optional, List, AsyncIterator

import solver_pb2
import solver_pb2_grpc

logger = logging.getLogger(__name__)

# Add packages/poker-core to path for ICM and CFR engine
import sys
sys.path.insert(0, '/tmp/gto-wizard-clone/packages/poker-core/src')
sys.path.insert(0, '/tmp/gto-wizard-clone/apps/solver')

from gto_poker.icm import (
    icm_calculate,
    icm_for_push_fold,
    get_standard_prizes,
)

# Import strategy storage
from strategy.storage import StrategyStorage, PushFoldStorage


class SolverServicer(solver_pb2_grpc.SolverServiceServicer):
    """
    gRPC service for GTO solver.
    
    Provides async solving via Celery with progress publishing to Redis.
    Also provides ICM calculation for tournament scenarios.
    """
    
    def __init__(self):
        """Initialize the solver service."""
        self.jobs: Dict[str, dict] = {}
        self.lock = threading.Lock()
        self._redis_client = None
        self._celery_app = None
        self._strategy_storage: Optional[StrategyStorage] = None
        self._push_fold_storage: Optional[PushFoldStorage] = None
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
    
    @property
    def strategy_storage(self) -> StrategyStorage:
        """Lazy initialization of strategy storage."""
        if self._strategy_storage is None:
            self._strategy_storage = StrategyStorage()
        return self._strategy_storage
    
    @property
    def push_fold_storage(self) -> PushFoldStorage:
        """Lazy initialization of push/fold storage."""
        if self._push_fold_storage is None:
            self._push_fold_storage = PushFoldStorage()
        return self._push_fold_storage
    
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
    
    async def _publish_progress_async(self, job_id: str, progress: int, status: str, **kwargs):
        """Publish progress asynchronously to Redis pub/sub."""
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
            # Use aioredis or run in executor for sync redis
            loop = asyncio.get_event_loop()
            await loop.run_in_executor(
                None,
                lambda: (
                    self._redis_client.publish(channel, json.dumps(message)),
                    self._redis_client.set(
                        f"job:status:{job_id}",
                        json.dumps(message),
                        ex=86400,
                    )
                )
            )
        except Exception as e:
            logger.error(f"Failed to publish progress for {job_id}: {e}")
    
    async def _progress_generator(self, job_id: str) -> AsyncIterator[solver_pb2.ProgressUpdate]:
        """
        Async generator that yields progress updates by subscribing to Redis pub/sub.
        
        This replaces polling-based progress tracking with efficient pub/sub streaming.
        """
        import json
        
        pubsub = None
        try:
            redis_client = self._get_redis_client()
            pubsub = redis_client.pubsub()
            channel = f"solver:progress:{job_id}"
            pubsub.subscribe(channel)
            
            logger.info(f"Subscribed to progress channel: {channel}")
            
            # Track timeout for final completion message
            start_time = time.time()
            last_progress = 0
            complete_received = False
            
            while True:
                # Check for timeout (job seems stuck)
                if time.time() - start_time > 300:  # 5 minute timeout
                    logger.warning(f"Progress stream timeout for job {job_id}")
                    break
                
                # Read message with timeout
                message = pubsub.get_message(timeout=0.5)
                if message and message['type'] == 'message':
                    try:
                        data = json.loads(message['data'])
                        progress_update = solver_pb2.ProgressUpdate(
                            job_id=data.get('job_id', job_id),
                            progress=data.get('progress', 0),
                            status=data.get('status', ''),
                            stage=data.get('stage', ''),
                            iteration=data.get('iteration', 0),
                            total_iterations=data.get('total', 0),
                            timestamp=data.get('timestamp', time.time()),
                            error=data.get('error', ''),
                        )
                        last_progress = progress_update.progress
                        
                        yield progress_update
                        
                        # Check if job is complete
                        if data.get('status') == 'complete' or data.get('progress', 0) >= 100:
                            complete_received = True
                            # Send one more update with final status
                            await asyncio.sleep(0.1)
                            yield solver_pb2.ProgressUpdate(
                                job_id=job_id,
                                progress=100,
                                status='complete',
                                stage='complete',
                                timestamp=time.time(),
                            )
                            break
                    except (json.JSONDecodeError, KeyError) as e:
                        logger.warning(f"Failed to parse progress message: {e}")
                        continue
                
                # If no messages for a while and we haven't received complete,
                # check in-memory job status
                if not message and last_progress < 100:
                    with self.lock:
                        job = self.jobs.get(job_id)
                    
                    if job:
                        progress_update = solver_pb2.ProgressUpdate(
                            job_id=job_id,
                            progress=job.get('progress', last_progress),
                            status=job.get('status', 'running'),
                            stage=job.get('stage', 'solving'),
                            timestamp=time.time(),
                        )
                        yield progress_update
                        
                        if job.get('status') == 'complete':
                            complete_received = True
                            break
                    else:
                        # Job not found in memory, might be complete or expired
                        if last_progress > 0:
                            yield solver_pb2.ProgressUpdate(
                                job_id=job_id,
                                progress=last_progress,
                                status='complete',
                                stage='complete',
                                timestamp=time.time(),
                            )
                            break
                
                # Small delay to prevent tight loop
                await asyncio.sleep(0.1)
                
        except asyncio.CancelledError:
            logger.info(f"Progress stream cancelled for job {job_id}")
            raise
        except Exception as e:
            logger.error(f"Error in progress generator for job {job_id}: {e}")
            yield solver_pb2.ProgressUpdate(
                job_id=job_id,
                progress=last_progress,
                status='error',
                error=str(e),
                timestamp=time.time(),
            )
        finally:
            if pubsub:
                try:
                    pubsub.unsubscribe(channel)
                    pubsub.close()
                except Exception:
                    pass
    
    def HealthCheck(self, request, context):
        """
        Health check endpoint for the solver service.
        
        Returns service status and availability of dependencies.
        """
        import os
        
        # Check Redis connectivity
        redis_status = "unknown"
        try:
            redis_client = self._get_redis_client()
            redis_client.ping()
            redis_status = "connected"
        except Exception as e:
            redis_status = f"error: {str(e)[:50]}"
        
        # Check strategy storage
        storage_status = "unknown"
        try:
            # Try to access storage
            _ = self.strategy_storage
            storage_status = "available"
        except Exception as e:
            storage_status = f"error: {str(e)[:50]}"
        
        return solver_pb2.HealthResponse(
            healthy=True,
            status="ok",
            details={
                "redis": redis_status,
                "strategy_storage": storage_status,
                "celery": "available" if self._celery_app else "disabled",
                "service": "solver",
            },
        )

    def CalculateICM(self, request, context):
        """
        Calculate ICM equity for tournament players.
        
        Takes stacks, prize pool, and payout structure to compute:
        - ICM equity for each player
        - Bubble factors
        - Chip equity vs ICM equity comparison
        """
        stacks = list(request.stacks)
        prize_pool = request.prize_pool if request.prize_pool > 0 else 1.0
        
        # Build prize list from request or use standard structure
        if request.prizes:
            prizes = [p * prize_pool for p in request.prizes]
        else:
            prizes = get_standard_prizes(len(stacks), prize_pool)
        
        # Build player list
        players = [f"Player{i+1}" for i in range(len(stacks))]
        
        # Run ICM calculation
        results = icm_calculate(
            stacks=stacks,
            prizes=prizes,
            players=players,
            n_simulations=100_000,
        )
        
        # Convert to response
        icm_results = []
        for r in results:
            icm_results.append(solver_pb2.ICMResult(
                player=r.player,
                equity=r.equity,
                chip_equity=r.chip_equity,
                bubble_factor=r.bubble_factor,
                ev=r.ev,
            ))
        
        return solver_pb2.ICMResponse(
            results=icm_results,
            total_prize_pool=prize_pool,
        )
    
    def GetICMForSpot(self, request, context):
        """
        Get ICM-adjusted recommendation for a push/fold spot.
        
        Returns bubble factors and ICM-adjusted equities to help
        with push/fold decisions in tournament contexts.
        """
        stacks = list(request.stacks)
        prize_pool = request.prize_pool if request.prize_pool > 0 else 1.0
        
        # Get standard prizes
        prizes = get_standard_prizes(len(stacks), prize_pool)
        
        # Calculate ICM
        icm_data = icm_for_push_fold(
            stacks=stacks,
            prizes=prizes,
            n_simulations=50_000,
        )
        
        return solver_pb2.ICMSpotResponse(
            equities=icm_data['equities'],
            bubble_factors=icm_data['bubble_factors'],
            chip_equities=icm_data['chip_equities'],
            stacks=stacks,
            prizes=prizes,
            is_icm_spot=any(bf > 1.05 for bf in icm_data['bubble_factors']),
        )

    def GetStrategy(self, request, context):
        """
        Get a GTO strategy by game parameters.
        
        Searches the strategy database for a matching strategy based on:
        - game_type (nlh, plo)
        - street (preflop, flop, turn, river)
        - board (e.g., "Kd7h2c")
        - stack_depth
        - bet_sizes
        
        Returns the strategy data as JSON or status indicating not found/generating.
        """
        try:
            # Determine the street from board if not explicitly provided
            street = request.street or "preflop"
            if not request.street and request.board:
                # Infer street from board length
                board_len = len(request.board.replace(" ", "").replace(",", ""))
                if board_len >= 3:
                    street = "flop"
                if board_len >= 4:
                    street = "turn"
                if board_len >= 5:
                    street = "river"
            
            # For preflop, use push/fold charts
            if street == "preflop":
                # Try to get from push/fold storage
                position = request.position or "BTN"
                stack_depth = request.stack_depth or 100
                
                # Try to get cached chart first
                chart = self.push_fold_storage.get_chart(stack_depth, position)
                
                if chart:
                    import json
                    return solver_pb2.GetStrategyResponse(
                        strategy_data=json.dumps({
                            "type": "push_fold",
                            "stack_depth": stack_depth,
                            "position": position,
                            "actions": chart,
                        }),
                        status="found",
                        key=self.push_fold_storage.make_strategy_key(stack_depth, position),
                    )
                
                # Generate if not found
                chart = self.push_fold_storage.get_or_generate_chart(stack_depth, position)
                import json
                return solver_pb2.GetStrategyResponse(
                    strategy_data=json.dumps({
                        "type": "push_fold",
                        "stack_depth": stack_depth,
                        "position": position,
                        "actions": chart,
                    }),
                    status="found",
                    key=self.push_fold_storage.make_strategy_key(stack_depth, position),
                )
            
            # For post-flop, use strategy storage
            # Parse board hash
            board_hash = request.board.replace(" ", "").replace(",", "")
            
            # Bet size (use first if multiple)
            bet_size = request.bet_sizes[0] if request.bet_sizes else 0.0
            
            # Look up strategy
            strategy_data = self.strategy_storage.get_strategy_by_params(
                street=street,
                board_hash=board_hash,
                bet_size=bet_size,
                stack_depth=request.stack_depth,
                game_type=request.game_type,
                players=request.players,
            )
            
            if strategy_data:
                import json
                return solver_pb2.GetStrategyResponse(
                    strategy_data=json.dumps(strategy_data),
                    status="found",
                    key=self.strategy_storage.make_strategy_key(
                        street, board_hash, bet_size, request.stack_depth,
                        request.game_type, request.players
                    ),
                )
            
            # Strategy not found
            return solver_pb2.GetStrategyResponse(
                strategy_data="{}",
                status="not_found",
                key="",
            )
            
        except Exception as e:
            logger.error(f"Error getting strategy: {e}")
            return solver_pb2.GetStrategyResponse(
                strategy_data="{}",
                status="error",
                key="",
            )
    
    def ListStrategies(self, request, context):
        """
        List stored strategies with optional filters.
        
        Filters:
        - game_type: Filter by game type (nlh, plo)
        - players: Filter by number of players
        - board: Filter by board cards
        - street: Filter by street (preflop, flop, turn, river)
        - limit: Maximum number of results (default 100)
        
        Returns strategy summaries with metadata.
        """
        try:
            # Parse street from board if provided
            street = request.street
            if not street and request.board:
                board_len = len(request.board.replace(" ", "").replace(",", ""))
                if board_len >= 3:
                    street = "flop"
                if board_len >= 4:
                    street = "turn"
                if board_len >= 5:
                    street = "river"
            
            # Get strategy list from storage
            strategies = self.strategy_storage.list_strategies(
                game_type=request.game_type if request.game_type else None,
                players=request.players if request.players > 0 else None,
                street=street if street else None,
                limit=request.limit,
            )
            
            # Convert to StrategySummary objects
            summaries = []
            for s in strategies:
                summaries.append(solver_pb2.StrategySummary(
                    key=s.get('key', ''),
                    game_type=s.get('game_type', 'nlh'),
                    players=s.get('players', 2),
                    street=s.get('street', ''),
                    board_hash=s.get('board_hash', ''),
                    bet_size=s.get('bet_size', 0.0),
                    stack_depth=s.get('stack_depth', 100),
                    created_at=s.get('created_at', ''),
                    updated_at=s.get('updated_at', ''),
                ))
            
            return solver_pb2.ListStrategiesResponse(
                strategies=summaries,
                total=len(summaries),
            )
            
        except Exception as e:
            logger.error(f"Error listing strategies: {e}")
            return solver_pb2.ListStrategiesResponse(
                strategies=[],
                total=0,
            )
    
    def StreamProgress(self, request, context):
        """
        Stream progress updates for a solve job using async generator.
        
        This method uses Redis pub/sub for efficient real-time progress streaming
        instead of polling. It yields ProgressUpdate messages as they arrive.
        
        Note: This uses an async generator pattern for progress streaming.
        For better performance in production, consider using aiogrpc.
        """
        job_id = request.job_id
        
        if not job_id:
            return
        
        import json
        
        pubsub = None
        try:
            redis_client = self._get_redis_client()
            pubsub = redis_client.pubsub()
            channel = f"solver:progress:{job_id}"
            pubsub.subscribe(channel)
            
            logger.info(f"Subscribed to progress channel: {channel}")
            
            start_time = time.time()
            last_progress = 0
            timeout_seconds = 300  # 5 minute timeout
            
            while True:
                # Check for timeout
                if time.time() - start_time > timeout_seconds:
                    logger.warning(f"Progress stream timeout for job {job_id}")
                    break
                
                # Read message with timeout
                message = pubsub.get_message(timeout=0.5)
                if message and message['type'] == 'message':
                    try:
                        data = json.loads(message['data'])
                        progress_update = solver_pb2.ProgressUpdate(
                            job_id=data.get('job_id', job_id),
                            progress=data.get('progress', 0),
                            status=data.get('status', ''),
                            stage=data.get('stage', ''),
                            iteration=data.get('iteration', 0),
                            total_iterations=data.get('total', 0),
                            timestamp=data.get('timestamp', time.time()),
                            error=data.get('error', ''),
                        )
                        last_progress = progress_update.progress
                        
                        yield progress_update
                        
                        # Check if job is complete
                        if data.get('status') == 'complete' or data.get('progress', 0) >= 100:
                            yield solver_pb2.ProgressUpdate(
                                job_id=job_id,
                                progress=100,
                                status='complete',
                                stage='complete',
                                timestamp=time.time(),
                            )
                            break
                    except (json.JSONDecodeError, KeyError) as e:
                        logger.warning(f"Failed to parse progress message: {e}")
                        continue
                
                # If no messages and not complete, check in-memory status
                if not message and last_progress < 100:
                    with self.lock:
                        job = self.jobs.get(job_id)
                    
                    if job:
                        yield solver_pb2.ProgressUpdate(
                            job_id=job_id,
                            progress=job.get('progress', last_progress),
                            status=job.get('status', 'running'),
                            stage=job.get('stage', 'solving'),
                            timestamp=time.time(),
                        )
                        
                        if job.get('status') == 'complete':
                            break
                    else:
                        # Job not found, yield final status
                        yield solver_pb2.ProgressUpdate(
                            job_id=job_id,
                            progress=last_progress,
                            status='complete',
                            stage='complete',
                            timestamp=time.time(),
                        )
                        break
                
                time.sleep(0.1)
                
        except Exception as e:
            logger.error(f"Error in progress stream for job {job_id}: {e}")
            yield solver_pb2.ProgressUpdate(
                job_id=job_id,
                progress=last_progress,
                status='error',
                error=str(e),
                timestamp=time.time(),
            )
        finally:
            if pubsub:
                try:
                    pubsub.unsubscribe(channel)
                    pubsub.close()
                except Exception:
                    pass

    def SubmitSolve(self, request, context):
        """
        Submit a solve job asynchronously via Celery.
        
        Returns immediately with a job_id. Progress can be tracked via:
        - Redis pub/sub channel: solver:progress:{job_id}
        - StreamProgress RPC for async streaming
        """
        job_id = f"job_{int(time.time() * 1000)}"
        
        with self.lock:
            self.jobs[job_id] = {
                "status": "queued",
                "progress": 0,
                "stage": "queued",
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
        self._publish_progress(job_id, 0, "queued", stage="queued")
        
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
    
    async def _run_solve_async(self, job_id: str):
        """Run solve asynchronously with async progress publishing."""
        params = self.jobs.get(job_id, {}).get("params", {})
        total_steps = params.get("iterations", 100) // 10
        
        for i in range(min(total_steps, 100)):
            await asyncio.sleep(0.1)
            progress = int((i + 1) / total_steps * 100)
            
            with self.lock:
                if job_id in self.jobs:
                    self.jobs[job_id]["progress"] = progress
                    self.jobs[job_id]["status"] = "running"
                    self.jobs[job_id]["stage"] = "solving"
            
            await self._publish_progress_async(
                job_id, progress, "running",
                stage="solving", iteration=i, total=total_steps
            )
        
        # Mark complete
        with self.lock:
            if job_id in self.jobs:
                self.jobs[job_id]["status"] = "complete"
                self.jobs[job_id]["progress"] = 100
                self.jobs[job_id]["stage"] = "complete"
        
        await self._publish_progress_async(job_id, 100, "complete", stage="complete")
        logger.info(f"Solve job {job_id} completed (async)")
    
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
                        self.jobs[job_id]["stage"] = "solving"
                
                self._publish_progress(
                    job_id, progress, "running",
                    stage="solving", iteration=i, total=total_steps
                )
            
            # Mark complete
            with self.lock:
                if job_id in self.jobs:
                    self.jobs[job_id]["status"] = "complete"
                    self.jobs[job_id]["progress"] = 100
                    self.jobs[job_id]["stage"] = "complete"
            
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