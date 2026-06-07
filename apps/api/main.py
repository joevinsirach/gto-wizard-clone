"""
GTO Wizard Clone — FastAPI Backend
REST API + WebSocket server for poker training platform
"""

import logging
import os
from datetime import datetime, timezone
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from routers import equity, solver, auth, hh, strategy, quiz, analyze_leaks
from routers import plo4_equity, plo4_ranges, omaha
from routers import double_board, bomb_pot, spots, courses, icm
from routers.strategy_lookup import router as strategy_lookup_router
from routers.trainer import router as trainer_router
from routers.quiz_ws import websocket_handler

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="GTO Wizard Clone API",
    version="0.1.0",
    description="Backend API for GTO poker training platform"
)


def init_redis():
    """Initialize Redis connection (falls back to fakeredis)."""
    redis_url = os.environ.get("REDIS_URL", "")
    try:
        if redis_url:
            import redis
            app.state.redis = redis.from_url(redis_url, decode_responses=True)
        else:
            import fakeredis
            app.state.redis = fakeredis.FakeRedis(decode_responses=True)
            logger.info("Using fakeredis (no REDIS_URL set)")
        app.state.redis.ping()
        logger.info("Redis connected")
    except Exception as e:
        logger.warning(f"Redis unavailable ({e}), using fakeredis")
        import fakeredis
        app.state.redis = fakeredis.FakeRedis(decode_responses=True)


@app.on_event("startup")
async def startup_event():
    init_redis()
    # Try to init database, but don't fail if models have import issues
    try:
        from apps.api.services.database import init_db
        await init_db()
        logger.info("Database initialized")
    except Exception as e:
        logger.warning(f"Database init skipped: {e}")


@app.on_event("shutdown")
async def shutdown_event():
    pass


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
app.include_router(spots.router)
app.include_router(omaha.router)
app.include_router(analyze_leaks.router)
app.include_router(courses.router)
app.include_router(icm.router)
app.include_router(strategy_lookup_router)
app.include_router(trainer_router)


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


@app.websocket("/ws/quiz")
async def quiz_ws(ws: WebSocket):
    """WebSocket endpoint for real-time quiz events."""
    await websocket_handler(ws)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
