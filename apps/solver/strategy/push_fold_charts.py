"""
Pre-flop push/fold charts for No-Limit Hold'em.

This module defines Nash-equilibrium push/fold charts for common stack sizes
and positions. The charts are simplified all-in or fold decisions.

Chart format: 13x13 matrix for each position
Rows and columns represent card ranks (2-A), suited hands on diagonal and above,
offsuit hands below diagonal.
"""

from typing import Dict, List, Tuple
from enum import Enum

# RANKS for 13x13 grid ordering: 2, 3, 4, 5, 6, 7, 8, 9, T, J, Q, K, A
RANKS = ["2", "3", "4", "5", "6", "7", "8", "9", "T", "J", "Q", "K", "A"]
RANK_INDICES = {r: i for i, r in enumerate(RANKS)}


class Action(Enum):
    """Push/fold action types."""
    PUSH = "push"           # All-in
    FOLD = "fold"           # Fold
    PUSH_OR_FOLD = "push_or_fold"  # When facing a push, either push or fold


class PushFoldCharts:
    """
    Nash-equilibrium push/fold charts for preflop decisions.
    
    These are simplified charts based on known poker theory and don't
    account for all strategic considerations (position, player count,
    open-raising ranges, etc.)
    """
    
    # Stack sizes in big blinds
    STACK_SIZES = [10, 20, 40, 60, 100]
    
    # Positions (in order from earliest to latest)
    POSITIONS = ["UTG", "MP", "CO", "BTN", "SB", "BB"]
    
    @staticmethod
    def get_hand_key(rank1: str, rank2: str, suited: bool) -> Tuple[str, str]:
        """Get the dictionary key for a hand combination."""
        # Sort ranks for consistent key (higher first)
        r1_idx = RANK_INDICES[rank1]
        r2_idx = RANK_INDICES[rank2]
        if r1_idx > r2_idx:
            return (rank2, rank1) if suited else (rank2, rank1)
        return (rank1, rank2)
    
    @classmethod
    def create_empty_chart(cls) -> Dict[Tuple[str, str], str]:
        """Create an empty 13x13 chart dictionary."""
        chart = {}
        for r1 in RANKS:
            for r2 in RANKS:
                chart[(r1, r2)] = "fold"
        return chart
    
    @classmethod
    def generate_nash_chart(cls, stack_bb: int, position: str) -> Dict[Tuple[str, str], str]:
        """
        Generate a simplified Nash push chart for given stack and position.
        
        Uses a simplified model based on ICM and hand equity against calling ranges.
        For deep stacks (>40bb), this becomes more complex as open-raising
        becomes preferable to pushing.
        
        Args:
            stack_bb: Stack size in big blinds
            position: Position name (UTG, MP, CO, BTN, SB, BB)
            
        Returns:
            Dict mapping (rank1, rank2) to action string
        """
        chart = cls.create_empty_chart()
        
        # Position indices for reference
        pos_idx = cls.POSITIONS.index(position) if position in cls.POSITIONS else 0
        
        # Simplified Nash pushing ranges based on stack size and position
        # These are approximate equilibrium ranges derived from poker theory
        
        if stack_bb <= 10:
            # 10bb: Very push/fold oriented
            pushing_ranges = cls._get_10bb_range(pos_idx)
        elif stack_bb <= 20:
            # 20bb: Standard push/fold
            pushing_ranges = cls._get_20bb_range(pos_idx)
        elif stack_bb <= 40:
            # 40bb: Mixed strategy, some open-raising
            pushing_ranges = cls._get_40bb_range(pos_idx)
        elif stack_bb <= 60:
            # 60bb: More selective, open-raising starts
            pushing_ranges = cls._get_60bb_range(pos_idx)
        else:
            # 100bb: Large field play, mostly open-raising
            pushing_ranges = cls._get_100bb_range(pos_idx)
        
        # Fill chart with pushing ranges
        for hand_key, action in pushing_ranges.items():
            chart[hand_key] = action
        
        return chart
    
    @staticmethod
    def _get_10bb_range(pos_idx: int) -> Dict[Tuple[str, str], str]:
        """Get pushing ranges for 10bb stacks."""
        # Very tight at UTG, looser in later positions
        ranges = {
            # Position 0 (UTG): Very tight
            0: {
                # High pairs and strong suited connectors
                ("A", "A"): "push", ("K", "K"): "push", ("Q", "Q"): "push",
                ("J", "J"): "push", ("T", "T"): "push",
                ("A", "K"): "push", ("A", "Q"): "push",
                ("A", "J"): "push", ("K", "Q"): "push",
            },
            # Position 1 (MP): Slightly looser
            1: {
                ("A", "A"): "push", ("K", "K"): "push", ("Q", "Q"): "push",
                ("J", "J"): "push", ("T", "T"): "push", ("9", "9"): "push",
                ("A", "K"): "push", ("A", "Q"): "push", ("A", "J"): "push",
                ("K", "Q"): "push", ("K", "J"): "push",
                ("Q", "J"): "push", ("J", "T"): "push",
            },
            # Position 2 (CO): Looser
            2: {
                ("A", "A"): "push", ("K", "K"): "push", ("Q", "Q"): "push",
                ("J", "J"): "push", ("T", "T"): "push", ("9", "9"): "push",
                ("8", "8"): "push", ("A", "K"): "push", ("A", "Q"): "push",
                ("A", "J"): "push", ("A", "T"): "push",
                ("K", "Q"): "push", ("K", "J"): "push", ("K", "T"): "push",
                ("Q", "J"): "push", ("J", "T"): "push", ("T", "9"): "push",
            },
            # Position 3 (BTN): Very loose
            3: {
                ("A", "A"): "push", ("K", "K"): "push", ("Q", "Q"): "push",
                ("J", "J"): "push", ("T", "T"): "push", ("9", "9"): "push",
                ("8", "8"): "push", ("7", "7"): "push",
                ("A", "K"): "push", ("A", "Q"): "push", ("A", "J"): "push",
                ("A", "T"): "push", ("A", "9"): "push",
                ("K", "Q"): "push", ("K", "J"): "push", ("K", "T"): "push",
                ("Q", "J"): "push", ("J", "T"): "push", ("T", "9"): "push",
                ("9", "8"): "push", ("8", "7"): "push",
            },
            # Position 4 (SB): Loose but need to defend
            4: {
                ("A", "A"): "push", ("K", "K"): "push", ("Q", "Q"): "push",
                ("J", "J"): "push", ("T", "T"): "push", ("9", "9"): "push",
                ("8", "8"): "push", ("7", "7"): "push",
                ("A", "K"): "push", ("A", "Q"): "push", ("A", "J"): "push",
                ("A", "T"): "push", ("A", "9"): "push", ("A", "8"): "push",
                ("K", "Q"): "push", ("K", "J"): "push", ("K", "T"): "push",
                ("Q", "J"): "push", ("J", "T"): "push", ("T", "9"): "push",
                ("9", "8"): "push", ("8", "7"): "push", ("7", "6"): "push",
            },
            # Position 5 (BB): Most loose, defending
            5: {
                ("A", "A"): "push", ("K", "K"): "push", ("Q", "Q"): "push",
                ("J", "J"): "push", ("T", "T"): "push", ("9", "9"): "push",
                ("8", "8"): "push", ("7", "7"): "push", ("6", "6"): "push",
                ("A", "K"): "push", ("A", "Q"): "push", ("A", "J"): "push",
                ("A", "T"): "push", ("A", "9"): "push", ("A", "8"): "push",
                ("A", "7"): "push", ("A", "6"): "push",
                ("K", "Q"): "push", ("K", "J"): "push", ("K", "T"): "push",
                ("K", "9"): "push", ("Q", "J"): "push", ("J", "T"): "push",
                ("T", "9"): "push", ("9", "8"): "push", ("8", "7"): "push",
                ("7", "6"): "push", ("6", "5"): "push",
            },
        }
        return ranges.get(pos_idx, ranges[0])
    
    @staticmethod
    def _get_20bb_range(pos_idx: int) -> Dict[Tuple[str, str], str]:
        """Get pushing ranges for 20bb stacks."""
        ranges = {
            # UTG: Tight
            0: {
                ("A", "A"): "push", ("K", "K"): "push", ("Q", "Q"): "push",
                ("J", "J"): "push", ("T", "T"): "push",
                ("A", "K"): "push", ("A", "Q"): "push",
                ("K", "Q"): "push",
            },
            # MP
            1: {
                ("A", "A"): "push", ("K", "K"): "push", ("Q", "Q"): "push",
                ("J", "J"): "push", ("T", "T"): "push", ("9", "9"): "push",
                ("A", "K"): "push", ("A", "Q"): "push", ("A", "J"): "push",
                ("K", "Q"): "push", ("K", "J"): "push",
                ("Q", "J"): "push", ("J", "T"): "push",
            },
            # CO
            2: {
                ("A", "A"): "push", ("K", "K"): "push", ("Q", "Q"): "push",
                ("J", "J"): "push", ("T", "T"): "push", ("9", "9"): "push",
                ("8", "8"): "push",
                ("A", "K"): "push", ("A", "Q"): "push", ("A", "J"): "push",
                ("A", "T"): "push",
                ("K", "Q"): "push", ("K", "J"): "push", ("K", "T"): "push",
                ("Q", "J"): "push", ("J", "T"): "push", ("T", "9"): "push",
                ("9", "8"): "push",
            },
            # BTN
            3: {
                ("A", "A"): "push", ("K", "K"): "push", ("Q", "Q"): "push",
                ("J", "J"): "push", ("T", "T"): "push", ("9", "9"): "push",
                ("8", "8"): "push", ("7", "7"): "push",
                ("A", "K"): "push", ("A", "Q"): "push", ("A", "J"): "push",
                ("A", "T"): "push", ("A", "9"): "push",
                ("K", "Q"): "push", ("K", "J"): "push", ("K", "T"): "push",
                ("Q", "J"): "push", ("J", "T"): "push", ("T", "9"): "push",
                ("9", "8"): "push", ("8", "7"): "push",
            },
            # SB
            4: {
                ("A", "A"): "push", ("K", "K"): "push", ("Q", "Q"): "push",
                ("J", "J"): "push", ("T", "T"): "push", ("9", "9"): "push",
                ("8", "8"): "push", ("7", "7"): "push",
                ("A", "K"): "push", ("A", "Q"): "push", ("A", "J"): "push",
                ("A", "T"): "push", ("A", "9"): "push",
                ("K", "Q"): "push", ("K", "J"): "push", ("K", "T"): "push",
                ("Q", "J"): "push", ("J", "T"): "push", ("T", "9"): "push",
                ("9", "8"): "push", ("8", "7"): "push",
            },
            # BB
            5: {
                ("A", "A"): "push", ("K", "K"): "push", ("Q", "Q"): "push",
                ("J", "J"): "push", ("T", "T"): "push", ("9", "9"): "push",
                ("8", "8"): "push", ("7", "7"): "push",
                ("A", "K"): "push", ("A", "Q"): "push", ("A", "J"): "push",
                ("A", "T"): "push", ("A", "9"): "push", ("A", "8"): "push",
                ("K", "Q"): "push", ("K", "J"): "push", ("K", "T"): "push",
                ("Q", "J"): "push", ("J", "T"): "push", ("T", "9"): "push",
                ("9", "8"): "push", ("8", "7"): "push", ("7", "6"): "push",
            },
        }
        return ranges.get(pos_idx, ranges[0])
    
    @staticmethod
    def _get_40bb_range(pos_idx: int) -> Dict[Tuple[str, str], str]:
        """Get pushing ranges for 40bb stacks (mixed strategy)."""
        # At 40bb+, open-raising becomes preferable to pushing all-in
        # for most hands. Push/fold is still relevant for strong hands.
        ranges = {
            0: {  # UTG
                ("A", "A"): "push", ("K", "K"): "push", ("Q", "Q"): "push",
                ("J", "J"): "push", ("A", "K"): "push",
            },
            1: {  # MP
                ("A", "A"): "push", ("K", "K"): "push", ("Q", "Q"): "push",
                ("J", "J"): "push", ("T", "T"): "push",
                ("A", "K"): "push", ("A", "Q"): "push",
                ("K", "Q"): "push",
            },
            2: {  # CO
                ("A", "A"): "push", ("K", "K"): "push", ("Q", "Q"): "push",
                ("J", "J"): "push", ("T", "T"): "push",
                ("A", "K"): "push", ("A", "Q"): "push", ("A", "J"): "push",
                ("K", "Q"): "push", ("K", "J"): "push",
                ("Q", "J"): "push",
            },
            3: {  # BTN - still push a lot
                ("A", "A"): "push", ("K", "K"): "push", ("Q", "Q"): "push",
                ("J", "J"): "push", ("T", "T"): "push", ("9", "9"): "push",
                ("A", "K"): "push", ("A", "Q"): "push", ("A", "J"): "push",
                ("A", "T"): "push",
                ("K", "Q"): "push", ("K", "J"): "push", ("K", "T"): "push",
                ("Q", "J"): "push", ("J", "T"): "push",
            },
            4: {  # SB
                ("A", "A"): "push", ("K", "K"): "push", ("Q", "Q"): "push",
                ("J", "J"): "push", ("T", "T"): "push", ("9", "9"): "push",
                ("A", "K"): "push", ("A", "Q"): "push", ("A", "J"): "push",
                ("K", "Q"): "push", ("K", "J"): "push",
                ("Q", "J"): "push", ("J", "T"): "push",
            },
            5: {  # BB
                ("A", "A"): "push", ("K", "K"): "push", ("Q", "Q"): "push",
                ("J", "J"): "push", ("T", "T"): "push", ("9", "9"): "push",
                ("A", "K"): "push", ("A", "Q"): "push", ("A", "J"): "push",
                ("A", "T"): "push",
                ("K", "Q"): "push", ("K", "J"): "push", ("K", "T"): "push",
                ("Q", "J"): "push", ("J", "T"): "push",
            },
        }
        return ranges.get(pos_idx, ranges[0])
    
    @staticmethod
    def _get_60bb_range(pos_idx: int) -> Dict[Tuple[str, str], str]:
        """Get pushing ranges for 60bb stacks."""
        # Even more selective, only premium hands
        ranges = {
            0: {("A", "A"): "push", ("K", "K"): "push", ("Q", "Q"): "push", ("A", "K"): "push"},
            1: {("A", "A"): "push", ("K", "K"): "push", ("Q", "Q"): "push", ("J", "J"): "push", ("A", "K"): "push"},
            2: {("A", "A"): "push", ("K", "K"): "push", ("Q", "Q"): "push", ("J", "J"): "push", ("A", "K"): "push", ("A", "Q"): "push"},
            3: {("A", "A"): "push", ("K", "K"): "push", ("Q", "Q"): "push", ("J", "J"): "push", ("T", "T"): "push", ("A", "K"): "push", ("A", "Q"): "push"},
            4: {("A", "A"): "push", ("K", "K"): "push", ("Q", "Q"): "push", ("J", "J"): "push", ("T", "T"): "push", ("A", "K"): "push", ("A", "Q"): "push"},
            5: {("A", "A"): "push", ("K", "K"): "push", ("Q", "Q"): "push", ("J", "J"): "push", ("T", "T"): "push", ("A", "K"): "push", ("A", "Q"): "push", ("A", "J"): "push"},
        }
        return ranges.get(pos_idx, ranges[0])
    
    @staticmethod
    def _get_100bb_range(pos_idx: int) -> Dict[Tuple[str, str], str]:
        """Get pushing ranges for 100bb stacks."""
        # At 100bb, push only very strong hands
        ranges = {
            0: {("A", "A"): "push", ("K", "K"): "push", ("Q", "Q"): "push", ("A", "K"): "push"},
            1: {("A", "A"): "push", ("K", "K"): "push", ("Q", "Q"): "push", ("J", "J"): "push", ("A", "K"): "push"},
            2: {("A", "A"): "push", ("K", "K"): "push", ("Q", "Q"): "push", ("J", "J"): "push", ("A", "K"): "push", ("A", "Q"): "push"},
            3: {("A", "A"): "push", ("K", "K"): "push", ("Q", "Q"): "push", ("J", "J"): "push", ("T", "T"): "push", ("A", "K"): "push", ("A", "Q"): "push"},
            4: {("A", "A"): "push", ("K", "K"): "push", ("Q", "Q"): "push", ("J", "J"): "push", ("T", "T"): "push", ("A", "K"): "push", ("A", "Q"): "push"},
            5: {("A", "A"): "push", ("K", "K"): "push", ("Q", "Q"): "push", ("J", "J"): "push", ("T", "T"): "push", ("A", "K"): "push", ("A", "Q"): "push", ("A", "J"): "push"},
        }
        return ranges.get(pos_idx, ranges[0])
    
    @classmethod
    def get_calling_range(cls, stack_bb: int, position: str) -> Dict[Tuple[str, str], str]:
        """
        Get calling ranges when facing a push (push_or_fold decision).
        
        Returns a dict of hands that should call, others should fold.
        """
        # Simplified calling ranges based on stack size
        if stack_bb <= 20:
            return cls._get_calling_range_20bb(position)
        elif stack_bb <= 40:
            return cls._get_calling_range_40bb(position)
        else:
            return cls._get_calling_range_deep(position)
    
    @staticmethod
    def _get_calling_range_20bb(position: str) -> Dict[Tuple[str, str], str]:
        """Get calling ranges for 20bb stacks."""
        # Calling ranges are tighter than pushing ranges
        ranges = {
            # BB calling vs SB push (most common scenario)
            "BB": {
                ("A", "A"): "push_or_fold", ("K", "K"): "push_or_fold",
                ("Q", "Q"): "push_or_fold", ("J", "J"): "push_or_fold",
                ("T", "T"): "push_or_fold", ("9", "9"): "push_or_fold",
                ("A", "K"): "push_or_fold", ("A", "Q"): "push_or_fold",
                ("A", "J"): "push_or_fold", ("K", "Q"): "push_or_fold",
            },
            # SB calling vs BTN push
            "SB": {
                ("A", "A"): "push_or_fold", ("K", "K"): "push_or_fold",
                ("Q", "Q"): "push_or_fold", ("J", "J"): "push_or_fold",
                ("T", "T"): "push_or_fold",
                ("A", "K"): "push_or_fold", ("A", "Q"): "push_or_fold",
            },
        }
        return ranges.get(position, {})
    
    @staticmethod
    def _get_calling_range_40bb(position: str) -> Dict[Tuple[str, str], str]:
        """Get calling ranges for 40bb stacks."""
        ranges = {
            "BB": {
                ("A", "A"): "push_or_fold", ("K", "K"): "push_or_fold",
                ("Q", "Q"): "push_or_fold", ("J", "J"): "push_or_fold",
                ("T", "T"): "push_or_fold",
                ("A", "K"): "push_or_fold", ("A", "Q"): "push_or_fold",
            },
            "SB": {
                ("A", "A"): "push_or_fold", ("K", "K"): "push_or_fold",
                ("Q", "Q"): "push_or_fold", ("J", "J"): "push_or_fold",
                ("A", "K"): "push_or_fold",
            },
        }
        return ranges.get(position, {})
    
    @staticmethod
    def _get_calling_range_deep(position: str) -> Dict[Tuple[str, str], str]:
        """Get calling ranges for deep stacks (60bb+)."""
        ranges = {
            "BB": {
                ("A", "A"): "push_or_fold", ("K", "K"): "push_or_fold",
                ("Q", "Q"): "push_or_fold", ("J", "J"): "push_or_fold",
                ("A", "K"): "push_or_fold", ("A", "Q"): "push_or_fold",
            },
            "SB": {
                ("A", "A"): "push_or_fold", ("K", "K"): "push_or_fold",
                ("Q", "Q"): "push_or_fold", ("A", "K"): "push_or_fold",
            },
        }
        return ranges.get(position, {})


