"""Equity calculation — Monte Carlo and exact enumeration"""

from typing import List, Tuple, Dict, Optional, Set
import numpy as np
from concurrent.futures import ThreadPoolExecutor
from itertools import product, combinations
from .deck import Deck, Card, RANKS, SUITS
from .hand import Hand
from .range import RangeParser

# Try to import Numba for JIT acceleration
try:
    from numba import jit
    HAS_NUMBA = True
except ImportError:
    HAS_NUMBA = False
    # Create a no-op decorator
    def jit(*args, **kwargs):
        def decorator(func):
            return func
        return decorator if args and callable(args[0]) else lambda f: f


def _fast_hand_compare(cards1: List[int], cards2: List[int]) -> int:
    """
    Fast hand comparison using integer card indices.
    Returns: 1 if hand1 wins, -1 if hand2 wins, 0 if tie.
    Uses numba JIT if available.
    """
    # Sort cards by rank for easier evaluation
    ranks1 = sorted([c % 13 for c in cards1], reverse=True)
    ranks2 = sorted([c % 13 for c in cards2], reverse=True)
    suits1 = [c // 13 for c in cards1]
    suits2 = [c // 13 for c in cards2]
    
    # Count ranks
    from collections import Counter
    rank_counts1 = Counter(ranks1)
    rank_counts2 = Counter(ranks2)
    
    # Hand types
    def hand_type(rc):
        sorted_counts = sorted(rc.values(), reverse=True)
        if sorted_counts == [4, 1]:
            return 8  # Four of a kind
        elif sorted_counts == [3, 2]:
            return 7  # Full house
        elif sorted_counts == [3, 1, 1]:
            return 4  # Three of a kind
        elif sorted_counts == [2, 2, 1]:
            return 3  # Two pair
        elif sorted_counts == [2, 1, 1, 1]:
            return 2  # One pair
        else:
            return 1  # High card
    
    type1 = hand_type(rank_counts1)
    type2 = hand_type(rank_counts2)
    
    if type1 != type2:
        return 1 if type1 > type2 else -1
    
    # Compare by hand type specific rules
    if type1 == 8:  # Four of a kind
        quad1 = max(rc for rc, cnt in rank_counts1.items() if cnt == 4)
        quad2 = max(rc for rc, cnt in rank_counts2.items() if cnt == 4)
        if quad1 != quad2:
            return 1 if quad1 > quad2 else -1
        kick1 = max(r for r, c in rank_counts1.items() if c == 1)
        kick2 = max(r for r, c in rank_counts2.items() if c == 1)
        return 1 if kick1 > kick2 else (-1 if kick1 < kick2 else 0)
    
    elif type1 == 7:  # Full house
        trip1 = max(rc for rc, cnt in rank_counts1.items() if cnt == 3)
        trip2 = max(rc for rc, cnt in rank_counts2.items() if cnt == 3)
        if trip1 != trip2:
            return 1 if trip1 > trip2 else -1
        pair1 = max(rc for rc, cnt in rank_counts1.items() if cnt == 2)
        pair2 = max(rc for rc, cnt in rank_counts2.items() if cnt == 2)
        return 1 if pair1 > pair2 else (-1 if pair1 < pair2 else 0)
    
    elif type1 == 6:  # Flush
        # All same suit - compare highest to lowest
        for i in range(4):
            if ranks1[i] != ranks2[i]:
                return 1 if ranks1[i] > ranks2[i] else -1
        return 0
    
    elif type1 == 5:  # Straight
        straight1 = max(ranks1)
        straight2 = max(ranks2)
        return 1 if straight1 > straight2 else (-1 if straight1 < straight2 else 0)
    
    elif type1 == 4:  # Three of a kind
        trip1 = max(rc for rc, cnt in rank_counts1.items() if cnt == 3)
        trip2 = max(rc for rc, cnt in rank_counts2.items() if cnt == 3)
        if trip1 != trip2:
            return 1 if trip1 > trip2 else -1
        kick1 = sorted([r for r, c in rank_counts1.items() if c == 1], reverse=True)
        kick2 = sorted([r for r, c in rank_counts2.items() if c == 1], reverse=True)
        for k1, k2 in zip(kick1, kick2):
            if k1 != k2:
                return 1 if k1 > k2 else -1
        return 0
    
    elif type1 == 3:  # Two pair
        pairs1 = sorted([rc for rc, cnt in rank_counts1.items() if cnt == 2], reverse=True)
        pairs2 = sorted([rc for rc, cnt in rank_counts2.items() if cnt == 2], reverse=True)
        if pairs1 != pairs2:
            return 1 if pairs1 > pairs2 else -1
        kick1 = max(r for r, c in rank_counts1.items() if c == 1)
        kick2 = max(r for r, c in rank_counts2.items() if c == 1)
        return 1 if kick1 > kick2 else (-1 if kick1 < kick2 else 0)
    
    elif type1 == 2:  # One pair
        pair1 = max(rc for rc, cnt in rank_counts1.items() if cnt == 2)
        pair2 = max(rc for rc, cnt in rank_counts2.items() if cnt == 2)
        if pair1 != pair2:
            return 1 if pair1 > pair2 else -1
        kick1 = sorted([r for r, c in rank_counts1.items() if c == 1], reverse=True)
        kick2 = sorted([r for r, c in rank_counts2.items() if c == 1], reverse=True)
        for k1, k2 in zip(kick1, kick2):
            if k1 != k2:
                return 1 if k1 > k2 else -1
        return 0
    
    else:  # High card
        for i in range(5):
            if ranks1[i] != ranks2[i]:
                return 1 if ranks1[i] > ranks2[i] else -1
        return 0


if HAS_NUMBA:
    _fast_hand_compare_jit = jit(nopython=True)(_fast_hand_compare)
else:
    _fast_hand_compare_jit = _fast_hand_compare


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
        self._range_parser = RangeParser()
    
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
        
        combos = []
        for combo in combinations(deck._cards, n_cards):
            combos.append(list(combo))
        return combos
    
    def _hand_to_index(self, hand: List[Card]) -> int:
        """Convert hand to integer representation for hashing"""
        return sum(c.index * (52 ** i) for i, c in enumerate(sorted(hand, key=lambda x: x.index)))
    
    def _get_villain_combos(self, villain_range: List[str]) -> List[Tuple[Card, Card]]:
        """Get all specific villain hand combinations from a range"""
        all_combos = []
        seen = set()
        
        for hand_str in villain_range:
            # Get all 4-char combos for this hand
            combos = self._range_parser.get_all_combos(hand_str)
            for combo_str in combos:
                if combo_str not in seen:
                    seen.add(combo_str)
                    try:
                        c1 = Card(combo_str[0], combo_str[1])
                        c2 = Card(combo_str[2], combo_str[3])
                        all_combos.append((c1, c2))
                    except ValueError:
                        continue
        
        return all_combos
    
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
        iterations: int = 50000,
        n_threads: int = 4
    ) -> float:
        """
        Calculate equity of hand vs a range of opponent hands.
        Properly enumerates all villain combos and compares against each.
        """
        import random
        random.seed(self.seed)
        
        board = board or []
        needed = 5 - len(board)
        
        # Get all villain combos from range
        villain_combos = self._get_villain_combos(villain_range)
        if not villain_combos:
            return 0.0
        
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
            
            # Evaluate against all villain combos
            villain_wins = 0
            villain_losses = 0
            
            for v_cards in villain_combos:
                villain_hand = Hand(list(v_cards) + full_board)
                result = hero_hand.compare_to(villain_hand)
                
                if result > 0:
                    villain_losses += 1
                elif result < 0:
                    villain_wins += 1
                    break  # Hero loses, no need to check more
            
            if villain_wins == 0 and villain_losses < len(villain_combos):
                # Either hero won vs all or tied
                if villain_losses == 0:
                    ties += len(villain_combos)  # Tied vs all
                else:
                    wins += 1
            elif villain_wins > 0:
                # Hero lost against at least one combo
                pass  # Already counted as loss
            total += 1
        
        # Calculate equity as average win/tie rate per villain combo
        return (wins + ties * 0.5) / total if total > 0 else 0.0
    
    def equity_vs_range_multiway(
        self,
        hero_cards: List[Card],
        villain_ranges: List[List[str]],
        board: List[Card] = None,
        iterations: int = 50000,
        n_threads: int = 4
    ) -> float:
        """
        Calculate equity of hand vs multiple opponent ranges (3+ players).
        
        Args:
            hero_cards: Hero's hole cards
            villain_ranges: List of range strings, one per opponent
            board: Community cards (optional)
            iterations: Number of Monte Carlo iterations
            n_threads: Number of parallel threads
        
        Returns:
            Equity as a float (0 to 1)
        """
        import random
        random.seed(self.seed)
        
        board = board or []
        needed = 5 - len(board)
        
        # Get all combos for each villain
        all_villain_combos = []
        for vrange in villain_ranges:
            combos = self._get_villain_combos(vrange)
            if not combos:
                return 0.0
            all_villain_combos.append(combos)
        
        def run_simulations(iterations: int, seed: int) -> Tuple[int, int, int]:
            random.seed(seed)
            wins = 0
            ties = 0
            total = 0
            
            exclude_set = set(hero_cards + board)
            remaining_cards = [c for c in Deck()._cards if c not in exclude_set]
            
            for _ in range(iterations):
                sampled = random.sample(remaining_cards, needed)
                full_board = board + sampled
                hero_hand = Hand(hero_cards + full_board)
                
                # Sample one random combo from each villain's range
                villain_hands = []
                for combos in all_villain_combos:
                    v_cards = random.choice(combos)
                    villain_hands.append(Hand(list(v_cards) + full_board))
                
                # Compare hero to all villains
                hero_wins = True
                is_tie = True
                
                for v_hand in villain_hands:
                    result = hero_hand.compare_to(v_hand)
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
            futures = [executor.submit(run_simulations, chunk_size, seeds[i]) for i in range(n_threads)]
            results = [f.result() for f in futures]
        
        total_wins = sum(r[0] for r in results)
        total_ties = sum(r[1] for r in results)
        total = sum(r[2] for r in results)
        
        equity = (total_wins + total_ties * 0.5) / total if total > 0 else 0.0
        
        return equity
    
    def calculate_equity_from_range(
        self,
        hero_range: str,
        villain_range: str,
        board: List[Card] = None,
        iterations: int = 10000,
        n_threads: int = 4
    ) -> Dict[str, float]:
        """
        Calculate equity for each hand in hero_range vs villain_range.
        
        Args:
            hero_range: Range string for hero (e.g., 'AA, KK, AKs')
            villain_range: Range string for villain
            board: Community cards (optional)
            iterations: Number of Monte Carlo iterations per hand
            n_threads: Number of parallel threads
        
        Returns:
            Dict mapping each hero combo string to its equity
        """
        import random
        
        board = board or []
        needed = 5 - len(board)
        
        # Get all hero combos and villain combos
        hero_combos = self._range_parser.get_all_combos(hero_range)
        villain_combos = self._get_villain_combos(villain_range.split(',')) if isinstance(villain_range, str) else self._get_villain_combos(villain_range)
        
        if not hero_combos or not villain_combos:
            return {}
        
        results = {}
        
        def eval_single_hand(hero_combo_str: str, iterations: int, seed: int) -> Tuple[str, float]:
            random.seed(seed)
            
            try:
                c1 = Card(hero_combo_str[0], hero_combo_str[1])
                c2 = Card(hero_combo_str[2], hero_combo_str[3])
                hero_cards = [c1, c2]
            except ValueError:
                return hero_combo_str, 0.0
            
            wins = 0
            ties = 0
            total = 0
            
            exclude_set = set(hero_cards + board)
            remaining_cards = [c for c in Deck()._cards if c not in exclude_set]
            
            for _ in range(iterations):
                sampled = random.sample(remaining_cards, needed)
                full_board = board + sampled
                hero_hand = Hand(hero_cards + full_board)
                
                # Evaluate against all villain combos
                villain_wins = 0
                villain_losses = 0
                n_villain_combos = len(villain_combos)
                
                for v_cards in villain_combos:
                    villain_hand = Hand(list(v_cards) + full_board)
                    result = hero_hand.compare_to(villain_hand)
                    
                    if result > 0:
                        villain_losses += 1
                    elif result < 0:
                        villain_wins += 1
                        break
                
                if villain_wins == 0:
                    if villain_losses == 0:
                        ties += n_villain_combos
                    else:
                        wins += 1
                total += 1
            
            equity = (wins + ties * 0.5) / total if total > 0 else 0.0
            return hero_combo_str, equity
        
        # Parallel evaluation
        chunk_size = max(1, len(hero_combos) // n_threads)
        
        with ThreadPoolExecutor(max_workers=n_threads) as executor:
            futures = []
            for i, hero_combo in enumerate(hero_combos):
                seed = (self.seed + i) if self.seed is not None else None
                futures.append(executor.submit(eval_single_hand, hero_combo, iterations, seed))
            
            for future in futures:
                combo_str, equity = future.result()
                results[combo_str] = equity
        
        return results
    
    def calculate_equity_exact_vs_range(
        self,
        hero_cards: List[Card],
        villain_range: List[str],
        board: List[Card] = None,
        dead_cards: List[Card] = None
    ) -> float:
        """
        Exactly calculate equity by enumerating all possible remaining cards
        and comparing against all villain combos.
        Only works when remaining cards are few.
        """
        board = board or []
        dead_cards = dead_cards or []
        remaining = 5 - len(board)
        
        if remaining > 5:
            raise ValueError(f"Too many cards remaining: {remaining}")
        
        # Get all villain combos
        villain_combos = self._get_villain_combos(villain_range)
        if not villain_combos:
            return 0.0
        
        # Create deck without hero, villain, board, dead cards
        exclude = dead_cards + hero_cards + board
        deck_cards = [c for c in Deck()._cards if c not in exclude]
        
        wins = 0
        ties = 0
        total = 0
        
        hero_full = hero_cards + board
        
        if remaining == 0:
            # River - evaluate immediately
            hero_hand = Hand(hero_full)
            for v_cards in villain_combos:
                villain_hand = Hand(list(v_cards) + board)
                result = hero_hand.compare_to(villain_hand)
                if result > 0:
                    wins += 1
                elif result == 0:
                    ties += 1
                total += 1
        elif remaining == 1:
            # Turn card
            for turn_card in combinations(deck_cards, 1):
                full_board = board + list(turn_card)
                hero_hand = Hand(hero_full + list(turn_card))
                
                for v_cards in villain_combos:
                    villain_hand = Hand(list(v_cards) + full_board)
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
                
                for v_cards in villain_combos:
                    villain_hand = Hand(list(v_cards) + full_board)
                    result = hero_hand.compare_to(villain_hand)
                    if result > 0:
                        wins += 1
                    elif result == 0:
                        ties += 1
                    total += 1
        
        return (wins + ties * 0.5) / total if total > 0 else 0.0
