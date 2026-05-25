"""
MCCFR (Monte Carlo Counterfactual Regret Minimization) Engine.

Implements chance-sampled CFR for 2-player Texas Hold'em river games.
"""

from typing import List, Dict, Tuple, Optional
import numpy as np
import random
import sys

sys.path.insert(0, '/tmp/gto-wizard-clone/packages/poker-core/src')
from gto_poker.deck import Deck, Card
from gto_poker.hand import Hand, HandEvaluator

import sys
sys.path.insert(0, '/tmp/gto-wizard-clone/apps/solver')
from games.texas_hold_em import TexasHoldEm, GameState, Action, ActionType, create_river_state
from games.infosets import InfoSetManager, InfoSet


class CFREngine:
    """
    MCCFR solver for Texas Hold'em.
    
    Uses chance-sampled CFR with regret matching.
    """
    
    def __init__(
        self,
        game: TexasHoldEm = None,
        seed: int = None
    ):
        """
        Initialize CFR engine.
        
        Args:
            game: TexasHoldEm game instance
            seed: Random seed for reproducibility
        """
        self.game = game or TexasHoldEm()
        self.seed = seed
        if seed is not None:
            random.seed(seed)
            np.random.seed(seed)
        
        # Infoset manager
        self.infoset_manager = InfoSetManager()
        
        # Iteration count
        self.iteration = 0
        
        # Hand evaluator
        self.evaluator = HandEvaluator()
    
    def solve(
        self,
        initial_state: GameState,
        iterations: int = 1000,
        callback: callable = None
    ) -> Dict[str, np.ndarray]:
        """
        Run CFR to solve the game.
        
        Args:
            initial_state: Starting game state
            iterations: Number of CFR iterations
            callback: Optional callback after each iteration
            
        Returns:
            Dictionary mapping infoset keys to average strategies
        """
        for i in range(iterations):
            self.iteration = i + 1
            
            # Chance sampling: sample cards for chance nodes
            # For river solver, cards are already fixed
            
            # Run one iteration of CFR
            self._cfr_iteration(initial_state, 1.0, 1.0)
            
            if callback and i % 100 == 0:
                callback(self.iteration, self.infoset_manager)
        
        return self.get_average_strategies()
    
    def _cfr_iteration(
        self,
        state: GameState,
        reach_p0: float,
        reach_p1: float
    ) -> List[float]:
        """
        Run one iteration of CFR.
        
        Args:
            state: Current game state
            reach_p0: Reach probability for player 0
            reach_p1: Reach probability for player 1
            
        Returns:
            List of utilities for both players
        """
        # Terminal state
        if state.terminal or state.street == 4:
            return self._resolve_terminal(state)
        
        # Get current player
        player = state.current_player
        
        # Get valid actions
        valid_actions = self.game.get_valid_actions(state, player)
        
        if not valid_actions:
            # No valid actions (shouldn't happen)
            return [0.0, 0.0]
        
        # Get or create infoset
        infoset_key = state.infoset_key(player)
        infoset = self.infoset_manager.get_or_create(infoset_key, valid_actions)
        
        # Get current strategy via regret matching
        strategy = infoset.get_strategy()
        
        # If this player can't act (shouldn't happen in 2p), skip
        if player not in [0, 1]:
            return [0.0, 0.0]
        
        # Compute utilities for each action
        action_utils = np.zeros(len(valid_actions))
        
        for i, action_str in enumerate(valid_actions):
            # Apply action to get new state
            new_state = self.game.apply_action(state, player, action_str)
            
            # Recursively compute utility
            child_utils = self._cfr_iteration(new_state, reach_p0, reach_p1)
            
            # Store utility for this action
            action_utils[i] = child_utils[player]
        
        # Current player reach probability
        if player == 0:
            reach = reach_p0
        else:
            reach = reach_p1
        
        # Update regrets using counterfactual values
        cf_values = np.zeros(len(valid_actions))
        for i, action_str in enumerate(valid_actions):
            new_state = self.game.apply_action(state.copy(), player, action_str)
            child_utils = self._cfr_iteration(new_state, reach_p0, reach_p1)
            cf_values[i] = child_utils[player]
        
        # Expected value under current strategy
        expected_value = np.dot(strategy, action_utils)
        
        # Counterfactual regrets
        for i in range(len(valid_actions)):
            regret = action_utils[i] - expected_value
            if reach > 0:
                infoset.regret_sum[i] += regret * reach
        
        # Update strategy sum
        infoset.strategy_sum += strategy * reach
        
        # Return expected utility for both players
        return [expected_value if player == 0 else -expected_value,
                -expected_value if player == 0 else expected_value]
    
    def _resolve_terminal(self, state: GameState) -> List[float]:
        """Resolve terminal state and return utilities."""
        if state.terminal_reason == "fold":
            # Fold: winner gets the pot
            winner = 1 - state.action_history[-1].player if state.action_history else 0
            payoffs = [-state.pot, state.pot] if winner == 0 else [state.pot, -state.pot]
            return payoffs
        
        # Showdown
        return self.game.get_payoffs(state)
    
    def get_average_strategies(self) -> Dict[str, np.ndarray]:
        """
        Get average strategies for all infosets.
        
        Returns:
            Dictionary mapping infoset keys to average strategy arrays
        """
        result = {}
        for infoset in self.infoset_manager.all_infosets():
            result[infoset.key] = infoset.get_average_strategy()
        return result
    
    def get_strategy_for_infoset(self, key: str) -> Optional[np.ndarray]:
        """Get average strategy for a specific infoset."""
        infoset = self.infoset_manager.get(key)
        if infoset:
            return infoset.get_average_strategy()
        return None


