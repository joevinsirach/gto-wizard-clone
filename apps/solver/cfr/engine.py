"""
MCCFR (Monte Carlo Counterfactual Regret Minimization) Engine.

Implements chance-sampled CFR for multi-street 2-player Texas Hold'em.
Supports: preflop → flop → turn → river → showdown.
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
    Supports multi-street solving (preflop through river).
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
        callback: callable = None,
        sample_chance: bool = True
    ) -> Dict[str, np.ndarray]:
        """
        Run CFR to solve the game.
        
        Args:
            initial_state: Starting game state
            iterations: Number of CFR iterations
            callback: Optional callback after each iteration
            sample_chance: Whether to sample cards (for multi-street solving)
            
        Returns:
            Dictionary mapping infoset keys to average strategies
        """
        for i in range(iterations):
            self.iteration = i + 1
            
            # Work with a copy of initial_state for this iteration
            state = initial_state.copy()
            
            if sample_chance:
                # Chance sampling: sample cards for this iteration
                # Only sample if hole cards or board are missing
                if len(state.hole_cards) < 4 or len(state.board) < 5:
                    state = self._sample_cards(state)
            
            # Run one iteration of CFR
            self._cfr_iteration(state, 1.0, 1.0)
            
            if callback and i % 100 == 0:
                callback(self.iteration, self.infoset_manager)
        
        return self.get_average_strategies()
    
    def _sample_cards(self, state: GameState) -> GameState:
        """
        Sample missing cards for chance sampling at the start of an iteration.
        
        At preflop (street 0): deal 3 flop cards
        At flop (street 1): deal 1 turn card  
        At turn (street 2): deal 1 river card
        At river (street 3): no cards needed
        """
        new_state = state.copy()
        
        # Get all dealt cards so far
        dealt = set()
        for card in new_state.hole_cards:
            dealt.add(str(card))
        for card in new_state.board:
            dealt.add(str(card))
        
        # Build remaining deck
        all_cards = []
        for rank in ["2", "3", "4", "5", "6", "7", "8", "9", "T", "J", "Q", "K", "A"]:
            for suit in ["h", "d", "c", "s"]:
                card_str = f"{rank}{suit}"
                if card_str not in dealt:
                    all_cards.append(card_str)
        
        deck = Deck()
        
        # Sample hole cards if missing
        if len(new_state.hole_cards) < 4:
            needed = 4 - len(new_state.hole_cards)
            if needed > 0 and len(all_cards) >= needed:
                sampled = random.sample(all_cards, needed)
                all_cards = [c for c in all_cards if c not in sampled]
                for card_str in sampled:
                    new_state.hole_cards.append(deck.parse(card_str))
        
        # Sample community cards based on street
        # Street 0: deal 3 (flop)
        # Street 1: deal 1 (turn)
        # Street 2: deal 1 (river)
        # Street 3: no more
        cards_needed = {
            0: 3,  # Preflop: sample flop (3 cards)
            1: 1,  # Flop: sample turn (1 card)
            2: 1,  # Turn: sample river (1 card)
            3: 0   # River: no more
        }
        
        needed = cards_needed.get(new_state.street, 0)
        if needed > 0 and len(new_state.board) < 5:
            available = 5 - len(new_state.board)
            actual = min(needed, available)
            if actual > 0 and len(all_cards) >= actual:
                sampled = random.sample(all_cards, actual)
                for card_str in sampled:
                    new_state.board.append(deck.parse(card_str))
        
        return new_state
    
    def _advance_street(self, state: GameState) -> GameState:
        """
        Advance to the next street after betting round ends.
        Resets betting state for the new street.
        """
        new_state = state.copy()
        
        if new_state.street < 3:
            new_state.street += 1
        
        # Reset betting state for new street
        new_state.bet_to_call = 0.0
        new_state.last_bettor = -1
        
        return new_state
    
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
        # Terminal state check
        if state.terminal or state.street >= 4:
            return self._resolve_terminal(state)
        
        # Handle both all-in: go straight to showdown
        if state.stacks[0] == 0 and state.stacks[1] == 0:
            return self._handle_showdown(state)
        
        # Check if betting round is complete (both checked, or call matched bet)
        # and we need to advance to next street
        if self._betting_round_complete(state) and state.street < 3:
            new_state = self._advance_street(state)
            new_state.current_player = 0  # P0 acts first on new street
            return self._cfr_iteration(new_state, reach_p0, reach_p1)
        
        # Get current player
        player = state.current_player
        
        # Get valid actions
        valid_actions = self.game.get_valid_actions(state, player)
        
        if not valid_actions:
            return [0.0, 0.0]
        
        # Get or create infoset
        infoset_key = state.infoset_key(player)
        infoset = self.infoset_manager.get_or_create(infoset_key, valid_actions)
        
        # Get current strategy via regret matching
        strategy = infoset.get_strategy()
        
        if player not in [0, 1]:
            return [0.0, 0.0]
        
        # Compute utilities for each action
        action_utils = np.zeros(len(valid_actions))
        
        for i, action_str in enumerate(valid_actions):
            # Apply action to get new state
            new_state = self.game.apply_action(state.copy(), player, action_str)
            
            # Recursively compute utility
            child_utils = self._cfr_iteration(new_state, reach_p0, reach_p1)
            
            # Store utility for this action
            action_utils[i] = child_utils[player]
        
        # Current player reach probability
        reach = reach_p0 if player == 0 else reach_p1
        
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
    
    def _betting_round_complete(self, state: GameState) -> bool:
        """
        Check if the current betting round is complete.
        
        A betting round is complete when:
        - bet_to_call == 0 (no active bet to call)
        - last_bettor == -1 (no one just bet, or bet was matched)
        - AND we have actions (the round actually started)
        """
        if len(state.action_history) == 0:
            return False
        
        return state.bet_to_call == 0 and state.last_bettor == -1
    
    def _handle_showdown(self, state: GameState) -> List[float]:
        """
        Handle showdown when both players are all-in.
        Deals remaining community cards if needed and resolves the hand.
        """
        new_state = state.copy()
        
        # Deal remaining community cards if needed
        if len(new_state.board) < 5:
            dealt = set()
            for card in new_state.hole_cards:
                dealt.add(str(card))
            for card in new_state.board:
                dealt.add(str(card))
            
            all_cards = []
            for rank in ["2", "3", "4", "5", "6", "7", "8", "9", "T", "J", "Q", "K", "A"]:
                for suit in ["h", "d", "c", "s"]:
                    card_str = f"{rank}{suit}"
                    if card_str not in dealt:
                        all_cards.append(card_str)
            
            cards_needed = 5 - len(new_state.board)
            if cards_needed > 0 and len(all_cards) >= cards_needed:
                sampled = random.sample(all_cards, cards_needed)
                deck = Deck()
                for card_str in sampled:
                    new_state.board.append(deck.parse(card_str))
        
        return self._resolve_terminal(new_state)
    
    def _resolve_terminal(self, state: GameState) -> List[float]:
        """Resolve terminal state and return utilities."""
        if state.terminal_reason == "fold":
            # Fold: winner gets the pot
            folder = state.action_history[-1].player if state.action_history else 0
            winner = 1 - folder
            payoffs = [state.pot, -state.pot] if winner == 0 else [-state.pot, state.pot]
            return payoffs
        
        # Showdown
        return self.game.get_payoffs(state)
    
    def get_average_strategies(self) -> Dict[str, np.ndarray]:
        """Get average strategies for all infosets."""
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
    
    # Solve (no chance sampling needed - all cards known at river)
    strategies = engine.solve(state, iterations=iterations, sample_chance=False)
    
    return strategies, game, state


def solve_preflop(
    p0_cards: List[str],
    p1_cards: List[str],
    pot: float,
    stacks: List[float] = None,
    iterations: int = 1000,
    bet_sizes: List[float] = None
) -> Tuple[Dict[str, np.ndarray], TexasHoldEm, GameState]:
    """
    Solve a pre-flop situation using CFR with chance sampling.
    
    Args:
        p0_cards: Player 0 hole cards like ["Ac", "Ad"]
        p1_cards: Player 1 hole cards like ["Kc", "Kd"]
        pot: Current pot size (includes antes/blinds)
        stacks: Stack sizes in big blinds, default [100, 100]
        iterations: Number of CFR iterations
        bet_sizes: Available bet sizes as pot multipliers
        
    Returns:
        Tuple of (strategies dict, game, final_state)
    """
    stacks = stacks or [100.0, 100.0]
    bet_sizes = bet_sizes or [0.5, 1.0]
    
    # Create game
    game = TexasHoldEm(stack_sizes=stacks, bet_sizes=bet_sizes)
    
    # Create initial pre-flop state with known hole cards but no board
    deck = Deck()
    hole_cards = [deck.parse(c) for c in p0_cards] + [deck.parse(c) for c in p1_cards]
    
    state = GameState(
        hole_cards=hole_cards,
        board=[],
        pot=pot,
        stacks=list(stacks),
        current_player=0,
        action_history=[],
        street=0,
        bet_to_call=0.0,
        last_bettor=-1
    )
    
    # Create CFR engine
    engine = CFREngine(game)
    
    # Solve with chance sampling
    strategies = engine.solve(state, iterations=iterations, sample_chance=True)
    
    return strategies, game, state


# Test function
def test_river_solve():
    """Test the river solver."""
    print("=== River Solver Test ===")
    
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
    
    for key, strat in strategies.items():
        print(f"\n{key[:60]}...")
        actions = game.get_valid_actions(state, 0) if "p0" in key else game.get_valid_actions(state, 1)
        if len(actions) == len(strat):
            for i, (a, p) in enumerate(zip(actions, strat)):
                print(f"  {a}: {p:.3f}")
    
    return strategies, game, state


if __name__ == "__main__":
    test_river_solve()