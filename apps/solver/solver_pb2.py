# Generated gRPC message classes
# proto syntax = "proto3"
import json
from typing import Dict, Any, List, Optional

class Strategy:
    def __init__(self, action: str = "", frequency: float = 0.0, ev: float = 0.0):
        self.action = action
        self.frequency = frequency
        self.ev = ev

class SolveRequest:
    """Request message for submitting a GTO solve job"""
    def __init__(self, game_type: str = "nlh", players: int = 2, board: str = "",
                 pot_size: int = 100, stack_depth: int = 100, bet_sizes: list = None):
        self.game_type = game_type
        self.players = players
        self.board = board
        self.pot_size = pot_size
        self.stack_depth = stack_depth
        self.bet_sizes = bet_sizes or []
        self.iterations = 1000

class SolveResponse:
    """Response message for solve operations"""
    def __init__(self, job_id: str = "", status: str = "", progress: int = 0, strategy: list = None):
        self.job_id = job_id
        self.status = status
        self.progress = progress
        self.strategy = strategy or []

class StrategyAction:
    """Strategy action with frequency and expected value"""
    def __init__(self, action: str, frequency: float, ev: float):
        self.action = action
        self.frequency = frequency
        self.ev = ev

# ICM-related message classes

class ICMRequest:
    """Request message for ICM calculation"""
    def __init__(self, stacks: list = None, prizes: list = None,
                 prize_pool: float = 1.0, n_simulations: int = 100_000):
        self.stacks = stacks or []
        self.prizes = prizes or []
        self.prize_pool = prize_pool
        self.n_simulations = n_simulations

class ICMResult:
    """ICM calculation result for a single player"""
    def __init__(self, player: str = "", equity: float = 0.0,
                 chip_equity: float = 0.0, bubble_factor: float = 1.0, ev: float = 0.0):
        self.player = player
        self.equity = equity
        self.chip_equity = chip_equity
        self.bubble_factor = bubble_factor
        self.ev = ev

class ICMResponse:
    """Response message for ICM calculations"""
    def __init__(self, results: list = None, total_prize_pool: float = 1.0):
        self.results = results or []
        self.total_prize_pool = total_prize_pool

class ICMSpotRequest:
    """Request for ICM analysis of a push/fold spot"""
    def __init__(self, stacks: list = None, prize_pool: float = 1.0,
                 position: int = 0, hand: str = ""):
        self.stacks = stacks or []
        self.prize_pool = prize_pool
        self.position = position
        self.hand = hand

class ICMSpotResponse:
    """Response for ICM analysis of a push/fold spot"""
    def __init__(self, equities: list = None, bubble_factors: list = None,
                 chip_equities: list = None, stacks: list = None,
                 prizes: list = None, is_icm_spot: bool = False):
        self.equities = equities or []
        self.bubble_factors = bubble_factors or []
        self.chip_equities = chip_equities or []
        self.stacks = stacks or []
        self.prizes = prizes or []
        self.is_icm_spot = is_icm_spot


# Strategy-related message classes

class GetStrategyRequest:
    """Request message for retrieving a GTO strategy"""
    def __init__(self, game_type: str = "nlh", board: str = "", stack_depth: int = 100,
                 bet_sizes: list = None, street: str = "preflop", players: int = 2,
                 position: str = ""):
        self.game_type = game_type
        self.board = board
        self.stack_depth = stack_depth
        self.bet_sizes = bet_sizes or []
        self.street = street
        self.players = players
        self.position = position

class GetStrategyResponse:
    """Response message for strategy retrieval"""
    def __init__(self, strategy_data: str = "{}", status: str = "not_found",
                 key: str = "", created_at: str = ""):
        self.strategy_data = strategy_data  # JSON string
        self.status = status  # "found", "not_found", "generating", "error"
        self.key = key
        self.created_at = created_at

class ListStrategiesRequest:
    """Request message for listing strategies"""
    def __init__(self, game_type: str = "nlh", players: int = 0, board: str = "",
                 street: str = "", limit: int = 100):
        self.game_type = game_type
        self.players = players
        self.board = board
        self.street = street
        self.limit = limit

