"""Shortdeck (6+ hold'em) hand evaluation.

Shortdeck is a variant where cards 2-5 are removed from the deck (36 cards).
Hand rankings are adjusted: flush beats full house, which beats straight.
"""

from typing import List, Tuple

# Shortdeck ranks: 6, 7, 8, 9, T, J, Q, K, A (ranks 4-12 in standard indexing)
SHORTDECK_RANKS = ["6", "7", "8", "9", "T", "J", "Q", "K", "A"]
SHORTDECK_RANK_ORDER = {r: i for i, r in enumerate(SHORTDECK_RANKS)}

# Shortdeck hand rankings (lower is better / higher index wins)
# 9 = Straight Flush, 8 = Four of a Kind, 7 = Flush, 6 = Full House,
# 5 = Straight, 4 = Three of a Kind, 3 = Two Pair, 2 = One Pair, 1 = High Card
SHORTDECK_HAND_NAMES = {
    9: "Straight Flush",
    8: "Four of a Kind",
    7: "Flush",
    6: "Full House",
    5: "Straight",
    4: "Three of a Kind",
    3: "Two Pair",
    2: "One Pair",
    1: "High Card",
    0: "Invalid"
}


def shortdeck_rank_index(rank: str) -> int:
    """Get rank index in shortdeck (6=0, A=8)"""
    return SHORTDECK_RANK_ORDER[rank]


class ShortdeckHand:
    """Represents a 5-card Shortdeck hand with evaluation.
    
    Shortdeck uses a 36-card deck (6-A) and has different hand rankings:
    - Straight Flush
    - Four of a Kind
    - Flush (beats Full House)
    - Full House (beats Straight)
    - Straight (beats Three of a Kind)
    - Three of a Kind
    - Two Pair
    - One Pair
    - High Card
    """

    def __init__(self, cards: List):
        raise NotImplementedError("ShortdeckHand not yet implemented")

    @staticmethod
    def _evaluate(cards: List) -> Tuple[int, List[int], List[int]]:
        """Evaluate a 5-card Shortdeck hand.
        
        Returns: (hand_type, rank_list, kickers)
        
        Hand types in Shortdeck:
        - Straight Flush: [9, high_rank]
        - Four of a Kind: [8, quad_rank, kicker]
        - Flush: [7, sorted_rank_list]
        - Full House: [6, trips_rank, pair_rank]
        - Straight: [5, high_rank]
        - Three of a Kind: [4, trips_rank, kickers]
        - Two Pair: [3, high_pair, low_pair, kicker]
        - One Pair: [2, pair_rank, kickers]
        - High Card: [1, sorted_ranks]
        """
        raise NotImplementedError("ShortdeckHand._evaluate not yet implemented")

    @property
    def name(self) -> str:
        raise NotImplementedError("ShortdeckHand.name not yet implemented")

    def __str__(self):
        raise NotImplementedError("ShortdeckHand.__str__ not yet implemented")

    def __repr__(self):
        raise NotImplementedError("ShortdeckHand.__repr__ not yet implemented")

    def __lt__(self, other):
        raise NotImplementedError("ShortdeckHand.__lt__ not yet implemented")

    def __gt__(self, other):
        raise NotImplementedError("ShortdeckHand.__gt__ not yet implemented")

    def __eq__(self, other):
        raise NotImplementedError("ShortdeckHand.__eq__ not yet implemented")

    def compare_to(self, other: "ShortdeckHand") -> int:
        raise NotImplementedError("ShortdeckHand.compare_to not yet implemented")


class ShortdeckDeck:
    """Shortdeck 36-card deck (6-A only)"""
    
    def __init__(self):
        raise NotImplementedError("ShortdeckDeck not yet implemented")

    def shuffle(self, seed: int = None):
        raise NotImplementedError("ShortdeckDeck.shuffle not yet implemented")

    def draw(self, n: int = 1):
        raise NotImplementedError("ShortdeckDeck.draw not yet implemented")

    def draw_one(self):
        raise NotImplementedError("ShortdeckDeck.draw_one not yet implemented")

    def reset(self):
        raise NotImplementedError("ShortdeckDeck.reset not yet implemented")

    def __len__(self):
        raise NotImplementedError("ShortdeckDeck.__len__ not yet implemented")

    def __iter__(self):
        raise NotImplementedError("ShortdeckDeck.__iter__ not yet implemented")
