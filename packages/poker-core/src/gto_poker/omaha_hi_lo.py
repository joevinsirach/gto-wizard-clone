"""Omaha Hi/Lo (8-or-better) - split pot game mode"""

from typing import List, Tuple, Optional
from .deck import Card
from .hand import Hand


class OmahaHiLoResult:
    """Result of Omaha Hi/Lo hand evaluation"""
    
    def __init__(self, high_hand: Optional[Hand], low_hand: Optional[Hand],
                 high_rank_key: Tuple, low_rank_key: Tuple,
                 can_win_low: bool, can_win_high: bool,
                 best_high_cards: List[Card], best_low_cards: List[Card]):
        self.high_hand = high_hand
        self.low_hand = low_hand
        self.high_rank_key = high_rank_key
        self.low_rank_key = low_rank_key
        self.can_win_low = can_win_low
        self.can_win_high = can_win_high
        self.best_high_cards = best_high_cards
        self.best_low_cards = best_low_cards
    
    @property
    def has_low(self) -> bool:
        """Whether a valid low hand exists"""
        raise NotImplementedError("Stub - failing test")
    
    def __str__(self):
        raise NotImplementedError("Stub - failing test")


class OmahaHiLoEvaluator:
    """Evaluate Omaha Hi/Lo (8-or-better) hands"""
    
    def __init__(self):
        pass
    
    def evaluate(self, hole_cards: List[Card], board: List[Card]) -> OmahaHiLoResult:
        """
        Evaluate Omaha Hi/Lo hand.
        
        Args:
            hole_cards: 4 hole cards (must use exactly 2)
            board: 5 board cards (must use exactly 3)
            
        Returns:
            OmahaHiLoResult with high and low hands
        """
        raise NotImplementedError("Stub - failing test")
    
    def evaluate_high(self, hole_and_board: List[Card]) -> Hand:
        """
        Find the best HIGH hand from all 9 cards.
        Must use exactly 2 hole cards + 3 board cards.
        """
        raise NotImplementedError("Stub - failing test")
    
    def evaluate_low(self, hole_and_board: List[Card]) -> Optional[Tuple[List[Card], Tuple]]:
        """
        Find the best LOW hand (8-or-better).
        Must be exactly 5 cards, all rank 8 or lower.
        A-2-3-4-5 is the nut low (wheel).
        
        Returns:
            Tuple of (cards, rank_key) or None if no low qualifies
        """
        raise NotImplementedError("Stub - failing test")
    
    def can_make_low(self, cards: List[Card]) -> bool:
        """Check if 5 cards can make a valid low hand (8-or-better)"""
        raise NotImplementedError("Stub - failing test")
    
    def split_pot(self, results: List[OmahaHiLoResult]) -> List[Tuple[float, float]]:
        """
        Split pot among players based on high/low results.
        
        Returns:
            List of (high_share, low_share) for each player
        """
        raise NotImplementedError("Stub - failing test")


def omaha_hi_lo_rank_key(low_cards: List[Card]) -> Tuple:
    """
    Create a comparable key for low hand ranking.
    For low hands, LOWER is better (A-2-3-4-5 is best).
    Ace counts as 1 in low (not 14).
    """
    raise NotImplementedError("Stub - failing test")
