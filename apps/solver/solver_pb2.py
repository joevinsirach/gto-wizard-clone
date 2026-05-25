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
