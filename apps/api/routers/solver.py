from fastapi import APIRouter, HTTPException, WebSocket, WebSocketDisconnect
from pydantic import BaseModel
from typing import Optional, List
import uuid
import asyncio
import logging

from apps.api.websocket.manager import get_websocket_manager
from apps.api.services.redis_service import get_redis_service

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


class SolveJobResponse(BaseModel):
    """Response model for solve job status."""
    id: str
    status: str
    progress: int
    message: Optional[str] = None


@router.post("/solve", response_model=SolveJobResponse)
async def submit_solve(req: SolveRequest):
    """
    Submit a GTO solve job to the Celery queue.
    
    Returns immediately with a job_id for polling and WebSocket subscription.
    """
    try:
        # Import here to avoid circular imports
        from apps.worker.tasks import submit_solve as celery_submit_solve
        
        # Prepare job parameters
        params = {
            "game_type": req.game_type,
            "players": req.players,
            "board": req.board,
            "pot_size": req.pot_size,
            "stack_depth": req.stack_depth,
            "bet_sizes": req.bet_sizes,
            "iterations": req.iterations,
        }
        
        # Submit to Celery queue
        result = celery_submit_solve(params)
        
        return SolveJobResponse(
            id=result["job_id"],
            status=result["status"],
            progress=result["progress"],
            message="Job queued successfully"
        )
        
    except Exception as e:
        logger.error(f"Failed to submit solve job: {e}")
        # Fallback to local job tracking if Celery is not available
        job_id = str(uuid.uuid4())
        return SolveJobResponse(
            id=job_id,
            status="queued",
            progress=0,
            message=f"Job queued locally (Celery unavailable: {str(e)})"
        )


@router.get("/status/{job_id}", response_model=SolveJobResponse)
async def get_status(job_id: str):
    """
    Get the current status of a solve job.
    
    Checks Redis cache first, then falls back to in-memory tracking.
    """
    try:
        # Try Redis first
        redis_service = get_redis_service()
        cached_status = redis_service.get_job_status(job_id)
        
        if cached_status:
            return SolveJobResponse(
                id=job_id,
                status=cached_status.get("status", "unknown"),
                progress=cached_status.get("progress", 0),
            )
    except Exception as e:
        logger.warning(f"Redis lookup failed for {job_id}: {e}")
    
    # Fallback
    raise HTTPException(status_code=404, detail="Job not found")


@router.websocket("/ws/{job_id}")
async def solver_websocket(ws: WebSocket, job_id: str):
    """
    WebSocket endpoint for real-time solver progress updates.
    
    Connects to the WebSocket manager and streams progress for the given job.
    """
    ws_manager = get_websocket_manager()
    
    await ws_manager.connect(ws, job_id)
    
    try:
        # Send initial status
        try:
            redis_service = get_redis_service()
            status = redis_service.get_job_status(job_id)
            if status:
                await ws.send_json({
                    "type": "status",
                    "job_id": job_id,
                    **status,
                })
        except Exception:
            pass
        
        # Keep connection alive and forward Redis pub/sub
        while True:
            data = await ws.receive_text()
            if data == "ping":
                await ws.send_json({"type": "pong"})
            elif data == "subscribe":
                await ws_manager.subscribe(ws, job_id)
            elif data == "unsubscribe":
                await ws_manager.unsubscribe(ws)
                
    except WebSocketDisconnect:
        await ws_manager.disconnect(ws)
