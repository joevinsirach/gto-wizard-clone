# Generated gRPC message classes
# proto syntax = "proto3"

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