def solve_river(
    p0_cards: List[str],
    p1_cards: List[str],
    board: List[str],
    pot: float,
    stacks: List[float] = None,
    iterations: int = 1000,
    bet_sizes: List[float] = None
) -> Tuple[Dict[str, np.ndarray], TexasHoldEm, GameState]:
    """
    Solve a river situation using CFR.
    
    Args:
        p0_cards: Player 0 hole cards like ["Ac", "Kd"]
        p1_cards: Player 1 hole cards like ["Qs", "Js"]
        board: 5 board cards like ["Kh", "8c", "3d", "2s", "Ks"]
        pot: Current pot size
        stacks: Stack sizes in big blinds, default [100, 100]
        iterations: Number of CFR iterations
        bet_sizes: Available bet sizes as pot multipliers
        
    Returns:
        Tuple of (strategies dict, game, final_state)
    """
    stacks = stacks or [100.0, 100.0]
    bet_sizes = bet_sizes or [0.5, 1.0]
    
    # Create game and state
    game = TexasHoldEm(stack_sizes=stacks, bet_sizes=bet_sizes)
    state = create_river_state(p0_cards, p1_cards, board, pot, stacks)
    
    # Create CFR engine
    engine = CFREngine(game)
    
    # Solve
    strategies = engine.solve(state, iterations=iterations)
    
    return strategies, game, state


# Test function
def test_river_solve():
    """Test the river solver."""
    print("=== River Solver Test ===")
    
    # Scenario: AcKd vs QsJs on board Kh 8c 3d 2s Ks
    # P0 has Ace-King (top pair), P1 has QJ (straight draw that missed)
    
    strategies, game, state = solve_river(
        p0_cards=["Ac", "Kd"],
        p1_cards=["Qs", "Js"],
        board=["Kh", "8c", "3d", "2s", "Ks"],
        pot=10.0,
        stacks=[100.0, 100.0],
        iterations=500,
        bet_sizes=[0.5, 1.0]
    )
    
    print(f"\nSolved in {len(strategies)} infosets")
    
    # Show strategies
    for key, strat in strategies.items():
        print(f"\n{key[:60]}...")
        actions = game.get_valid_actions(state, 0) if "p0" in key else game.get_valid_actions(state, 1)
        if len(actions) == len(strat):
            for i, (a, p) in enumerate(zip(actions, strat)):
                print(f"  {a}: {p:.3f}")
    
    return strategies, game, state


if __name__ == "__main__":
    test_river_solve()