def get_hand_string(rank1: str, rank2: str, suited: bool) -> str:
    """
    Format hand as string like 'AKs', 'AKo', or 'AA'.
    
    Args:
        rank1: First rank
        rank2: Second rank
        suited: Whether hand is suited
        
    Returns:
        Formatted hand string (e.g., 'AKs', '72o', 'AA')
    """
    # Higher rank first
    r1_idx = RANK_INDICES[rank1]
    r2_idx = RANK_INDICES[rank2]
    if r1_idx > r2_idx:
        hi, lo = rank1, rank2
    else:
        hi, lo = rank2, rank1
    
    # Pocket pairs don't have suffix
    if hi == lo:
        return f"{hi}{lo}"
    
    suffix = 's' if suited else 'o'
    return f"{hi}{lo}{suffix}"


def parse_hand_string(hand_str: str) -> Tuple[str, str, bool]:
    """
    Parse hand string like 'AKs', '72o', 'AA' into components.
    
    Returns:
        Tuple of (rank1, rank2, suited)
    """
    hand_str = hand_str.strip()
    
    if len(hand_str) == 2:
        # Pocket pair like 'AA'
        return (hand_str[0], hand_str[1], False)
    elif len(hand_str) == 3:
        # AKs or AKo
        r1, r2, suffix = hand_str[0], hand_str[1], hand_str[2]
        suited = (suffix == 's')
        return (r1, r2, suited)
    else:
        raise ValueError(f"Invalid hand string: {hand_str}")


