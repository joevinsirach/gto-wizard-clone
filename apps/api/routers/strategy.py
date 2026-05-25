"""
Strategy API router for push/fold charts.

Provides endpoints for:
- Retrieving push/fold charts by stack depth and position
- Looking up specific hand actions
- Generating and storing new charts
"""

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import Dict, List, Optional, Any
import logging

import sys
sys.path.insert(0, '/tmp/gto-wizard-clone/apps/solver')

from strategy.push_fold_charts import (
    PushFoldCharts,
    RANK_INDICES,
)

from strategy.chart_generator import (
    generate_nash_push_chart,
    chart_to_json_serializable,
    lookup_hand,
    parse_hand_string,
)

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/v1/strategy", tags=["strategy"])


class ChartResponse(BaseModel):
    """Response model for push/fold chart."""
    stack_depth: int
    position: str
    chart: Dict[str, str]
    key: str


class HandLookupResponse(BaseModel):
    """Response model for hand lookup."""
    hand: str
    rank1: str
    rank2: str
    suited: bool
    stack_depth: int
    position: str
    action: str


class HealthResponse(BaseModel):
    """Response model for health check."""
    status: str
    supported_stack_sizes: List[int]
    supported_positions: List[str]


@router.get("/health", response_model=HealthResponse)
async def health_check():
    """Check which stack sizes and positions are supported."""
    return HealthResponse(
        status="ok",
        supported_stack_sizes=PushFoldCharts.STACK_SIZES,
        supported_positions=PushFoldCharts.POSITIONS,
    )


@router.get("/push-fold/{stack_depth}/{position}", response_model=ChartResponse)
async def get_push_fold_chart(stack_depth: int, position: str):
    """
    Get push/fold chart for a specific stack depth and position.
    
    Args:
        stack_depth: Stack size in big blinds (10, 20, 40, 60, or 100)
        position: Position name (UTG, MP, CO, BTN, SB, BB)
        
    Returns:
        ChartResponse with the push/fold chart
        
    Raises:
        HTTPException: If stack_depth or position is not supported
    """
    # Validate stack depth
    if stack_depth not in PushFoldCharts.STACK_SIZES:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported stack depth: {stack_depth}. "
                   f"Supported: {PushFoldCharts.STACK_SIZES}"
        )
    
    # Validate position
    position = position.upper()
    if position not in PushFoldCharts.POSITIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported position: {position}. "
                   f"Supported: {PushFoldCharts.POSITIONS}"
        )
    
    # Generate chart
    chart = generate_nash_push_chart(stack_depth, position)
    json_chart = chart_to_json_serializable(chart)
    
    # Generate strategy key
    strategy_key = f"nlh:2:preflop:{stack_depth}:{position.lower()}"
    
    return ChartResponse(
        stack_depth=stack_depth,
        position=position,
        chart=json_chart,
        key=strategy_key,
    )


@router.get("/lookup/{hand}/{stack_depth}/{position}", response_model=HandLookupResponse)
async def lookup_hand_action(
    hand: str,
    stack_depth: int,
    position: str,
):
    """
    Get the recommended action for a specific hand.
    
    Args:
        hand: Hand string like 'AKs', 'TT', '72o'
        stack_depth: Stack size in big blinds
        position: Position name
        
    Returns:
        HandLookupResponse with action details
        
    Raises:
        HTTPException: If hand format is invalid or stack/position unsupported
    """
    # Validate stack depth
    if stack_depth not in PushFoldCharts.STACK_SIZES:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported stack depth: {stack_depth}. "
                   f"Supported: {PushFoldCharts.STACK_SIZES}"
        )
    
    # Validate position
    position = position.upper()
    if position not in PushFoldCharts.POSITIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported position: {position}. "
                   f"Supported: {PushFoldCharts.POSITIONS}"
        )
    
    # Parse hand string
    try:
        rank1, rank2, suited = parse_hand_string(hand)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    
    # Get chart and lookup action
    chart = generate_nash_push_chart(stack_depth, position)
    action = lookup_hand(chart, hand)
    
    return HandLookupResponse(
        hand=hand,
        rank1=rank1,
        rank2=rank2,
        suited=suited,
        stack_depth=stack_depth,
        position=position,
        action=action,
    )


