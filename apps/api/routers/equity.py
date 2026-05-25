from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional

router = APIRouter(prefix="/api/v1/equity", tags=["equity"])

class EquityRequest(BaseModel):
    hero_hand: str  # e.g., "AhKh"
    villain_range: str  # e.g., "JJ+, AKs"
    board: Optional[str] = None  # e.g., "Kd7h2c"

class EquityResponse(BaseModel):
    equity: float
    wins: int
    ties: int
    total: int

@router.post("/calculate", response_model=EquityResponse)
async def calculate_equity(req: EquityRequest):
    from gto_poker.deck import Deck, Card
    from gto_poker.equity import EquityCalculator
    
    hero_cards = [Card(req.hero_hand[0], req.hero_hand[1]), Card(req.hero_hand[2], req.hero_hand[3])]
    board_cards = Deck.parse_board(req.board) if req.board else []
    
    calc = EquityCalculator()
    result = calc.calculate_equity_monte_carlo(
        hero_cards=hero_cards,
        villain_cards=[Card('A', 'h'), Card('K', 'h')],  # simplified
        board=board_cards,
        iterations=10000
    )
    return EquityResponse(**result)
