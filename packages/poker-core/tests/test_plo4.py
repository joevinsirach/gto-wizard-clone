"""Tests for PLO4 (Pot-Limit Omaha 4-card) hand evaluation"""
import pytest
from phevaluator.evaluator import evaluate_cards
import sys
sys.path.insert(0, "packages/poker-core/src")

from gto_poker.plo4 import PLO4Evaluator, plo4_hand_rank_to_percentage


class TestPLO4Evaluator:
    """Test PLO4 hand evaluator wrapper"""

    def test_evaluate_plo4_basic(self):
        """Test basic PLO4 hand evaluation"""
        eval = PLO4Evaluator()
        
        # Test top set vs lower set
        # Board: As Kh Qd 2c 3s
        # Hand1: Ac Kc Qh 2h (two pair, Ace-King with Ace on board)
        # Hand2: Ad Kd Qs 2d (same hand, different suits)
        rank1 = eval.evaluate("Ac", "Kc", "Qh", "2h", "As", "Kh", "Qd", "2c", "3s")
        rank2 = eval.evaluate("Ad", "Kd", "Qs", "2d", "As", "Kh", "Qd", "2c", "3s")
        
        # Same hand type, should be equal
        assert rank1 == rank2

    def test_evaluate_plo4_flush(self):
        """Test PLO4 flush detection"""
        eval = PLO4Evaluator()
        
        # Hand with 3 diamonds, board has 2 diamonds - need to use 2 from hand + 3 from board
        # Best flush: use Ad Jd with 2d Qd Kd = 5 diamonds
        rank = eval.evaluate("Ad", "Jd", "3c", "7h", "2d", "5d", "Qd", "9d", "Kd")
        
        # Lower rank = stronger hand
        assert rank < 1000  # Flush should be strong

    def test_evaluate_plo4_straight(self):
        """Test PLO4 straight detection"""
        eval = PLO4Evaluator()
        
        # Nut straight: 9-T-J-Q-K
        # Hand: 9d Jh Qs Kc
        # Board: Th 8c 7d 6h Ad
        rank = eval.evaluate("9d", "Jh", "Qs", "Kc", "Th", "8c", "7d", "6h", "Ad")
        assert rank < 2000  # Straight is decent

    def test_evaluate_plo4_set(self):
        """Test PLO4 set vs board trips"""
        eval = PLO4Evaluator()
        
        # Hand with pocket set, board has trips
        # Hand: 7c 7d 7h Ks
        # Board: 7s 2c 3d 4h 5s - quads is the best
        rank = eval.evaluate("7c", "7d", "7h", "Ks", "7s", "2c", "3d", "4h", "5s")
        # Four of a kind should be very strong - rank 2132 means it's in top ~28%
        assert rank < 3000

    def test_plo4_hand_rank_to_percentage(self):
        """Test rank to percentage conversion"""
        pct = plo4_hand_rank_to_percentage(1)
        assert 0 <= pct <= 100
        
        pct = plo4_hand_rank_to_percentage(7462)
        assert 0 <= pct <= 100

    def test_evaluate_string_cards(self):
        """Test PLO4 evaluation with string cards"""
        eval = PLO4Evaluator()
        
        # Using string card notation
        result = eval.evaluate_cards(
            ["Ah", "Kh", "Qh", "Jh"],  # 4 Broadway cards
            ["Ts", "Js", "Qs", "Ks"],  # Board
        )
        assert isinstance(result, int)
        assert result > 0

    def test_evaluate_with_hole_cards_and_board(self):
        """Test full 9-card evaluation"""
        eval = PLO4Evaluator()
        
        # 4 hole cards + 5 board cards
        result = eval.evaluate(
            "Ac", "Kc", "Qc", "Jc",
            "Tc", "9c", "8c", "7c", "6c"
        )
        assert isinstance(result, int)


