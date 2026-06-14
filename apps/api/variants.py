"""
Variant registry for gto-wizard-clone using pokerkit.
"""
from __future__ import annotations
import logging
from dataclasses import dataclass
from enum import Enum
from typing import Any

from pokerkit.games import (
    NoLimitTexasHoldem, FixedLimitTexasHoldem,
    PotLimitOmahaHoldem, FixedLimitOmahaHoldemHighLowSplitEightOrBetter,
    FixedLimitSevenCardStud, FixedLimitSevenCardStudHighLowSplitEightOrBetter,
    FixedLimitRazz, FixedLimitDeuceToSevenLowballTripleDraw,
    NoLimitDeuceToSevenLowballSingleDraw, FixedLimitBadugi,
)
from pokerkit.analysis import calculate_equities, parse_range
from pokerkit.hands import (
    StandardHighHand, StandardLowHand, RegularLowHand,
    BadugiHand, OmahaHoldemHand, EightOrBetterLowHand,
)
from pokerkit.utilities import Card, Deck, RankOrder

logger = logging.getLogger(__name__)


class VariantCategory(str, Enum):
    FLOP = "flop"
    STUD = "stud"
    DRAW = "draw"


@dataclass
class VariantDef:
    key: str
    name: str
    short_name: str
    game_class: type
    category: VariantCategory
    deck: Deck = Deck.STANDARD
    hand_type: type | tuple[type, ...] = StandardHighHand
    hole_count: int = 2
    board_count: int = 5
    description: str = ""


VARIANTS: dict[str, VariantDef] = {}


def register(vd: VariantDef):
    VARIANTS[vd.key] = vd


# Existing variants
register(VariantDef(
    key="nlh", name="No-Limit Texas Hold'em", short_name="NLH",
    game_class=NoLimitTexasHoldem, category=VariantCategory.FLOP,
))
register(VariantDef(
    key="plo4", name="Pot-Limit Omaha (4-card)", short_name="PLO4",
    game_class=PotLimitOmahaHoldem, category=VariantCategory.FLOP,
    hand_type=OmahaHoldemHand,
))
register(VariantDef(
    key="plo5", name="Pot-Limit Omaha (5-card)", short_name="PLO5",
    game_class=PotLimitOmahaHoldem, category=VariantCategory.FLOP,
    hand_type=OmahaHoldemHand,
))
register(VariantDef(
    key="omaha8", name="Omaha Hi-Lo 8-or-Better", short_name="Omaha8",
    game_class=FixedLimitOmahaHoldemHighLowSplitEightOrBetter,
    category=VariantCategory.FLOP,
    hand_type=(OmahaHoldemHand, EightOrBetterLowHand),
))

# Stud family (new via pokerkit)
register(VariantDef(
    key="stud", name="Seven Card Stud", short_name="Stud",
    game_class=FixedLimitSevenCardStud, category=VariantCategory.STUD,
    hole_count=7, board_count=0,
    description="Seven-card stud. 3 down, 4 up.",
))
register(VariantDef(
    key="stud8", name="Seven Card Stud Hi-Lo", short_name="Stud8",
    game_class=FixedLimitSevenCardStudHighLowSplitEightOrBetter,
    category=VariantCategory.STUD,
    hand_type=(StandardHighHand, EightOrBetterLowHand),
    hole_count=7, board_count=0,
    description="Stud hi-lo split 8-or-better.",
))
register(VariantDef(
    key="razz", name="Razz", short_name="Razz",
    game_class=FixedLimitRazz, category=VariantCategory.STUD,
    hand_type=RegularLowHand, deck=Deck.REGULAR,
    hole_count=7, board_count=0,
    description="Ace-to-five lowball stud.",
))

# Draw family (new via pokerkit)
register(VariantDef(
    key="2-7td", name="Deuce-to-Seven Triple Draw", short_name="2-7 TD",
    game_class=FixedLimitDeuceToSevenLowballTripleDraw,
    category=VariantCategory.DRAW, hand_type=StandardLowHand,
    hole_count=5, board_count=0,
    description="2-7 lowball triple draw.",
))
register(VariantDef(
    key="2-7sd", name="Deuce-to-Seven Single Draw", short_name="2-7 SD",
    game_class=NoLimitDeuceToSevenLowballSingleDraw,
    category=VariantCategory.DRAW, hand_type=StandardLowHand,
    hole_count=5, board_count=0,
    description="2-7 lowball single draw.",
))
register(VariantDef(
    key="badugi", name="Badugi", short_name="Badugi",
    game_class=FixedLimitBadugi, category=VariantCategory.DRAW,
    hand_type=BadugiHand, deck=Deck.REGULAR,
    hole_count=4, board_count=0,
    description="Badugi. Best 1-4 card rainbow hand wins.",
))


def get_variant(key: str) -> VariantDef | None:
    return VARIANTS.get(key)


def list_variants() -> list[dict[str, Any]]:
    return [
        {
            "key": v.key, "name": v.name, "short_name": v.short_name,
            "category": v.category.value, "hole_count": v.hole_count,
            "board_count": v.board_count, "description": v.description,
        }
        for v in VARIANTS.values()
    ]


def calculate_variant_equity(
    variant_key: str,
    hero_range: str,
    villain_range: str,
    board: str = "",
    iterations: int = 100000,
) -> dict[str, Any]:
    """Calculate equity for any registered variant using pokerkit's Monte Carlo engine."""
    vd = get_variant(variant_key)
    if vd is None:
        raise ValueError(f"Unknown variant: {variant_key}")

    ro = RankOrder.REGULAR if vd.deck == Deck.REGULAR else RankOrder.STANDARD
    hero = parse_range(hero_range, rank_order=ro)
    villain = parse_range(villain_range, rank_order=ro)

    board_cards: list[Card] = []
    if board:
        for i in range(0, len(board), 2):
            try:
                board_cards.append(Card.from_string(board[i:i + 2]))
            except Exception:
                pass

    ht = vd.hand_type
    hand_types = ht if isinstance(ht, tuple) else (ht,)
    equities = calculate_equities(
        hole_ranges=[hero, villain],
        board_cards=board_cards,
        hole_dealing_count=vd.hole_count,
        board_dealing_count=vd.board_count,
        deck=vd.deck,
        hand_types=hand_types,
        sample_count=iterations,
    )
    return {
        "hero_equity": float(equities[0] * 100),
        "villain_equity": float(equities[1] * 100) if len(equities) > 1 else None,
        "iterations": iterations,
        "variant": variant_key,
        "variant_name": vd.name,
    }