def chart_to_matrix(chart: Dict[Tuple[str, str], str]) -> List[List[str]]:
    """
    Convert chart dict to 13x13 matrix for display.
    
    Returns:
        13x13 matrix where rows are first card, cols are second card.
        Diagonal and above = suited, below = offsuit.
    """
    matrix = []
    for r1 in RANKS:
        row = []
        for r2 in RANKS:
            action = chart.get((r1, r2), "fold")
            # Shorten for display
            if action == "push":
                row.append("P")
            elif action == "fold":
                row.append("F")
            elif action == "push_or_fold":
                row.append("Pf")
            else:
                row.append("?")
        matrix.append(row)
    return matrix


def print_chart(chart: Dict[Tuple[str, str], str], position: str, stack_bb: int):
    """Print a push/fold chart in readable format."""
    matrix = chart_to_matrix(chart)
    
    print(f"\n{'='*60}")
    print(f"Push/Fold Chart - {position} - {stack_bb}bb")
    print(f"{'='*60}")
    print("     2    3    4    5    6    7    8    9    T    J    Q    K    A")
    print("   " + "-" * 52)
    
    for i, r1 in enumerate(RANKS):
        row_str = f"  {r1} "
        for j, action in enumerate(matrix[i]):
            row_str += f"  {action}  "
        print(row_str)
        print()
