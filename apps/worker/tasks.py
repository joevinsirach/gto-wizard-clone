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


def get_redis_client():
    """Get Redis client for pub/sub."""
    import redis
    return redis.Redis.from_url("redis://localhost:6379/0", decode_responses=True)


def publish_progress(
    job_id: str,
    progress: int,
    status: str,
    extra: Optional[Dict[str, Any]] = None
) -> None:
    """Publish progress update to Redis pub/sub channel."""
    try:
        client = get_redis_client()
        channel = get_progress_channel(job_id)

        payload = {
            "job_id": job_id,
            "progress": progress,
            "status": status,
        }
        if extra:
            payload.update(extra)

        client.publish(channel, json.dumps(payload))

        # Also cache the latest status
        client.set(f"job:status:{job_id}", json.dumps(payload), ex=86400)
    except Exception as e:
        logger.warning(f"Failed to publish progress for {job_id}: {e}")


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
            - p0_cards: List[str] - Player 0 hole cards like ["Ac", "Kd"]
            - p1_cards: List[str] - Player 1 hole cards like ["Qs", "Js"]

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
    p0_cards = params.get("p0_cards", ["Ac", "Kd"])
    p1_cards = params.get("p1_cards", ["Qs", "Js"])

    logger.info(f"Starting solve task {job_id}: game={game_type}, players={players}, "
                f"board={board}, stack={stack_depth}, iterations={iterations}")

    # Update initial status
    publish_progress(job_id, 0, "running", {"stage": "initializing"})

    try:
        # Import CFR components
        import sys
        sys.path.insert(0, '/tmp/gto-wizard-clone/apps/solver')

        from cfr.engine import solve_river, CFREngine
        from games.texas_hold_em import TexasHoldEm, create_river_state

        # Default bet sizes if not provided
        if bet_sizes is None:
            bet_sizes = [0.5, 1.0]

        # Parse board cards if provided as string
        board_cards = []
        if board:
            if isinstance(board, str):
                board_cards = board.split(",")
            else:
                board_cards = board

        # Create progress callback for CFR iterations
        def progress_callback(iteration: int, infoset_manager):
            """Callback to publish progress during CFR solving."""
            if iteration % max(1, iterations // 20) == 0:
                progress_pct = min(int(iteration / iterations * 100), 99)
                publish_progress(
                    job_id,
                    progress_pct,
                    "running",
                    {
                        "stage": "solving",
                        "iteration": iteration,
                        "total_iterations": iterations,
                        "infosets": len(infoset_manager.all_infosets()) if infoset_manager else 0
                    }
                )

        publish_progress(job_id, 5, "running", {"stage": "building_state"})

        # Build initial game state for river solver
        stacks = [float(stack_depth), float(stack_depth)]

        # Create the river state
        state = create_river_state(
            p0_cards=p0_cards,
            p1_cards=p1_cards,
            board=board_cards if board_cards else ["Kh", "8c", "3d", "2s", "Ks"],
            pot=float(pot_size),
            stacks=stacks,
        )

        # Create game
        game = TexasHoldEm(stack_sizes=stacks, bet_sizes=bet_sizes)

        publish_progress(job_id, 10, "running", {"stage": "solving"})

        # Create CFR engine and run with progress callback
        engine = CFREngine(game)
        strategies = engine.solve(state, iterations=iterations, callback=progress_callback)

        publish_progress(job_id, 90, "running", {"stage": "finalizing"})

        # Convert strategies to serializable format
        strategy_data = convert_strategies_to_output(strategies, game, state)

        # Build result
        result = {
            "job_id": job_id,
            "status": "complete",
            "progress": 100,
            "strategy": strategy_data,
            "game_type": game_type,
            "players": players,
            "board": board or "river",
            "stack_depth": stack_depth,
            "iterations": iterations,
            "p0_cards": p0_cards,
            "p1_cards": p1_cards,
            "infosets_solved": len(strategies),
        }

        # Cache final result
        client = get_redis_client()
        client.set(f"job:result:{job_id}", json.dumps(result), ex=86400)

        # Publish completion
        publish_progress(job_id, 100, "complete", {"stage": "complete"})

        # Save strategy to PostgreSQL via StrategyStorageService
        try:
            from apps.api.services.strategy_storage import get_strategy_storage

            # Determine street from board
            street = "preflop"
            board_key = board or "preflop"
            if board:
                board_list = board.split(",") if isinstance(board, str) else board
                card_count = len(board_list) if board_list else 0
                if card_count == 3:
                    street = "flop"
                elif card_count == 4:
                    street = "turn"
                elif card_count >= 5:
                    street = "river"

            storage = get_strategy_storage()

            strategy_actions = []
            if "actions" in strategy_data:
                for action in strategy_data["actions"]:
                    strategy_actions.append({
                        "hand": action.get("hand", ""),
                        "action": action.get("action", ""),
                        "frequency": action.get("frequency", 0.0),
                    })

            # Store to PostgreSQL
            import asyncio
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            try:
                loop.run_until_complete(storage.store_strategy(
                    game_type=game_type,
                    players=players,
                    board=board_key,
                    stack_depth=stack_depth,
                    strategy_data=strategy_actions,
                    pot_size=pot_size,
                    bet_sizes=bet_sizes or [],
                ))
                logger.info(f"Strategy saved to PostgreSQL: key={storage.make_strategy_key(game_type, players, board_key, bet_sizes or [], stack_depth)}")
            finally:
                loop.close()
        except Exception as storage_error:
            logger.warning(f"Could not save strategy to PostgreSQL: {storage_error}")

        logger.info(f"Solve task {job_id} completed successfully with {len(strategies)} infosets")
        return result

    except Exception as e:
        logger.error(f"Solve task {job_id} failed: {e}")
        publish_progress(job_id, 0, "error", {"error": str(e), "stage": "failed"})
        raise


def convert_strategies_to_output(
    strategies: Dict[str, Any],
    game: Any,
    state: Any
) -> Dict[str, Any]:
    """
    Convert CFR strategies to serializable output format.
    """
    actions_list = []

    for infoset_key, strat in strategies.items():
        parts = infoset_key.split(":")

        if len(parts) >= 7:
            player = parts[0]
            hole_str = parts[1]
            board_str = parts[2]

            try:
                player_idx = 0 if player == "p0" else 1
                valid_actions = game.get_valid_actions(state, player_idx)

                if len(valid_actions) == len(strat):
                    for action, freq in zip(valid_actions, strat):
                        actions_list.append({
                            "player": player,
                            "hand": hole_str,
                            "board": board_str,
                            "action": action,
                            "frequency": float(freq),
                        })
            except Exception:
                continue

    return {
        "infosets": len(strategies),
        "actions": actions_list[:500],
        "total_actions": len(actions_list),
        "solved_at": time.time(),
    }


@shared_task(name="solver.submit_solve")
def submit_solve(params: Dict[str, Any]) -> Dict[str, Any]:
    """
    Submit a solve job to the queue and return job_id immediately.
    """
    job_id = str(uuid.uuid4())
    params["job_id"] = job_id

    solve_spot.delay(params)

    return {
        "job_id": job_id,
        "status": "queued",
        "progress": 0,
    }


@shared_task(name="solver.get_job_status")
def get_job_status(job_id: str) -> Dict[str, Any]:
    """
    Get the current status of a solve job.
    """
    try:
        client = get_redis_client()

        status_json = client.get(f"job:status:{job_id}")
        if status_json:
            return json.loads(status_json)

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
