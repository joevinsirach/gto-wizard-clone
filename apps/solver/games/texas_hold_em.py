"""
Texas Hold'em game rules and state management for CFR.

Implements:
- Betting rounds (preflop, flop, turn, river)
- Valid actions: fold, call, raise
- Showdown evaluation using HandEvaluator
- River solver focus for 2-player games
"""

from enum import Enum
from typing import List, Optional, Tuple, Dict, Any
from dataclasses import dataclass, field
import numpy as np
import sys
sys.path.insert(0, '/tmp/gto-wizard-clone/packages/poker-core/src')
from gto_poker.deck import Deck, Card
from gto_poker.hand import Hand, HandEvaluator


class Player(Enum):
    """Two player indices."""
    P0 = 0
    P1 = 1


class ActionType(Enum):
    """Action types in poker."""
    FOLD = "fold"
    CALL = "call"
    RAISE = "raise"
    CHECK = "check"
    BET = "bet"
    ALL_IN = "all_in"


@dataclass
class Action:
    """Represents a poker action."""
    action_type: ActionType
    player: int  # 0 or 1
    amount: float = 0.0  # Bet/raise size in chips
    
    def __str__(self):
        if self.action_type == ActionType.FOLD:
            return "fold"
        elif self.action_type == ActionType.CALL:
            return "call"
        elif self.action_type == ActionType.CHECK:
            return "check"
        elif self.action_type == ActionType.RAISE:
            return f"raise:{self.amount}"
        elif self.action_type == ActionType.BET:
            return f"bet:{self.amount}"
        elif self.action_type == ActionType.ALL_IN:
            return f"all_in:{self.amount}"
        return str(self.action_type)


