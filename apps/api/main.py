"""
GTO Wizard Clone — FastAPI Backend
REST API + WebSocket server for poker training platform
"""

import logging
import os
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime

import redis

from routers import equity, solver, auth, hh, strategy, quiz
from routers import plo4_equity, plo4_ranges
from routers import double_board, bomb_pot

# Logging setup
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="GTO Wizard Clone API",
    version="0.1.0",
    description="Backend API for GTO poker training platform"
)


def init_redis(app: FastAPI):
    """Initialize Redis connection on startup."""
    redis_url = os.environ.get("REDIS_URL", "redis://localhost:6379")
    try:
        app.state.redis = redis.from_url(redis_url)
        logger.info("Redis connection initialized")
    except Exception as e:
        logger.warning(f"Redis connection failed: {e}")
        app.state.redis = None


@app.on_event("startup")
async def startup_event():
    init_redis(app)


# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(equity.router)
app.include_router(solver.router)
app.include_router(auth.router)
app.include_router(hh.router)
app.include_router(strategy.router)
app.include_router(quiz.router)
app.include_router(plo4_equity.router)
app.include_router(plo4_ranges.router)
app.include_router(double_board.router)
app.include_router(bomb_pot.router)


@app.get("/")
async def root():
    return {"message": "GTO Wizard Clone API", "version": "0.1.0", "status": "running"}


@app.get("/api/v1/health")
async def health():
    return {"status": "healthy", "timestamp": datetime.now(timezone.utc).isoformat()}


@app.websocket("/ws/solver/{job_id}")
async def solver_ws(ws: WebSocket, job_id: str):
    await ws.accept()
    try:
        while True:
            data = await ws.receive_text()
            if data == "ping":
                await ws.send_json({"type": "pong"})
    except WebSocketDisconnect:
        pass


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
