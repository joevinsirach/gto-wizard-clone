from fastapi import APIRouter, HTTPException, UploadFile, File, Query
from pydantic import BaseModel
from typing import List, Optional
import uuid

router = APIRouter(prefix="/api/v1/hh", tags=["hand_history"])


class HandSummary(BaseModel):
    id: str
    player_name: str
    timestamp: str
    pot: float
    board: Optional[str] = None
    hero_cards: Optional[str] = None
    result: Optional[str] = None


class UploadResponse(BaseModel):
    success: bool
    hand_id: str
    message: str


# In-memory storage for demo (would be database in production)
hands_db = []


@router.post("/upload", response_model=UploadResponse)
async def upload_hand_history(file: UploadFile = File(...)):
    """Upload and parse a hand history file."""
    content = await file.read()
    text = content.decode("utf-8", errors="ignore")
    
    # Import hand history parser from poker-core
    from gto_poker.hand_history import parse_winamax_hh, detect_format
    
    format_type = detect_format(text)
    if format_type == "winamax":
        parsed = parse_winamax_hh(text)
    else:
        # For now, create a basic entry
        hand_id = str(uuid.uuid4())
        hands_db.append({
            "id": hand_id,
            "raw": text[:500],  # Store first 500 chars for demo
            "format": format_type
        })
        return UploadResponse(
            success=True,
            hand_id=hand_id,
            message=f"Hand history uploaded ({format_type} format)"
        )
    
    # Store parsed hand
    hand_id = str(uuid.uuid4())
    hands_db.append({
        "id": hand_id,
        "players": [p.name for p in parsed.players],
        "pot": parsed.pot,
        "board": str(parsed.board) if parsed.board else None,
        "actions": len(parsed.actions),
        "timestamp": parsed.timestamp.isoformat() if parsed.timestamp else None
    })
    
    return UploadResponse(
        success=True,
        hand_id=hand_id,
        message=f"Parsed {len(parsed.players)} players, pot={parsed.pot}"
    )


@router.get("/hands", response_model=List[HandSummary])
async def query_hands(
    player: Optional[str] = Query(None, description="Filter by player name"),
    limit: int = Query(50, ge=1, le=500, description="Max results to return")
):
    """Query stored hands with optional player filter."""
    results = hands_db[-limit:]
    
    if player:
        results = [
            h for h in results 
            if player.lower() in str(h.get("players", [])).lower()
        ]
    
    return [
        HandSummary(
            id=h["id"],
            player_name=", ".join(h.get("players", ["Unknown"])),
            timestamp=h.get("timestamp", "unknown"),
            pot=h.get("pot", 0),
            board=h.get("board"),
            hero_cards=None,
            result=None
        )
        for h in results
    ]


@router.get("/hands/{hand_id}")
async def get_hand(hand_id: str):
    """Get detailed information about a specific hand."""
    hand = next((h for h in hands_db if h["id"] == hand_id), None)
    if not hand:
        raise HTTPException(status_code=404, detail="Hand not found")
    return hand