@router.get("/lookup-matrix/{stack_depth}/{position}")
async def get_lookup_matrix(
    stack_depth: int,
    position: str,
) -> Dict[str, Any]:
    """
    Get a 13x13 lookup matrix for UI display.
    
    Returns a matrix format suitable for rendering a push/fold grid.
    
    Args:
        stack_depth: Stack size in big blinds
        position: Position name
        
    Returns:
        Matrix data with actions for each cell
    """
    # Validate inputs
    if stack_depth not in PushFoldCharts.STACK_SIZES:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported stack depth: {stack_depth}"
        )
    
    position = position.upper()
    if position not in PushFoldCharts.POSITIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported position: {position}"
        )
    
    chart = generate_nash_push_chart(stack_depth, position)
    json_chart = chart_to_json_serializable(chart)
    
    # Build matrix
    matrix = []
    ranks = ["A", "K", "Q", "J", "T", "9", "8", "7", "6", "5", "4", "3", "2"]
    
    for r1 in ranks:
        row = []
        for r2 in ranks:
            # Determine suited status
            if r1 == r2:
                hand_str = f"{r1}{r2}"
                suited = True  # Pocket pairs treated as suited for display
            else:
                r1_idx = RANK_INDICES[r1]
                r2_idx = RANK_INDICES[r2]
                if r1_idx > r2_idx:
                    hi, lo = r1, r2
                else:
                    hi, lo = r2, r1
                # Check if suited in original chart
                suited = False
                for hand_key, action in chart.items():
                    if len(hand_key) == 2:
                        k1, k2 = hand_key
                        if (k1 == hi and k2 == lo) or (k1 == lo and k2 == hi):
                            # Found the hand, need to determine suited
                            # For now, assume offsuit unless explicitly suited
                            suited = False
                            break
            
            # Lookup action
            if r1 == r2:
                hand_str = f"{r1}{r2}"
            else:
                r1_idx = RANK_INDICES[r1]
                r2_idx = RANK_INDICES[r2]
                if r1_idx > r2_idx:
                    hi, lo = r1, r2
                    suited_flag = False
                else:
                    hi, lo = r2, r1
                    suited_flag = True
                suffix = 's' if suited_flag else 'o'
                hand_str = f"{hi}{lo}{suffix}"
            
            action = json_chart.get(hand_str, "fold")
            
            row.append({
                "hand": hand_str,
                "action": action,
                "suited": suited_flag if r1 != r2 else True,
            })
        matrix.append(row)
    
    return {
        "stack_depth": stack_depth,
        "position": position,
        "ranks": ranks,
        "matrix": matrix,
    }


@router.get("/{spot_id}", response_model=Dict)
async def get_strategy_by_spot_id(
    spot_id: str,
    board: Optional[str] = Query(None, description="Board cards (e.g., Kd7h2c)"),
    stack_depth: Optional[int] = Query(None, description="Stack depth in big blinds"),
    bet_size: Optional[int] = Query(None, description="Bet size in big blinds"),
    players: Optional[int] = Query(2, description="Number of players"),
):
    """
    Retrieve a stored strategy by spot ID or parameters.
    
    Query params are used to construct the strategy key if spot_id is not a direct lookup.
    
    Strategy key format: {game_type}:{players}:{board}:{bet_sizes}:{stack_depth}
    Example: nlh:2:flop:Kd7h2c:100
    """
    from apps.api.services.strategy_storage import StrategyStorageService
    
    storage = StrategyStorageService()
    
    # Try to find by spot_id directly first
    strategy = storage.get_strategy(spot_id)
    
    if strategy:
        return {
            "spot_id": spot_id,
            "status": "found",
            "strategy": storage.to_json(strategy),
            "actions": strategy.strategy_data,
        }
    
    # Build strategy key from parameters
    if board is None:
        board = "preflop"
    if stack_depth is None:
        stack_depth = 100
    
    bet_sizes = [bet_size] if bet_size else []
    
    strategy = storage.get_strategy_by_params(
        game_type="nlh",
        players=players,
        board=board,
        stack_depth=stack_depth,
        bet_sizes=bet_sizes,
    )
    
    if strategy:
        return {
            "spot_id": spot_id,
            "status": "found",
            "key": strategy.key,
            "actions": strategy.strategy_data,
            "game_type": strategy.game_type,
            "players": strategy.players,
            "board": strategy.board,
            "stack_depth": strategy.stack_depth,
        }
    
    # Generate on-demand if not found
    chart = generate_nash_push_chart(stack_depth, "BTN")
    json_chart = chart_to_json_serializable(chart)
    
    # Convert chart to action list format
    actions = []
    for hand, action in json_chart.items():
        actions.append({
            "hand": hand,
            "action": action,
            "frequency": 1.0 if action == "push" else 0.5,
            "ev": 0.0,
        })
    
    return {
        "spot_id": spot_id,
        "status": "generated",
        "key": f"nlh:{players}:{board}::{stack_depth}",
        "actions": actions,
        "game_type": "nlh",
        "players": players,
        "board": board,
        "stack_depth": stack_depth,
        "message": "Strategy generated on-demand",
    }


@router.post("/store/{stack_depth}/{position}")
async def store_chart(
    stack_depth: int,
    position: str,
    chart_data: Dict[str, str],
) -> Dict[str, str]:
    """
    Store a custom push/fold chart.
    
    Args:
        stack_depth: Stack size in big blinds
        position: Position name
        chart_data: Chart dictionary
        
    Returns:
        Confirmation with strategy key
    """
    if stack_depth not in PushFoldCharts.STACK_SIZES:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported stack depth: {stack_depth}"
        )
    
    position = position.upper()
    if position not in PushFoldCharts.POSITIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported position: {position}"
        )
    
    strategy_key = f"nlh:2:preflop:{stack_depth}:{position.lower()}"
    
    # Store via strategy storage service
    from apps.api.services.strategy_storage import StrategyStorageService
    storage = StrategyStorageService()
    
    # Convert chart_data to action format
    strategy_data = []
    for hand, action in chart_data.items():
        strategy_data.append({
            "hand": hand,
            "action": action,
            "frequency": 1.0,
            "ev": 0.0,
        })
    
    storage.store_strategy(
        game_type="nlh",
        players=2,
        board="preflop",
        stack_depth=stack_depth,
        strategy_data=strategy_data,
        bet_sizes=[],
    )
    
    logger.info(f"Stored chart: {strategy_key}")
    
    return {
        "status": "stored",
        "key": strategy_key,
        "message": "Chart stored successfully",
    }
