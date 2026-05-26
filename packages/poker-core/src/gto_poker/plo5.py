"""PLO5 (5-card Omaha) hand evaluation module

Uses HenryRLee/PokerHandEvaluator under the hood. In PLO5, players receive
5 hole cards and must use exactly 2 of them combined with exactly 3 board
cards to make the best 5-card poker hand.
"""
from typing import List, Tuple, Optional
from itertools import combinations
import sys

# Add phevaluator to path
sys.path.insert(0, "/tmp/PokerHandEvaluator/python")
from phevaluator.evaluator import evaluate_cards

from .deck import Card, RANKS, SUITS


def plo5_hand_rank_to_percentage(rank: int, total: int = 7462) -> float:
    """
    Convert a hand rank to a percentage (0-100).
    
    In 7-card poker there are 7462 distinct hand ranks (Cactus Kev's system).
    A rank of 1 is the best (royal flush), 7462 is the worst (high card).
    
    Args:
        rank: Hand rank from evaluate_cards (lower is better)
        total: Total possible hand ranks (7462 for 7-card)
    
    Returns:
        Percentage from 0 (best) to 100 (worst)
    """
    return (rank / total) * 100


class PLO5Evaluator:
    """
    Wrapper for evaluating PLO5 (5-card Omaha) hands.
    
    In PLO5:
    - Each player receives 5 hole cards
    - Board has 5 cards
    - Player must use exactly 2 hole cards + 3 board cards
    - There are 100 combinations (C(5,2) * C(5,3)) to evaluate
    """
    
    def __init__(self):
        self._cache = {}
    
    def evaluate(self, *cards) -> int:
        """
        Evaluate a PLO5 hand.
        
        Args:
            *cards: 10 cards total as separate arguments OR 
                    a single string like "AhKhQhJhTc9c8c7c6c5c"
                    OR hole cards as first arg + board as second (both lists/strings)
        
        Returns:
            Hand rank (lower is better, 1 = best)
        """
        # TODO: Implement PLO5 evaluation
        raise NotImplementedError("PLO5 evaluation not yet implemented")
    
    def _evaluate(self, hole: List[str], board: List[str]) -> int:
        """Internal evaluation with separated hole and board cards."""
        # TODO: Implement PLO5 evaluation logic
        # C(5,2) = 10 combinations of hole cards to use
        # C(5,3) = 10 combinations of board cards to use
        # Total 100 combinations to evaluate
        raise NotImplementedError("PLO5 evaluation not yet implemented")
    
    def _parse_hand_string(self, hand_str: str) -> List[str]:
        """Parse a hand string like 'AhKhQhJhTc9c8c7c6c5c' into card list."""
        cards = []
        hand_str = hand_str.lower()
        i = 0
        while i < len(hand_str):
            if i + 1 < len(hand_str):
                rank = hand_str[i].upper()  # Convert rank to uppercase
                suit = hand_str[i + 1]
                card = rank + suit
                if rank in RANKS and suit in SUITS:
                    cards.append(card)
                    i += 2
                else:
                    i += 1
            else:
                break
        return cards
    
    def evaluate_cards(self, hole: List[str], board: List[str]) -> int:
        """
        Evaluate with explicit hole and board lists.
        
        Args:
            hole: List of 5 hole card strings
            board: List of 5 board card strings
        
        Returns:
            Hand rank (lower is better)
        """
        # TODO: Implement PLO5 evaluation
        raise NotImplementedError("PLO5 evaluation not yet implemented")


class PLO5Equity:
    """
    PLO5 equity calculator using Monte Carlo simulation.
    
    Calculates winning probability for one hand vs another by
    enumerating all possible board combinations.
    """
    
    def __init__(self, seed: Optional[int] = None):
        self._eval = PLO5Evaluator()
        self._cache = {}
        # Import random for monte carlo
        import random
        self._random = random.Random(seed)
    
    def calculate(
        self,
        hand1: List[str],
        hand2: List[str],
        board: List[str],
        samples: int = 10000,
    ) -> Tuple[float, float]:
        """
        Calculate equity for two PLO5 hands.
        
        Args:
            hand1: First player's 5 hole cards
            hand2: Second player's 5 hole cards
            board: Known board cards (0-5), empty list for monte carlo
            samples: Number of simulations for monte carlo
        
        Returns:
            Tuple of (equity1, equity2) as percentages
        """
        # TODO: Implement PLO5 equity calculation
        raise NotImplementedError("PLO5 equity not yet implemented")
    
    def _exact_equity(
        self,
        hand1: List[str],
        hand2: List[str],
        board: List[str],
    ) -> Tuple[float, float]:
        """Exact equity when 5 board cards are known."""
        # TODO: Implement exact equity for PLO5
        raise NotImplementedError("PLO5 equity not yet implemented")
    
    def _monte_carlo(
        self,
        hand1: List[str],
        hand2: List[str],
        samples: int,
    ) -> Tuple[float, float]:
        """Monte Carlo equity estimation."""
        # TODO: Implement Monte Carlo for PLO5
        raise NotImplementedError("PLO5 equity not yet implemented")
    
    def _partial_board_equity(
        self,
        hand1: List[str],
        hand2: List[str],
        board: List[str],
        samples: int,
    ) -> Tuple[float, float]:
        """Monte Carlo for partial board (1-4 known cards)."""
        # TODO: Implement partial board equity for PLO5
        raise NotImplementedError("PLO5 equity not yet implemented")


__all__ = ["PLO5Evaluator", "PLO5Equity", "plo5_hand_rank_to_percentage"]