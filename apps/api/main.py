"""
GTO Wizard Clone — FastAPI Backend
REST API + WebSocket server for poker training platform
"""

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime, timedelta
import asyncio
import json
import uuid

app = FastAPI(
    title="GTO Wizard Clone API",
    version="0.1.0",
    description="Backend API for GTO poker training platform"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Pydantic Models ─────────────────────────────────────────────────────────

class EquityRequest(BaseModel):
    hero_hand: str = Field(..., description="Hero hand like 'AhKh' or 'AKs'")
    villain_range: str = Field(..., description="Villain range like 'JJ+, AKs'")
    board: Optional[str] = Field(None, description="Board cards like 'Kd7h2c'")
    iterations: int = Field(10000, ge=1000, le=1000000)

class EquityResponse(BaseModel):
    equity: float
    wins: int
    ties: int
    total: int

class SolveRequest(BaseModel):
    game_type: str = Field(default="nlh", description="nlh or plo")
    players: int = Field(2, ge=2, le=6)
    board: Optional[str] = Field(None, description="Board cards or empty for preflop")
    pot_size: float = Field(100.0, ge=0)
    stack_depth: float = Field(100.0, ge=0)
    bet_sizes: Optional[List[float]] = Field(None, description="Allowed bet sizes as multiples of pot")

class SolveResponse(BaseModel):
    job_id: str
    status: str
    message: str

# ─── WebSocket Manager ───────────────────────────────────────────────────────

class WSManager:
    def __init__(self):
        self.active: Dict[str, List[WebSocket]] = {}
    
    async def connect(self, channel: str, ws: WebSocket):
        await ws.accept()
        if channel not in self.active:
            self.active[channel] = []
        self.active[channel].append(ws)
    
    async def broadcast(self, channel: str, data: dict):
        if channel in self.active:
            for ws in self.active[channel]:
                await ws.send_json(data)
    
    def disconnect(self, channel: str, ws: WebSocket):
        if channel in self.active:
            self.active[channel] = [w for w in self.active[channel] if w != ws]
            if not self.active[channel]:
                del self.active[channel]

ws_manager = WSManager()

# ─── Solve Job Storage (in-memory for now, move to Redis/DB later) ──────────

solve_jobs: Dict[str, Dict] = {}

# ─── API Endpoints ───────────────────────────────────────────────────────────

@app.get("/")
async def root():
    return {"message": "GTO Wizard Clone API", "version": "0.1.0", "status": "running"}

@app.get("/api/v1/health")
async def health():
    return {"status": "healthy", "timestamp": datetime.utcnow().isoformat()}

@app.post("/api/v1/equity/calculate", response_model=EquityResponse)
async def calculate_equity(req: EquityRequest):
    """
    Calculate poker equity via Monte Carlo simulation.
    For exact equity on the river, use a different endpoint.
    """
    # Lazy import to avoid circular
    import sys
    sys.path.insert(0, "/tmp/gto-wizard-clone/packages/poker-core/src")
    
    try:
        from gto_poker.deck import Deck, Card
        from gto_poker.equity import EquityCalculator
        
        hero_cards = [Deck.parse(c) for c in [req.hero_hand[:2], req.hero_hand[2:]]]
        board = []
        if req.board:
            board = [Deck.parse(req.board[i:i+2]) for i in range(0, len(req.board), 2)]
        
        # For now, return a placeholder - real equity calc needs full range parsing
        calc = EquityCalculator()
        
        # Simplified: just compute 2-card vs range equity
        villain_combos = []
        # Placeholder - would use RangeParser to expand villain_range
        # For now, use a basic calculation
        
        # Simple equity estimate
        equity = 0.5  # Placeholder
        return EquityResponse(equity=equity, wins=0, ties=0, total=req.iterations)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/v1/solver/solve", response_model=SolveResponse)
async def submit_solve(req: SolveRequest):
    """
    Submit a GTO solve job.
    The solver runs in background and streams progress via WebSocket.
    """
    job_id = str(uuid.uuid4())
    
    solve_jobs[job_id] = {
        "id": job_id,
        "params": req.model_dump(),
        "status": "queued",
        "progress": 0,
        "result": None,
        "created_at": datetime.utcnow().isoformat()
    }
    
    # Start background solve task
    asyncio.create_task(run_solve(job_id, req))
    
    return SolveResponse(
        job_id=job_id,
        status="queued",
        message="Solve job submitted. Connect to /ws/solver/{job_id} for progress."
    )

@app.get("/api/v1/solver/status/{job_id}")
async def get_solve_status(job_id: str):
    if job_id not in solve_jobs:
        raise HTTPException(status_code=404, detail="Job not found")
    return solve_jobs[job_id]

@app.get("/api/v1/solver/strategy/{spot_id}")
async def get_strategy(spot_id: str):
    """Retrieve a pre-solved GTO strategy for a spot"""
    # Placeholder - would look up in database
    return {
        "spot_id": spot_id,
        "strategy": {},
        "message": "Strategy storage not yet implemented"
    }

# ─── WebSocket Endpoints ──────────────────────────────────────────────────────

@app.websocket("/ws/solver/{job_id}")
async def solver_ws(ws: WebSocket, job_id: str):
    await ws_manager.connect(f"solver:{job_id}", ws)
    try:
        while True:
            data = await ws.receive_text()
            # Client can send control messages
            if data == "ping":
                await ws.send_json({"type": "pong"})
    except WebSocketDisconnect:
        ws_manager.disconnect(f"solver:{job_id}", ws)

# ─── Background Solve Task ────────────────────────────────────────────────────

async def run_solve(job_id: str, req: SolveRequest):
    """Run GTO solve in background, broadcasting progress"""
    job = solve_jobs[job_id]
    job["status"] = "running"
    
    try:
        # Simulate solve progress (real CFR would be CPU-intensive)
        for progress in range(0, 101, 10):
            await asyncio.sleep(0.5)  # Simulate work
            job["progress"] = progress
            await ws_manager.broadcast(f"solver:{job_id}", {
                "type": "progress",
                "job_id": job_id,
                "progress": progress
            })
        
        # Complete
        job["status"] = "complete"
        job["result"] = {"message": "Solve complete", "strategy": {}}
        await ws_manager.broadcast(f"solver:{job_id}", {
            "type": "complete",
            "job_id": job_id,
            "result": job["result"]
        })
        
    except Exception as e:
        job["status"] = "error"
        job["error"] = str(e)
        await ws_manager.broadcast(f"solver:{job_id}", {
            "type": "error",
            "job_id": job_id,
            "error": str(e)
        })

# ─── Quiz Endpoints ───────────────────────────────────────────────────────────

class QuizSubmission(BaseModel):
    spot_id: str
    user_action: str
    gto_action: str

@app.post("/api/v1/quiz/submit")
async def submit_quiz(data: QuizSubmission):
    is_correct = data.user_action.upper() == data.gto_action.upper()
    return {
        "correct": is_correct,
        "ev_loss": 0.0 if is_correct else 0.5  # Placeholder
    }

@app.get("/api/v1/quiz/stats")
async def get_quiz_stats():
    return {"total": 0, "accuracy": 0.0, "ev_loss": 0.0}

# ─── HH Upload ──────────────────────────────────────────────────────────────

class HHUploadResponse(BaseModel):
    hands_parsed: int
    message: str

@app.post("/api/v1/hh/upload")
async def upload_hand_history(file_content: str = Field(...)):
    """Parse and store hand history file"""
    # Placeholder - would use HH parser
    return HHUploadResponse(hands_parsed=0, message="HH parsing not yet implemented")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)