@dataclass
class GameState:
    """
    Complete game state for Texas Hold'em.
    
    For river solver, we fix:
    - Both players' hole cards
    - Board cards (5 cards on river)
    - Pot size
    - Stack sizes
    """
    # Player hole cards [p0_card1, p0_card2, p1_card1, p1_card2]
    hole_cards: List[Card] = field(default_factory=list)
    
    # Board cards (0-5 cards depending on street)
    board: List[Card] = field(default_factory=list)
    
    # Pot sizes (main pot, then side pots if any)
    pot: float = 0.0
    
    # Amount each player has contributed to pot
    contributions: List[float] = field(default_factory=lambda: [0.0, 0.0])
    
    # Stack sizes (amount each player has left)
    stacks: List[float] = field(default_factory=lambda: [100.0, 100.0])
    
    # Current player to act (-1 if not applicable)
    current_player: int = 0
    
    # Action history
    action_history: List[Action] = field(default_factory=list)
    
    # Street: 0=preflop, 1=flop, 2=turn, 3=river, 4=showdown
    street: int = 3  # Default to river
    
    # Bet to call (amount needed to stay in)
    bet_to_call: float = 0.0
    
    # Last player who bet (to track when betting round ends)
    last_bettor: int = -1
    
    # Amount of the last bet (for showdown detection)
    last_bet_amount: float = 0.0
    
    # Whether the hand is over
    terminal: bool = False
    terminal_reason: str = ""
    
    # Terminal payoffs (set when terminal)
    payoffs: List[float] = field(default_factory=lambda: [0.0, 0.0])
    
    def infoset_key(self, player: int) -> str:
        """
        Generate information set key for a player.
        
        Format: "player:board:pot:stack:bet_to_call:action_history"
        """
        board_str = "".join(str(c) for c in self.board)
        hole_str = "".join(str(c) for i, c in enumerate(self.hole_cards) if i // 2 == player)
        
        stack_str = f"{self.stacks[0]:.0f},{self.stacks[1]:.0f}"
        
        # Get recent actions (up to last 4)
        actions_str = ",".join(str(a) for a in self.action_history[-4:])
        
        return f"p{player}:{hole_str}:{board_str}:{self.pot:.0f}:{stack_str}:{self.bet_to_call:.0f}:{actions_str}"
    
    def copy(self) -> "GameState":
        """Create a deep copy of the game state."""
        return GameState(
            hole_cards=list(self.hole_cards),
            board=list(self.board),
            pot=self.pot,
            contributions=list(self.contributions),
            stacks=list(self.stacks),
            current_player=self.current_player,
            action_history=list(self.action_history),
            street=self.street,
            bet_to_call=self.bet_to_call,
            last_bettor=self.last_bettor,
            last_bet_amount=self.last_bet_amount,
            terminal=self.terminal,
            terminal_reason=self.terminal_reason
        )


class TexasHoldEm:
    """
    Texas Hold'em game for CFR.
    
    This class manages:
    - Game rules and valid actions
    - State transitions
    - Hand evaluation at showdown
    """
    
    def __init__(
        self,
        stack_sizes: List[float] = None,  # In big blinds
        bet_sizes: List[float] = None,    # Multipliers of pot
        big_blind: float = 1.0
    ):
        """
        Initialize Texas Hold'em game.
        
        Args:
            stack_sizes: Stack sizes in big blinds [p0, p1]
            bet_sizes: Available bet sizes as pot multipliers, e.g., [0.5, 1.0]
            big_blind: Size of big blind
        """
        self.stack_sizes = stack_sizes or [100.0, 100.0]
        self.bet_sizes = bet_sizes or [0.5, 1.0]  # Half-pot, pot-sized
        self.big_blind = big_blind
        
        # Hand evaluator
        self.evaluator = HandEvaluator()
    
    def get_valid_actions(self, state: GameState, player: int) -> List[str]:
        """
        Get valid actions for a player at the current state.
        
        River solver simplified: single bet per betting round.
        - Always: fold (give up), check (if no bet), or bet (initiate new bet)
        - If facing a bet: fold, call, or all-in
        
        This prevents the tree explosion from multiple re-raises.
        """
        if state.terminal:
            return []
        
        amount_to_call = state.bet_to_call - state.contributions[player]
        if amount_to_call < 0:
            amount_to_call = 0  # Clamp negative values
        
        actions = ["fold"]  # Can always fold (unless preflop big blind)
        
        # If facing a bet, can call or all-in
        if amount_to_call > 0:
            actions.append("call")
            # All-in is always available if player has any chips
            if state.stacks[player] > amount_to_call:
                actions.append(f"all_in:{state.stacks[player]}")
        else:
            # No active bet - first action of the betting round
            # Can check or bet (one size only)
            actions.append("check")
            actions.append(f"bet:{self.bet_sizes[0]}" if self.bet_sizes else "bet:0.5")
            
            # All-in as emergency option
            if state.stacks[player] > 0:
                actions.append(f"all_in:{state.stacks[player]}")
        
        return actions
    
    def apply_action(self, state: GameState, player: int, action_str: str) -> GameState:
        """
        Apply an action and return new state.
        
        Args:
            state: Current game state
            player: Player taking action (0 or 1)
            action_str: Action string like "fold", "call", "raise:0.5"
            
        Returns:
            New game state
        """
        new_state = state.copy()
        
        # Create and store the action
        from games.texas_hold_em import Action, ActionType
        if action_str == "fold":
            action = Action(ActionType.FOLD, player)
        elif action_str == "call":
            action = Action(ActionType.CALL, player)
        elif action_str.startswith("raise:"):
            amount = float(action_str.split(":")[1])
            action = Action(ActionType.RAISE, player, amount)
        elif action_str.startswith("bet:"):
            # Bet is like raise but without needing to match an existing bet
            amount = float(action_str.split(":")[1])
            action = Action(ActionType.BET, player, amount)
        elif action_str.startswith("all_in:"):
            # All-in action - amount is the player's entire stack
            amount = float(action_str.split(":")[1])
            action = Action(ActionType.ALL_IN, player, amount)
        elif action_str == "check":
            action = Action(ActionType.CHECK, player)
        else:
            action = Action(ActionType(action_str), player)
        
        new_state.action_history.append(action)
        new_state.current_player = 1 - player  # Switch player
        
        if action_str == "fold":
            new_state.terminal = True
            new_state.terminal_reason = "fold"
            # Winner gets the pot
            winner = 1 - player
            new_state.payoffs = [0.0, 0.0]
            new_state.payoffs[winner] = state.pot
            return new_state
        
        amount_to_call = state.bet_to_call - state.contributions[player]
        
        if action_str == "call":
            # Match the bet
            call_amount = min(max(0, amount_to_call), state.stacks[player])
            new_state.contributions[player] += call_amount
            new_state.stacks[player] -= call_amount
            new_state.pot += call_amount
            
            # If player called a bet (not just checking when no bet), betting round ends
            if amount_to_call > 0:
                new_state.bet_to_call = 0.0
                new_state.last_bettor = -1  # Betting round complete
            
        elif action_str.startswith("raise:"):
            raise_mult = float(action_str.split(":")[1])
            # If raise_mult < 10, treat as pot multiplier; otherwise as absolute amount
            bet_size = state.pot * raise_mult if raise_mult < 10 else raise_mult
            
            # Amount needed to call (to match the current bet)
            amount_to_call = max(0, state.bet_to_call - state.contributions[player])
            
            # Total cost = amount_to_call + bet_size, capped at player's stack
            total_cost = min(amount_to_call + bet_size, state.stacks[player])
            
            new_state.contributions[player] += total_cost
            new_state.stacks[player] -= total_cost
            new_state.pot += total_cost
            
            # After this action, what does opponent need to call?
            opponent = 1 - player
            opponent_contribution = new_state.contributions[opponent]
            new_state.bet_to_call = max(0, new_state.contributions[player] - opponent_contribution)
            new_state.last_bettor = player
            
        elif action_str.startswith("all_in:"):
            # All-in is like bet/raise but for the player's entire stack
            player_stack = state.stacks[player]
            amount_to_call = max(0, state.bet_to_call - state.contributions[player])
            
            total_cost = min(amount_to_call + player_stack, player_stack)
            
            new_state.contributions[player] += total_cost
            new_state.stacks[player] -= total_cost
            new_state.pot += total_cost
            
            # After all-in, opponent needs to call the difference
            opponent = 1 - player
            opponent_contribution = new_state.contributions[opponent]
            new_state.bet_to_call = max(0, new_state.contributions[player] - opponent_contribution)
            new_state.last_bettor = player
            
            # If both players are all-in (both stacks = 0), trigger showdown
            if new_state.stacks[0] == 0 and new_state.stacks[1] == 0:
                new_state.terminal = True
                new_state.terminal_reason = "showdown"
                new_state.last_bettor = -1
                return new_state
            
        elif action_str.startswith("bet:"):
            # Bet initiates a new bet (like raise but no amount_to_call needed)
            bet_mult = float(action_str.split(":")[1])
            bet_size = state.pot * bet_mult if bet_mult < 10 else bet_mult
            
            # Bet the bet_size, capped at player's stack
            total_cost = min(bet_size, state.stacks[player])
            
            new_state.contributions[player] += total_cost
            new_state.stacks[player] -= total_cost
            new_state.pot += total_cost
            
            # After a bet, opponent needs to call to stay in
            opponent = 1 - player
            opponent_contribution = new_state.contributions[opponent]
            new_state.bet_to_call = max(0, new_state.contributions[player] - opponent_contribution)
            new_state.last_bettor = player
            
        elif action_str == "check":
            # No change to pot or stacks
            # Player checked - if they were last bettor and opponent hasn't acted yet,
            # this is fine, otherwise showdown check
            pass
        
        # Showdown detection for river
        # Showdown when: betting round is over (no active bet) AND at least 2 actions
        if not new_state.terminal and new_state.street >= 3:
            n_actions = len(new_state.action_history)
            last_action = new_state.action_history[-1]
            second_last = new_state.action_history[-2] if n_actions >= 2 else None
            
            # Check for showdown:
            # Case 1: Both checked (first to act checked, then other player checked)
            # Case 2: Bet was called (last action was a call with a previous bettor)
            if n_actions >= 2:
                both_checked = (
                    last_action.action_type == ActionType.CHECK and 
                    second_last and second_last.action_type == ActionType.CHECK
                )
                # Check if this call completed a betting round (there was a bet before)
                opponent = 1 - player
                # Check if player actually put in more money (called)
                player_contributed = new_state.contributions[player] > state.contributions[player]
                call_completes_round = (
                    last_action.action_type == ActionType.CALL and
                    player_contributed and  # Player put in more money (called a bet)
                    new_state.bet_to_call == 0  # Call matched the bet (no remaining bet)
                )
                
                if both_checked or call_completes_round:
                    new_state.terminal = True
                    new_state.terminal_reason = "showdown"
                    new_state.last_bettor = -1
        
        return new_state
    
    def is_terminal(self, state: GameState) -> bool:
        """Check if state is terminal."""
        return state.terminal or state.street == 4
    
    def get_payoffs(self, state: GameState) -> List[float]:
        """Get payoffs at terminal state."""
        if state.terminal_reason == "fold":
            # Winner already determined
            pass
        
        # Showdown: evaluate hands
        p0_cards = [state.hole_cards[0], state.hole_cards[1]] + state.board
        p1_cards = [state.hole_cards[2], state.hole_cards[3]] + state.board
        
        result = self.evaluator.compare(p0_cards, p1_cards)
        
        if result == 1:  # P0 wins (compare returns 1 when first arg wins)
            return [state.pot, -state.pot]
        elif result == -1:  # P1 wins
            return [-state.pot, state.pot]
        else:  # Tie
            return [0.0, 0.0]
    
    def resolve(self, state: GameState) -> List[float]:
        """Resolve the hand and return payoffs."""
        if state.terminal_reason == "fold":
            # Return payoffs as already set
            return getattr(state, 'payoffs', [0.0, 0.0])
        return self.get_payoffs(state)


def create_river_state(
    p0_cards: List[str],
    p1_cards: List[str],
    board: List[str],
    pot: float,
    stacks: List[float],
    current_player: int = 0,
    bet_to_call: float = 0.0,
    action_history: List[Action] = None
) -> GameState:
    """
    Create a river game state with known cards.
    
    For river solver, all 5 board cards are known.
    """
    deck = Deck()
    
    hole_cards = []
    for card_str in p0_cards:
        hole_cards.append(deck.parse(card_str))
    for card_str in p1_cards:
        hole_cards.append(deck.parse(card_str))
    
    board_cards = [deck.parse(c) for c in board]
    
    return GameState(
        hole_cards=hole_cards,
        board=board_cards,
        pot=pot,
        stacks=list(stacks),
        current_player=current_player,
        action_history=action_history or [],
        street=3,  # River
        bet_to_call=bet_to_call
    )


# Simple test
if __name__ == "__main__":
    game = TexasHoldEm()
    
    # River scenario: AcKd vs QsJs on Kh
    state = create_river_state(
        p0_cards=["Ac", "Kd"],
        p1_cards=["Qs", "Js"],
        board=["Kh", "8c", "3d", "2s", "Ks"],  # Board has Kh and Ks
        pot=10.0,
        stacks=[100.0, 100.0],
        current_player=0
    )
    
    print(f"State: P0 has Ac Kd, P1 has Qs Js")
    print(f"Board: Kh 8c 3d 2s Ks")
    print(f"Valid actions for P0: {game.get_valid_actions(state, 0)}")
    
    # Test hand evaluation
    p0_cards = [state.hole_cards[0], state.hole_cards[1]] + state.board
    p1_cards = [state.hole_cards[2], state.hole_cards[3]] + state.board
    
    print(f"\nP0 best hand: {Hand(p0_cards)}")
    print(f"P1 best hand: {Hand(p1_cards)}")
    
    result = HandEvaluator.compare(p0_cards, p1_cards)
    print(f"Result: {'P0 wins' if result == -1 else 'P1 wins' if result == 1 else 'Tie'}")