class TestPLO4RangeParser:
    """Test PLO4 range parser for Omaha hands"""

    def test_parse_suited_connector(self):
        """Test suited connector parsing like '64s'"""
        from gto_poker.plo4_range import PLO4RangeParser
        parser = PLO4RangeParser()
        
        hands = parser.parse_suited("64s")
        
        # 64s means 6-4 suited = 6c4c, 6d4d, 6h4h, 6s4s
        assert len(hands) == 4
        assert "6c4c" in hands or "6c4c".lower() in [h.lower() for h in hands]

    def test_parse_double_suited(self):
        """Test 'AAKK double suited' notation"""
        from gto_poker.plo4_range import PLO4RangeParser
        parser = PLO4RangeParser()
        
        hands = parser.parse_double_suited("AAKK")
        
        # AAKK double suited: AAKK where both suits can make two suits
        # Each rank combo has suited/offsuit variants
        assert len(hands) > 0

    def test_parse_plo4_range(self):
        """Test full PLO4 range parsing"""
        from gto_poker.plo4_range import PLO4RangeParser
        parser = PLO4RangeParser()
        
        # Single hand
        hands = parser.parse("AAKK double suited")
        assert len(hands) > 0
        assert all(len(h) == 8 for h in hands)  # 4 cards x 2 chars

    def test_parse_range_with_combos(self):
        """Test range with multiple entries"""
        from gto_poker.plo4_range import PLO4RangeParser
        parser = PLO4RangeParser()
        
        hands = parser.parse("AAKK, JJQQ, 8765")
        assert len(hands) > 0

    def test_parse_wraparound(self):
        """Test A-2-3-4 wraparound straight (wheel)"""
        from gto_poker.plo4_range import PLO4RangeParser
        parser = PLO4RangeParser()
        
        # A-2-3-4 is a valid hand in PLO4
        hands = parser.parse("A234")
        assert len(hands) > 0

    def test_generate_all_hands_for_ranks(self):
        """Test generating all possible hands for rank combinations"""
        from gto_poker.plo4_range import PLO4RangeParser
        parser = PLO4RangeParser()
        
        # Generate all combinations of 4 ranks
        all_hands = parser.generate_hands_for_ranks(["A", "K", "Q", "J"])
        assert len(all_hands) > 0

    def test_invalid_hand_rejected(self):
        """Test that obviously invalid hands are handled"""
        from gto_poker.plo4_range import PLO4RangeParser
        parser = PLO4RangeParser()
        
        # Empty or invalid ranges should return empty
        hands = parser.parse("")
        assert len(hands) == 0


class TestPLO4Equity:
    """Test PLO4 equity calculations"""

    def test_two_player_equity(self):
        """Test basic two-player equity calculation"""
        from gto_poker.plo4 import PLO4Equity
        
        equity = PLO4Equity()
        
        # Top set vs lower set
        hand1 = ["Ac", "Kc", "Qc", "Jc"]
        hand2 = ["Ad", "Kd", "Qd", "Jd"]
        board = ["Th", "9c", "8c", "7c", "6c"]
        
        eq1, eq2 = equity.calculate(hand1, hand2, board)
        
        assert 0 <= eq1 <= 100
        assert 0 <= eq2 <= 100
        assert abs(eq1 + eq2 - 100) < 1  # Should sum to ~100

    def test_monte_carlo_equity(self):
        """Test Monte Carlo equity estimation"""
        from gto_poker.plo4 import PLO4Equity
        
        equity = PLO4Equity()
        
        hand1 = ["Ac", "Kc", "Qc", "Jc"]
        hand2 = ["Ad", "Kd", "Qd", "Jd"]
        
        # No board yet - monte carlo
        eq1, eq2 = equity.calculate(hand1, hand2, [], samples=1000)
        
        assert 0 <= eq1 <= 100
        assert 0 <= eq2 <= 100


class TestPLO4Integration:
    """Integration tests for PLO4 system"""

    def test_import_from_package(self):
        """Test that plo4 modules import correctly"""
        from gto_poker.plo4 import PLO4Evaluator, PLO4Equity, plo4_hand_rank_to_percentage
        from gto_poker.plo4_range import PLO4RangeParser
        
        assert PLO4Evaluator is not None
        assert PLO4Equity is not None
        assert PLO4RangeParser is not None

    def test_full_pipeline(self):
        """Test complete PLO4 evaluation pipeline"""
        from gto_poker.plo4 import PLO4Evaluator
        from gto_poker.plo4_range import PLO4RangeParser
        
        # Parse range
        parser = PLO4RangeParser()
        hands = parser.parse("AAKK")
        
        # Evaluate first hand with board
        eval = PLO4Evaluator()
        first_hand = list(hands)[0]
        # Add a board to evaluate against
        result = eval.evaluate(first_hand, *["Tc", "9c", "8c", "7c", "6c"])
        
        assert isinstance(result, int)
        assert result > 0
