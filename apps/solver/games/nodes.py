"""
Game tree nodes for imperfect-information poker game tree.

Node types:
- ActionNode: Player decision point (fold/call/raise)
- ChanceNode: Card dealing nodes (stochastic)
- TerminalNode: Terminal payoffs (showdown or fold)

Each node stores an infoset_key for imperfect recall grouping.
"""

from enum import Enum
from typing import Dict, List, Optional, Any
from dataclasses import dataclass, field


class NodeType(Enum):
    ACTION = "action"       # Player decision
    CHANCE = "chance"       # Card dealing
    TERMINAL = "terminal"   # Game over


@dataclass
class Node:
    """Base class for all game tree nodes."""
    
    node_type: NodeType
    infoset_key: str  # For imperfect recall grouping
    parent: Optional["Node"] = None
    children: Dict[str, "Node"] = field(default_factory=dict)  # action -> child
    
    # Player to act (0 or 1 for 2-player, -1 for chance/terminal)
    player: int = -1
    
    def is_terminal(self) -> bool:
        return self.node_type == NodeType.TERMINAL
    
    def is_chance(self) -> bool:
        return self.node_type == NodeType.CHANCE
    
    def is_action(self) -> bool:
        return self.node_type == NodeType.ACTION


@dataclass
class ActionNode(Node):
    """Player decision point with available actions."""
    
    available_actions: List[str] = field(default_factory=list)
    
    def __post_init__(self):
        self.node_type = NodeType.ACTION


@dataclass 
class ChanceNode(Node):
    """Stochastic node for card dealing."""
    
    # Cards that have been dealt at this point
    dealt_cards: List[str] = field(default_factory=list)
    
    # Distribution of outcomes (for sampling)
    outcomes: List[Any] = field(default_factory=list)
    outcome_probs: List[float] = field(default_factory=list)
    
    def __post_init__(self):
        self.node_type = NodeType.CHANCE


@dataclass
class TerminalNode(Node):
    """Terminal game state with payoffs."""
    
    # Payoff for each player (positive = win, negative = loss)
    payoffs: List[float] = field(default_factory=lambda: [0.0, 0.0])
    
    # Terminal reason: "showdown", "fold", "all_in"
    terminal_reason: str = "showdown"
    
    def __post_init__(self):
        self.node_type = NodeType.TERMINAL


class GameTreeBuilder:
    """Builds game tree for Texas Hold'em."""
    
    def __init__(self, game: "TexasHoldEm"):
        self.game = game
    
    def build_river_tree(
        self, 
        p0_hand: List[str],
        p1_hand: List[str],
        board: List[str],
        pot: float,
        stacks: List[float],
        action_history: List["Action"] = None
    ) -> Node:
        """
        Build a partial river game tree given known cards.
        
        For river solver: we start at the river (5 cards on board),
        with known hole cards for both players.
        """
        pass  # Will be implemented in texas_hold_em.py
