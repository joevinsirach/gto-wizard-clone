"""
Solver API Router — GTO solve workflows.

Connects directly to the gRPC solver server (bypasses Celery).
Endpoints:
- POST /api/v1/solver/solve — Submit a solve job
- GET /api/v1/solver/status/{job_id} — Poll job status
- GET /api/v1/solver/health — Solver server health check
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List
import logging

from apps.api.services.solver_client import submit_solve, check_health

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/v1/solver", tags=["solver"])


class SolveRequest(BaseModel):
    """Request model for submitting a solve job."""
    game_type: str = "nlh"
    players: int = 2
    board: Optional[str] = None
    pot_size: int = 100
    stack_depth: int = 100
    bet_sizes: Optional[List[int]] = None
    iterations: int = 1000
    street: str = "river"
    position: str = "BTN"


class StrategyAction(BaseModel):
    """A single action in the solved strategy."""
    action: str
    frequency: float
    ev: float


class SolveResponse(BaseModel):
    """Response model for solve operations."""
    job_id: str = ""
    status: str
    progress: int = 0
    strategy: List[StrategyAction] = []
    strategy_key: str = ""
    message: Optional[str] = None
    error: Optional[str] = None


@router.post("/solve", response_model=SolveResponse)
async def solve(req: SolveRequest):
    """
    Submit a GTO solve job to the gRPC solver server.

    Returns the computed strategy with action frequencies and EVs.
    """
    try:
        result = submit_solve(
            game_type=req.game_type,
            players=req.players,
            board=req.board,
            pot_size=req.pot_size,
            stack_depth=req.stack_depth,
            bet_sizes=req.bet_sizes,
            iterations=req.iterations,
            street=req.street,
            position=req.position,
        )

        if result["status"] == "error":
            return SolveResponse(
                status="error",
                progress=0,
                error=result.get("error", "Unknown error"),
                message="Solver call failed",
            )

        return SolveResponse(
            job_id=result.get("job_id", ""),
            status=result["status"],
            progress=result.get("progress", 0),
            strategy=[StrategyAction(**a) for a in result.get("strategy", [])],
            strategy_key=result.get("strategy_key", ""),
            message="Solve complete" if result["status"] == "complete" else "Solving...",
        )

    except Exception as e:
        logger.error(f"Solver error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/status/{job_id}", response_model=SolveResponse)
async def get_status(job_id: str):
    """
    Get the current status of a solve job.

    Note: For synchronous gRPC solves, the status is returned immediately.
    For long-running jobs, poll this endpoint.
    """
    # With the direct gRPC approach, solves are currently synchronous.
    # For async support, we'd need Redis-backed job tracking.
    return SolveResponse(
        job_id=job_id,
        status="unknown",
        message="Synchronous solves complete immediately; status tracking requires Redis",
    )


@router.get("/health")
async def solver_health():
    """Check the gRPC solver server health."""
    health = check_health()
    return health
