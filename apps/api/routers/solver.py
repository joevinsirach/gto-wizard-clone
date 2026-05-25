from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List
import uuid

router = APIRouter(prefix="/api/v1/solver", tags=["solver"])

class SolveRequest(BaseModel):
    game_type: str = "nlh"
    players: int = 2
    board: Optional[str] = None
    pot_size: int = 100
    stack_depth: int = 100
    bet_sizes: Optional[List[int]] = None

class SolveJobResponse(BaseModel):
    id: str
    status: str
    progress: int

jobs = {}

@router.post("/solve", response_model=SolveJobResponse)
async def submit_solve(req: SolveRequest):
    job_id = str(uuid.uuid4())
    jobs[job_id] = {"status": "queued", "progress": 0}
    return SolveJobResponse(id=job_id, status="queued", progress=0)

@router.get("/status/{job_id}", response_model=SolveJobResponse)
async def get_status(job_id: str):
    job = jobs.get(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return SolveJobResponse(id=job_id, **job)
