"""Omaha variants equity calculator endpoints (PLO5, Omaha Hi/Lo, Shortdeck)"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional

import sys
sys.path.insert(0, "/tmp/PokerHandEvaluator/python")
sys.path.insert(0, "/tmp/gto-wizard-clone/packages/poker-core/src")

from gto_poker.plo5 import PLO5Evaluator, PLO5Equity
from gto_poker.omaha_hi_lo import OmahaHiLoEvaluator
from gto_poker.shortdeck import ShortdeckHand


# Main router for /omaha prefix
router = APIRouter(prefix="/omaha", tags=["omaha", "equity"])


# ============== PLO5 Endpoints ==============

class PLO5EquityRequest(BaseModel):
    """Request for PLO5 (5-card Omaha) equity calculation."""
    hand1: List[str]  # 5 hole cards
    hand2: List[str]  # 5 hole cards
    board: Optional[List[str]] = []  # Known board cards (0-5)
    samples: int = 10000


class PLO5EquityResponse(BaseModel):
    """Response with PLO5 equity percentages."""
    hand1: List[str]
    hand2: List[str]
    equity1: float
    equity2: float
    samples: int


@router.post("/plo5/equity/calculate", response_model=PLO5EquityResponse)
async def calculate_plo5_equity(request: PLO5EquityRequest):
    """
    Calculate PLO5 (5-card Omaha) equity for two hands.
    
    Uses Monte Carlo simulation when no board is provided,
    or exact calculation when 5 board cards are known.
    """
    if len(request.hand1) != 5:
        raise HTTPException(status_code=400, detail="hand1 must have 5 cards")
    if len(request.hand2) != 5:
        raise HTTPException(status_code=400, detail="hand2 must have 5 cards")
    if len(request.board) > 5:
        raise HTTPException(status_code=400, detail="board can have at most 5 cards")
    
    equity_calc = PLO5Equity()
    
    eq1, eq2 = equity_calc.calculate(
        request.hand1,
        request.hand2,
        request.board,
        request.samples
    )
    
    return PLO5EquityResponse(
        hand1=request.hand1,
        hand2=request.hand2,
        equity1=round(eq1, 2),
        equity2=round(eq2, 2),
        samples=request.samples
    )


# ============== Omaha Hi/Lo Endpoints ==============

class OmahaHiLoEquityRequest(BaseModel):
    """Request for Omaha Hi/Lo equity calculation."""
    hand1: List[str]  # 4 hole cards
    hand2: List[str]  # 4 hole cards
    board: Optional[List[str]] = []  # Known board cards (0-5)
    samples: int = 10000


class OmahaHiLoEquityResponse(BaseModel):
    """Response with Omaha Hi/Lo equity percentages."""
    hand1: List[str]
    hand2: List[str]
    high_equity1: float
    high_equity2: float
    low_equity1: float
    low_equity2: float
    scoop_equity1: float
    scoop_equity2: float
    samples: int


@router.post("/hi-lo/equity/calculate", response_model=OmahaHiLoEquityResponse)
async def calculate_omaha_hi_lo_equity(request: OmahaHiLoEquityRequest):
    """
    Calculate Omaha Hi/Lo (8-or-better) equity for two hands.
    
    Returns high, low, and scoop equities for both hands.
    """
    if len(request.hand1) != 4:
        raise HTTPException(status_code=400, detail="hand1 must have 4 cards")
    if len(request.hand2) != 4:
        raise HTTPException(status_code=400, detail="hand2 must have 4 cards")
    if len(request.board) > 5:
        raise HTTPException(status_code=400, detail="board can have at most 5 cards")
    
    evaluator = OmahaHiLoEvaluator()
    
    # TODO: Implement equity calculation once stub is filled
    # For now, raise NotImplementedError from the stub
    raise NotImplementedError("Omaha Hi/Lo equity not yet implemented")


# ============== Shortdeck Endpoints ==============

class ShortdeckEquityRequest(BaseModel):
    """Request for Shortdeck equity calculation."""
    hand1: List[str]  # 2 hole cards
    hand2: List[str]  # 2 hole cards
    board: Optional[List[str]] = []  # Known board cards (0-5)
    samples: int = 10000


class ShortdeckEquityResponse(BaseModel):
    """Response with Shortdeck equity percentages."""
    hand1: List[str]
    hand2: List[str]
    equity1: float
    equity2: float
    samples: int


@router.post("/shortdeck/equity/calculate", response_model=ShortdeckEquityResponse)
async def calculate_shortdeck_equity(request: ShortdeckEquityRequest):
    """
    Calculate Shortdeck (6+ hold'em) equity for two hands.
    
    Shortdeck uses a 36-card deck (6-A) with adjusted hand rankings:
    flush beats full house, full house beats straight.
    """
    if len(request.hand1) != 2:
        raise HTTPException(status_code=400, detail="hand1 must have 2 cards")
    if len(request.hand2) != 2:
        raise HTTPException(status_code=400, detail="hand2 must have 2 cards")
    if len(request.board) > 5:
        raise HTTPException(status_code=400, detail="board can have at most 5 cards")
    
    hand = ShortdeckHand(request.hand1)
    
    # TODO: Implement equity calculation once stub is filled
    # For now, raise NotImplementedError from the stub
    raise NotImplementedError("Shortdeck equity not yet implemented")


__all__ = ["router"]