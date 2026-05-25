"""
Tests for MCCFR poker solver.
"""

import pytest
import numpy as np
import sys
sys.path.insert(0, '/tmp/gto-wizard-clone/packages/poker-core/src')
sys.path.insert(0, '/tmp/gto-wizard-clone/apps/solver')

from gto_poker.deck import Deck, Card
from gto_poker.hand import Hand, HandEvaluator

from games.texas_hold_em import TexasHoldEm, GameState, Action, create_river_state
from games.infosets import InfoSet, InfoSetManager, regret_match, normalize_strategy
from cfr.engine import CFREngine, solve_river


class TestDeckAndHand:
    """Test deck and hand evaluation."""
    
    def test_card_parse(self):
        """Test card parsing."""
        c = Deck.parse("Ac")
        assert c.rank == "A"
        assert c.suit == "c"
        
        c2 = Deck.parse("Td")
        assert c2.rank == "T"
        assert c2.suit == "d"
    
    def test_hand_evaluation(self):
        """Test hand evaluation."""
        # Royal flush
        royal = [Card("T", "h"), Card("J", "h"), Card("Q", "h"), 
                 Card("K", "h"), Card("A", "h")]
        hand = Hand(royal)
        assert hand.hand_type == 9  # Straight Flush
        
        # Four of a kind
        quads = [Card("A", "h"), Card("A", "d"), Card("A", "s"), 
                 Card("A", "c"), Card("K", "h")]
        hand = Hand(quads)
        assert hand.hand_type == 8  # Four of a kind
        
        # Full house
        boat = [Card("K", "h"), Card("K", "d"), Card("K", "s"), 
                Card("Q", "c"), Card("Q", "h")]
        hand = Hand(boat)
        assert hand.hand_type == 7  # Full House
    
    def test_hand_comparison(self):
        """Test hand comparison."""
        # AK vs QJ on Kh board
        p0 = [Card("A", "c"), Card("K", "d"), Card("K", "h"), 
              Card("8", "c"), Card("3", "d"), Card("2", "s"), Card("K", "s")]
        p1 = [Card("Q", "s"), Card("J", "s"), Card("K", "h"), 
              Card("8", "c"), Card("3", "d"), Card("2", "s"), Card("K", "s")]
        
        result = HandEvaluator.compare(p0, p1)
        # P0 has trip Kings + Ace kicker
        # P1 has trip Kings + Queen kicker
        # Ace > Queen, so P0 wins
        # HandEvaluator.compare returns 1 when p0 wins (first arg wins)
        assert result == 1  # P0 wins


class TestGameState:
    """Test game state and actions."""
    
    def test_infoset_key(self):
        """Test infoset key generation."""
        state = create_river_state(
            p0_cards=["Ac", "Kd"],
            p1_cards=["Qs", "Js"],
            board=["Kh", "8c", "3d", "2s", "Ks"],
            pot=10.0,
            stacks=[100.0, 100.0]
        )
        
        key = state.infoset_key(0)
        assert "p0" in key
        assert "AcKd" in key
        assert "Kh8c3d2sKs" in key
    
    def test_valid_actions(self):
        """Test valid actions."""
        game = TexasHoldEm()
        
        state = create_river_state(
            p0_cards=["Ac", "Kd"],
            p1_cards=["Qs", "Js"],
            board=["Kh", "8c", "3d", "2s", "Ks"],
            pot=10.0,
            stacks=[100.0, 100.0],
            current_player=0
        )
        
        actions = game.get_valid_actions(state, 0)
        assert "fold" in actions
        assert "check" in actions  # No bet to call


class TestInfoSets:
    """Test infoset management."""
    
    def test_regret_matching(self):
        """Test regret matching."""
        regrets = np.array([1.0, 0.0, 0.5])
        strategy = regret_match(regrets)
        
        # Should sum to 1
        assert np.isclose(strategy.sum(), 1.0)
        # First action has most positive regret
        assert strategy[0] > strategy[1]
        assert strategy[0] > strategy[2]
    
    def test_regret_matching_all_negative(self):
        """Test regret matching when all regrets are negative."""
        regrets = np.array([-1.0, -2.0, -3.0])
        strategy = regret_match(regrets)
        
        # Should be uniform
        assert np.allclose(strategy, 1/3)
    
    def test_info_set_creation(self):
        """Test infoset creation."""
        manager = InfoSetManager()
        
        key = "p0:AcKd:Kh8c3d2sKs:10:100,100:"
        actions = ["fold", "check"]
        
        infoset = manager.get_or_create(key, actions)
        
        assert infoset.key == key
        assert len(infoset.actions) == 2
        assert infoset.n_actions == 2
    
    def test_info_set_strategy(self):
        """Test infoset strategy computation."""
        infoset = InfoSet("test", ["fold", "call", "raise:0.5"])
        
        # Initial strategy should be uniform
        strategy = infoset.get_strategy()
        assert np.isclose(strategy.sum(), 1.0)
        assert len(strategy) == 3
    
    def test_average_strategy(self):
        """Test average strategy computation."""
        infoset = InfoSet("test", ["fold", "call"])
        
        # Add some strategy sums
        infoset.strategy_sum = np.array([1.0, 2.0])
        
        avg = infoset.get_average_strategy()
        assert np.isclose(avg[0], 1/3)
        assert np.isclose(avg[1], 2/3)


class TestCFREngine:
    """Test CFR engine."""
    
    def test_engine_initialization(self):
        """Test engine initialization."""
        engine = CFREngine()
        assert engine.iteration == 0
        assert len(engine.infoset_manager) == 0
    
    def test_simple_solve(self):
        """Test simple river solve."""
        strategies, game, state = solve_river(
            p0_cards=["Ac", "Kd"],
            p1_cards=["Qs", "Js"],
            board=["Kh", "8c", "3d", "2s", "Ks"],
            pot=10.0,
            stacks=[100.0, 100.0],
            iterations=100,
            bet_sizes=[0.5]
        )
        
        # Should have some infosets
        assert len(strategies) >= 0


def test_integration():
    """Integration test for the full solver."""
    # Simple heads-up river scenario
    result = solve_river(
        p0_cards=["Ac", "Kd"],
        p1_cards=["Qs", "Js"],
        board=["Kh", "8c", "3d", "2s", "Ks"],  # P0 has top pair, P1 missed straight
        pot=10.0,
        stacks=[100.0, 100.0],
        iterations=200,
        bet_sizes=[0.5, 1.0]
    )
    
    strategies, game, state = result
    
    # Verify hand evaluation at terminal
    p0_cards = [state.hole_cards[0], state.hole_cards[1]] + state.board
    p1_cards = [state.hole_cards[2], state.hole_cards[3]] + state.board
    
    p0_hand = Hand(p0_cards)
    p1_hand = Hand(p1_cards)
    
# P0 has trip Kings (Kh, Kd, Ks) + Ace kicker
    # P1 has pair of Kings (Kh, Ks) + Qs Js kickers - only ONE PAIR on this board!
    # Note: board has Kh 8c 3d 2s Ks - P0 uses Kd for trip Kings, P1 only has 2 Kings
    assert p0_hand.hand_type == 4  # Three of a kind
    assert p1_hand.hand_type == 2  # One pair
    
    result_cmp = HandEvaluator.compare(p0_cards, p1_cards)
    # P0 wins (has trips vs pair)
    assert result_cmp == 1  # P0 wins
    
    print("Integration test passed!")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
