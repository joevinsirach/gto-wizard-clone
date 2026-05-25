"""Equity calculation — Monte Carlo and exact enumeration"""

from typing import List, Tuple, Dict, Optional
import numpy as np
from concurrent.futures import ThreadPoolExecutor
from .deck import Deck, Card
from .hand import Hand


class EquityCalculator:
    """
    Calculate poker equity via enumeration or Monte Carlo.
    
    Usage:
        calc = EquityCalculator()
        equity = calc.calculate_equity(
            hero_hands=[Card('A', 'h'), Card('K', 'h')],
            villain_range=['AA', 'KK', 'QQ'],
            board=[Card('K', 'd'), Card('7', 'h'), Card('2', 'c')],
            iterations=10000
        )
    """
    
    def __init__(self, seed: Optional[int] = None):
        self.seed = seed
    
    def _parse_hand(self, hand_str: str) -> List[Card]:
        """Parse hand string like 'AKs' or 'AhKh' into Cards"""
        if len(hand_str) == 2:
            # Short form: 'AKs' -> Ah Kh
            rank1, rank2 = hand_str[0], hand_str[1]
            suited = hand_str[-1] == 's'
            # For simplicity, use hearts for first card, diamonds for second
            card1 = Card(rank1, 'h')
            card2 = Card(rank2, 'd' if not suited else 'h')
            return [card1, card2]
        elif len(hand_str) == 4:
            return [Card(hand_str[0], hand_str[1]), Card(hand_str[2], hand_str[3])]
        raise ValueError(f"Invalid hand string: {hand_str}")
    
    def _enumerate_hands(self, n_cards: int, exclude: List[Card] = None) -> List[List[Card]]:
        """Enumerate all possible n-card combinations"""
        deck = Deck()
        if exclude:
            for c in exclude:
                deck._cards = [d for d in deck._cards if d != c]
        
        from itertools import combinations
        combos = []
        for combo in combinations(deck._cards, n_cards):
            combos.append(list(combo))
        return combos
    
    def _hand_to_index(self, hand: List[Card]) -> int:
        """Convert hand to integer representation for hashing"""
        return sum(c.index * (52 ** i) for i, c in enumerate(sorted(hand, key=lambda x: x.index)))
    
    def calculate_equity_exact(
        self,
        hero_cards: List[Card],
        villain_cards: List[Card],
        board: List[Card],
        dead_cards: List[Card] = None
    ) -> float:
        """
        Exactly calculate equity by enumerating all possible remaining cards.
        Only works when remaining cards are few (e.g., river: 0 cards left, turn: 1 card).
        """
        remaining = 5 - len(board)  # cards to come
        if remaining > 5:
            raise ValueError(f"Too many cards remaining: {remaining}")
        
        # Create deck without hero, villain, board, dead cards
        exclude = (dead_cards or []) + hero_cards + villain_cards + board
        deck_cards = [c for c in Deck()._cards if c not in exclude]
        
        if len(deck_cards) == 0:
            # No cards to come, evaluate now
            hero_hand = Hand(hero_cards + board)
            villain_hand = Hand(villain_cards + board)
            result = hero_hand.compare_to(villain_hand)
            return 1.0 if result > 0 else (0.5 if result == 0 else 0.0)
        
        from itertools import combinations
        
        wins = 0
        ties = 0
        total = 0
        
        hero_full = hero_cards + board
        villain_full = villain_cards + board
        
        if remaining == 1:
            # Turn card
            for turn_card in combinations(deck_cards, 1):
                full_board = board + list(turn_card)
                hero_hand = Hand(hero_full + list(turn_card))
                villain_hand = Hand(villain_full + list(turn_card))
                result = hero_hand.compare_to(villain_hand)
                if result > 0:
                    wins += 1
                elif result == 0:
                    ties += 1
                total += 1
        else:
            # Flop (2 cards) or pre-flop (5 cards)
            for remaining_cards in combinations(deck_cards, remaining):
                full_board = board + list(remaining_cards)
                hero_hand = Hand(hero_full + list(remaining_cards))
                villain_hand = Hand(villain_full + list(remaining_cards))
                result = hero_hand.compare_to(villain_hand)
                if result > 0:
                    wins += 1
                elif result == 0:
                    ties += 1
                total += 1
        
        return (wins + ties * 0.5) / total if total > 0 else 0.0
    
    def calculate_equity_monte_carlo(
        self,
        hero_cards: List[Card],
        villain_cards: List[Card],
        board: List[Card] = None,
        hero_range: List[str] = None,
        villain_range: List[str] = None,
        iterations: int = 10000,
        n_villains: int = 1,
        dead_cards: List[Card] = None,
        n_threads: int = 4
    ) -> Dict[str, float]:
        """
        Monte Carlo equity calculation.
        
        Returns dict with equity for each hero hand in hero_range,
        or single 'equity' key if hero_cards provided directly.
        """
        import random
        
        board = board or []
        dead_cards = dead_cards or []
        
        def run_simulation(iterations: int, seed: int) -> Tuple[int, int, int]:
            random.seed(seed)
            wins = 0
            ties = 0
            total = 0
            
            exclude_set = set(hero_cards + villain_cards + board + dead_cards)
            remaining_cards = [c for c in Deck()._cards if c not in exclude_set]
            
            needed = 5 - len(board)  # cards to come
            
            for _ in range(iterations):
                # Sample remaining cards
                sampled = random.sample(remaining_cards, needed)
                full_board = board + sampled
                
                hero_hand = Hand(hero_cards + full_board)
                
                # Track ties separately for multi-way
                hero_wins = True
                is_tie = True
                
                for v in range(n_villains):
                    v_cards = villain_cards  # Simplified: use fixed villain cards
                    villain_hand = Hand(v_cards + full_board)
                    result = hero_hand.compare_to(villain_hand)
                    
                    if result < 0:
                        hero_wins = False
                        is_tie = False
                        break
                    elif result > 0:
                        is_tie = False
                
                if hero_wins:
                    if is_tie:
                        ties += 1
                    else:
                        wins += 1
                total += 1
            
            return wins, ties, total
        
        # Run in parallel
        chunk_size = iterations // n_threads
        seeds = [None] * n_threads
        if self.seed is not None:
            seeds = [self.seed + i for i in range(n_threads)]
        
        with ThreadPoolExecutor(max_workers=n_threads) as executor:
            futures = [executor.submit(run_simulation, chunk_size, seeds[i]) for i in range(n_threads)]
            results = [f.result() for f in futures]
        
        total_wins = sum(r[0] for r in results)
        total_ties = sum(r[1] for r in results)
        total = sum(r[2] for r in results)
        
        equity = (total_wins + total_ties * 0.5) / total if total > 0 else 0.0
        
        return {"equity": equity, "wins": total_wins, "ties": total_ties, "total": total}
    
    def equity_vs_range(
        self,
        hero_cards: List[Card],
        villain_range: List[str],
        board: List[Card] = None,
        iterations: int = 50000
    ) -> float:
        """Calculate equity of hand vs a range of opponent hands"""
        import random
        random.seed(self.seed)
        
        board = board or []
        needed = 5 - len(board)
        
        # Build all villain combos
        villain_combos = []
        from itertools import product
        for combo in product(RANKS, repeat=2):
            # Skip suited combos not in range, etc.
            pass  # Simplified
        
        # Monte Carlo vs range
        wins = 0
        ties = 0
        total = 0
        
        exclude_set = set(hero_cards + board)
        remaining_cards = [c for c in Deck()._cards if c not in exclude_set]
        
        for _ in range(iterations):
            sampled = random.sample(remaining_cards, needed)
            full_board = board + sampled
            hero_hand = Hand(hero_cards + full_board)
            
            # Sample random villain hand from range
            # (simplified - would need proper range parsing)
            is_tie_all = True
            for _ in range(min(len(villain_range), 10)):  # Sample from range
                v_hand_str = random.choice(villain_range)
                v_cards = self._parse_hand(v_hand_str)
                villain_hand = Hand(v_cards + full_board)
                result = hero_hand.compare_to(villain_hand)
                
                if result < 0:
                    wins -= 1  # No win
                    is_tie_all = False
                    break
                elif result > 0:
                    is_tie_all = False
            
            if is_tie_all:
                ties += 1
            else:
                wins += 1
            total += 1
        
        return (wins + ties * 0.5) / total if total > 0 else 0.0