class StrategySummary:
    """Summary of a stored strategy"""
    def __init__(self, key: str = "", game_type: str = "nlh", players: int = 2,
                 street: str = "", board_hash: str = "", bet_size: float = 0.0,
                 stack_depth: int = 100, created_at: str = "", updated_at: str = ""):
        self.key = key
        self.game_type = game_type
        self.players = players
        self.street = street
        self.board_hash = board_hash
        self.bet_size = bet_size
        self.stack_depth = stack_depth
        self.created_at = created_at
        self.updated_at = updated_at

class ListStrategiesResponse:
    """Response message for listing strategies"""
    def __init__(self, strategies: list = None, total: int = 0):
        self.strategies = strategies or []  # List of StrategySummary
        self.total = total

class ProgressUpdate:
    """Progress update message for streaming"""
    def __init__(self, job_id: str = "", progress: int = 0, status: str = "",
                 stage: str = "", iteration: int = 0, total_iterations: int = 0,
                 timestamp: float = 0.0, error: str = ""):
        self.job_id = job_id
        self.progress = progress
        self.status = status
        self.stage = stage
        self.iteration = iteration
        self.total_iterations = total_iterations
        self.timestamp = timestamp
        self.error = error

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for JSON serialization"""
        return {
            "job_id": self.job_id,
            "progress": self.progress,
            "status": self.status,
            "stage": self.stage,
            "iteration": self.iteration,
            "total_iterations": self.total_iterations,
            "timestamp": self.timestamp,
            "error": self.error,
        }

    @staticmethod
    def from_dict(d: Dict[str, Any]) -> "ProgressUpdate":
        """Create from dictionary"""
        return ProgressUpdate(
            job_id=d.get("job_id", ""),
            progress=d.get("progress", 0),
            status=d.get("status", ""),
            stage=d.get("stage", ""),
            iteration=d.get("iteration", 0),
            total_iterations=d.get("total_iterations", 0),
            timestamp=d.get("timestamp", 0.0),
            error=d.get("error", ""),
        )


# Convenience factories for backward compatibility

def SolveRequestFromDict(d):
    """Create SolveRequest from dict (e.g., from JSON parsed request)"""
    return SolveRequest(
        game_type=d.get('game_type', 'nlh'),
        players=d.get('players', 2),
        board=d.get('board', ''),
        pot_size=d.get('pot_size', 100),
        stack_depth=d.get('stack_depth', 100),
        bet_sizes=d.get('bet_sizes', []),
        iterations=d.get('iterations', 1000),
    )

def ICMRequestFromDict(d):
    """Create ICMRequest from dict"""
    return ICMRequest(
        stacks=d.get('stacks', []),
        prizes=d.get('prizes', []),
        prize_pool=d.get('prize_pool', 1.0),
        n_simulations=d.get('n_simulations', 100_000),
    )

def GetStrategyRequestFromDict(d) -> GetStrategyRequest:
    """Create GetStrategyRequest from dict"""
    return GetStrategyRequest(
        game_type=d.get('game_type', 'nlh'),
        board=d.get('board', ''),
        stack_depth=d.get('stack_depth', 100),
        bet_sizes=d.get('bet_sizes', []),
        street=d.get('street', 'preflop'),
        players=d.get('players', 2),
        position=d.get('position', ''),
    )

def ListStrategiesRequestFromDict(d) -> ListStrategiesRequest:
    """Create ListStrategiesRequest from dict"""
    return ListStrategiesRequest(
        game_type=d.get('game_type', 'nlh'),
        players=d.get('players', 0),
        board=d.get('board', ''),
        street=d.get('street', ''),
        limit=d.get('limit', 100),
    )

def StrategySummaryFromDict(d: Dict[str, Any]) -> StrategySummary:
    """Create StrategySummary from dict"""
    return StrategySummary(
        key=d.get('key', ''),
        game_type=d.get('game_type', 'nlh'),
        players=d.get('players', 2),
        street=d.get('street', ''),
        board_hash=d.get('board_hash', ''),
        bet_size=d.get('bet_size', 0.0),
        stack_depth=d.get('stack_depth', 100),
        created_at=d.get('created_at', ''),
        updated_at=d.get('updated_at', ''),
    )
