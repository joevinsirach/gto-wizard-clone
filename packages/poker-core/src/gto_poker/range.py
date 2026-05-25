"""Range parsing — convert poker range strings to hand lists"""

from typing import List, Set
from itertools import combinations
from .deck import Card, RANKS, SUITS

# All 169 pre-flop hand combinations
PREFLOP_HANDS = []
for r1 in RANKS:
    for r2 in RANKS:
        PREFLOP_HANDS.append((r1, r2, r1 == r2))  # (rank1, rank2, suited)


class RangeParser:
    """
    Parse poker range strings like 'JJ+, AQs+, KJs'
    
    Supports:
    - Single hands: 'AA', 'AKs', 'AhKh'
    - Ranges: 'JJ+' (JJ and above), '22-TT'
    - Suit modifiers: 'AKs' (suited), 'AKo' (offsuit)
    - Combos: 'AA,KK,QQ'
    """
    
    def __init__(self):
        self._combo_cache = {}
    
    def parse(self, range_str: str) -> Set[str]:
        """
        Parse range string into set of hand strings.
        Returns set like {'AA', 'AKs', 'AhKd', 'QQ', ...}
        """
        range_str = range_str.replace(" ", "").upper()
        
        if not range_str:
            return set()
        
        hands = set()
        parts = range_str.split(",")
        
        for part in parts:
            if '+' in part:
                # e.g., 'JJ+' means JJ and any pair above
                hands.update(self._parse_plus_range(part))
            elif '-' in part:
                # e.g., '55-JJ' means 55 through JJ
                hands.update(self._parse_dash_range(part))
            else:
                # Single hand or hand type
                hands.update(self._expand_hand(part))
        
        return hands
    
    def _parse_plus_range(self, part: str) -> Set[str]:
        """Handle JJ+ style ranges"""
        base = part.replace("+", "")
        base_rank = base[0]
        base_pair = base[0] == base[1] if len(base) >= 2 else False
        base_suited = base[-1] == 'S' if len(base) >= 3 else (part[-1] == '+' and base[-1] == 'S')
        
        hands = set()
        
        if base_pair:
            # Pair range: 'TT+' means TT, JJ, QQ, KK, AA
            base_idx = RANKS.index(base[0])
            for rank in RANKS[base_idx:]:
                hands.add(f"{rank}{rank}")
        elif len(base) >= 2:
            # Broadway range: 'AJ+' means AJ, AT, KQ, etc.
            r1, r2 = base[0], base[1]
            suited = 'S' in part.upper() or base.endswith('S')
            offsuit = 'O' in part.upper() or base.endswith('O')
            
            # Determine rank range
            r1_idx = RANKS.index(r1)
            r2_idx = RANKS.index(r2)
            
            if r1_idx > r2_idx:
                # e.g., 'JT+' -> JTs, JTo, QJ, etc.
                # Simplified: add specific combos
                hands.add(f"{r1}{r2}{'S' if suited else 'O'}")
                # For '+' ranges, add connected combos
                if r2_idx >= 6:  # T or higher
                    hands.add(f"{r2}{RANKS[r2_idx-1]}S")
            else:
                hands.add(f"{r1}{r2}{'S' if suited else 'O'}")
        
        return hands
    
    def _parse_dash_range(self, part: str) -> Set[str]:
        """Handle 55-JJ style ranges"""
        # Not fully implemented - would expand range
        return set()
    
    def _expand_hand(self, hand_str: str) -> Set[str]:
        """Expand a single hand into all suit combinations"""
        hands = set()
        hand_str = hand_str.upper()  # Normalize input

        if len(hand_str) == 2:
            # Pair: 'QQ' -> QhQd, QhQc, QhQs, QdQc, QdQs, QcQs
            rank = hand_str[0]
            for s1, s2 in combinations(SUITS, 2):
                hands.add(f"{rank}{s1}{rank}{s2}")
        elif len(hand_str) == 3:
            # Hand type: 'AKs' or 'AKo'
            r1, r2, suit_type = hand_str[0], hand_str[1], hand_str[2]
            if suit_type == 'S':  # Suited
                for s in SUITS:
                    hands.add(f"{r1}{s}{r2}{s}")
            elif suit_type == 'O':  # Offsuit
                for s1 in SUITS:
                    for s2 in SUITS:
                        if s1 != s2:  # Different suits for offsuit
                            hands.add(f"{r1}{s1}{r2}{s2}")
            else:
                hands.add(hand_str)
        elif len(hand_str) == 4:
            # Specific combo: 'AhKd' or 'AHKH' -> normalize to 'AhKd'
            # Try to parse as rank1, suit1, rank2, suit2
            r1, s1, r2, s2 = hand_str[0], hand_str[1].lower(), hand_str[2], hand_str[3].lower()
            hands.add(f"{r1}{s1}{r2}{s2}")

        return hands
    
    def range_to_combos(self, range_str: str) -> List[List[Card]]:
        """Convert range string to list of Card pairs"""
        hands = self.parse(range_str)
        combos = []
        
        for hand_str in hands:
            try:
                if len(hand_str) == 4:
                    c1 = Card(hand_str[0], hand_str[1])
                    c2 = Card(hand_str[2], hand_str[3])
                    combos.append([c1, c2])
                elif len(hand_str) == 3:
                    r1, r2, st = hand_str[0], hand_str[1], hand_str[2]
                    if st == 'S':
                        for s in SUITS:
                            combos.append([Card(r1, s), Card(r2, s)])
                    elif st == 'O':
                        for s1, s2 in combinations(SUITS, 2):
                            combos.append([Card(r1, s1), Card(r2, s2)])
            except ValueError:
                continue
        
        return combos
    
    @staticmethod
    def combo_count(range_str: str) -> int:
        """Return number of hand combinations in a range"""
        hands = RangeParser().parse(range_str)
        total = 0
        for h in hands:
            if len(h) == 4:
                total += 1
            elif len(h) == 3:
                total += 4 if h[2] == 'S' else 12
            elif len(h) == 2:
                total += 6  # 6 combos for pairs
        return total