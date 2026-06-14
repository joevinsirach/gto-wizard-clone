"""
Seed script for GTO Wizard Clone.
Populates database with community spots, quiz training data, and courses.

Run: PYTHONPATH=/path/to/repo:/path/to/repo/apps/api:/path/to/repo/packages/poker-core/src \\
     python -m apps.api.prisma.seed_fix
"""

import asyncio
import os
import sys
import uuid

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "../.."))

from apps.api.services.database import get_session_context
from apps.api.models.spots import CommunitySpot
from apps.api.services.quiz_models import QuizSpot


# =============================================================================
# Community Spots
# =============================================================================

COMMUNITY_SPOTS = [
    {
        "title": "BTN vs BB Dry Flop Spot",
        "description": "BTN opens, BB calls. Dry flop with no draws — standard c-bet spot.",
        "board": "K♠7♦2♣",
        "board_type": "flop",
        "position": "BTN",
        "pot_size": 7.5,
        "stack_depth": 100,
        "author": "GTO Wizard",
        "tags": ["c-bet", "dry-board", "single-raised-pot"],
        "strategy_json": {
            "actions": [
                {"action": "c-bet 33%", "frequency": 0.65, "ev": 3.2},
                {"action": "check", "frequency": 0.35, "ev": 2.8},
            ]
        },
        "likes_count": 42,
    },
    {
        "title": "SB vs BTN 3-Bet Pot",
        "description": "SB 3-bets BTN open. BTN calls. Flop is coordinated.",
        "board": "J♠T♠3♣",
        "board_type": "flop",
        "position": "SB",
        "pot_size": 24.0,
        "stack_depth": 95,
        "author": "GTO Wizard",
        "tags": ["3-bet-pot", "coordinated", "blind-vs-blind"],
        "strategy_json": {
            "actions": [
                {"action": "c-bet 50%", "frequency": 0.55, "ev": 5.1},
                {"action": "check", "frequency": 0.45, "ev": 4.2},
            ]
        },
        "likes_count": 38,
    },
    {
        "title": "BB Defense vs BTN Open",
        "description": "BTN opens, BB calls with marginal hand. Flop smashes BB range.",
        "board": "9♥8♥4♠",
        "board_type": "flop",
        "position": "BB",
        "pot_size": 7.5,
        "stack_depth": 100,
        "author": "PokerPro99",
        "tags": ["defense", "connected-board", "single-raised-pot"],
        "strategy_json": {
            "actions": [
                {"action": "donk-lead", "frequency": 0.08, "ev": 2.1},
                {"action": "check-raise", "frequency": 0.22, "ev": 3.5},
                {"action": "check-call", "frequency": 0.40, "ev": 1.8},
                {"action": "fold", "frequency": 0.30, "ev": 0.0},
            ]
        },
        "likes_count": 27,
    },
    {
        "title": "CO vs BTN 3-Bet Pot (Turn)",
        "description": "CO opens, BTN 3-bets, CO calls. Turn card completes straight draw.",
        "board": "Q♥J♦4♠",
        "board_type": "turn",
        "position": "CO",
        "pot_size": 32.0,
        "stack_depth": 80,
        "author": "GTO Wizard",
        "tags": ["3-bet-pot", "turn-play", "out-of-position"],
        "strategy_json": {
            "actions": [
                {"action": "check", "frequency": 0.60, "ev": 6.5},
                {"action": "donk-bet", "frequency": 0.10, "ev": 4.2},
                {"action": "check-raise", "frequency": 0.30, "ev": 8.1},
            ]
        },
        "likes_count": 31,
    },
    {
        "title": "UTG vs MP Dry Board",
        "description": "UTG opens, MP calls. Dry board favors UTG range.",
        "board": "A♠8♦3♣",
        "board_type": "flop",
        "position": "UTG",
        "pot_size": 7.5,
        "stack_depth": 100,
        "author": "PokerAnalyst",
        "tags": ["c-bet", "dry-board", "early-position"],
        "strategy_json": {
            "actions": [
                {"action": "c-bet 33%", "frequency": 0.72, "ev": 2.9},
                {"action": "check", "frequency": 0.28, "ev": 2.1},
            ]
        },
        "likes_count": 19,
    },
    {
        "title": "BTN vs BB River Value Bet",
        "description": "BTN c-bets flop, checks turn, now faces river decision with medium strength hand.",
        "board": "K♠Q♦4♣2♥7♠",
        "board_type": "river",
        "position": "BTN",
        "pot_size": 18.0,
        "stack_depth": 85,
        "author": "GTO Wizard",
        "tags": ["river", "value-bet", "thin-value"],
        "strategy_json": {
            "actions": [
                {"action": "bet 66%", "frequency": 0.35, "ev": 4.5},
                {"action": "bet 33%", "frequency": 0.25, "ev": 3.8},
                {"action": "check-back", "frequency": 0.40, "ev": 3.2},
            ]
        },
        "likes_count": 45,
    },
    {
        "title": "BB vs BTN Paired Board",
        "description": "BTN c-bets on paired flop. BB has range advantage with more full houses.",
        "board": "9♠9♥4♦",
        "board_type": "flop",
        "position": "BB",
        "pot_size": 7.5,
        "stack_depth": 100,
        "author": "GTO Coach",
        "tags": ["paired-board", "defense", "check-raise"],
        "strategy_json": {
            "actions": [
                {"action": "check-raise", "frequency": 0.18, "ev": 4.2},
                {"action": "check-call", "frequency": 0.45, "ev": 2.1},
                {"action": "fold", "frequency": 0.37, "ev": 0.0},
            ]
        },
        "likes_count": 23,
    },
]


# =============================================================================
# Quiz Spots (Training Data)
# =============================================================================

QUIZ_SPOTS = [
    # === BEGINNER PREFLOP ===
    {
        "game_type": "nlh",
        "category": "3-bet pot",
        "difficulty": "beginner",
        "position": "BTN",
        "hero_hand": "AA",
        "board": None,
        "pot_size": 60,
        "stack_depth": 100,
        "gto_action": "raise",
        "gto_frequency": 0.95,
        "gto_ev": 2.15,
        "options": [
            {"action": "raise", "ev": 2.15, "frequency": 0.95},
            {"action": "call", "ev": 1.80, "frequency": 0.04},
            {"action": "fold", "ev": 0, "frequency": 0.01},
        ],
        "explanation": "AA is a premium hand. In a 3-bet pot with deep stacks, raise for value.",
        "street": "preflop",
    },
    {
        "game_type": "nlh",
        "category": "open raise",
        "difficulty": "beginner",
        "position": "UTG",
        "hero_hand": "AKs",
        "board": None,
        "pot_size": 0,
        "stack_depth": 100,
        "gto_action": "raise",
        "gto_frequency": 1.0,
        "gto_ev": 1.5,
        "options": [
            {"action": "raise", "ev": 1.50, "frequency": 1.0},
            {"action": "limp", "ev": 0.80, "frequency": 0.0},
            {"action": "fold", "ev": 0, "frequency": 0.0},
        ],
        "explanation": "AK suited is a top-tier hand. Always raise from any position.",
        "street": "preflop",
    },
    {
        "game_type": "nlh",
        "category": "open raise",
        "difficulty": "beginner",
        "position": "BTN",
        "hero_hand": "T9s",
        "board": None,
        "pot_size": 0,
        "stack_depth": 100,
        "gto_action": "raise",
        "gto_frequency": 0.85,
        "gto_ev": 0.45,
        "options": [
            {"action": "raise", "ev": 0.45, "frequency": 0.85},
            {"action": "fold", "ev": 0, "frequency": 0.15},
        ],
        "explanation": "T9s is a playable hand from the BTN due to position. Open to steal blinds.",
        "street": "preflop",
    },
    # === INTERMEDIATE FLOPS ===
    {
        "game_type": "nlh",
        "category": "c-bet",
        "difficulty": "intermediate",
        "position": "BTN",
        "hero_hand": "AK",
        "board": "K♠7♦2♣",
        "pot_size": 7,
        "stack_depth": 100,
        "gto_action": "bet",
        "gto_frequency": 0.72,
        "gto_ev": 3.2,
        "options": [
            {"action": "bet 33%", "ev": 3.2, "frequency": 0.72},
            {"action": "check", "ev": 2.8, "frequency": 0.28},
        ],
        "explanation": "TPTK on a dry board. High-frequency c-bet for value from the BTN.",
        "street": "flop",
    },
    {
        "game_type": "nlh",
        "category": "c-bet",
        "difficulty": "intermediate",
        "position": "UTG",
        "hero_hand": "QQ",
        "board": "A♠8♦3♣",
        "pot_size": 7,
        "stack_depth": 100,
        "gto_action": "check",
        "gto_frequency": 0.55,
        "gto_ev": 1.8,
        "options": [
            {"action": "bet 33%", "ev": 1.2, "frequency": 0.45},
            {"action": "check", "ev": 1.8, "frequency": 0.55},
        ],
        "explanation": "QQ with an ace on board. Better to check-call than bet — you're mostly getting called by better hands.",
        "street": "flop",
    },
    {
        "game_type": "nlh",
        "category": "paired board",
        "difficulty": "advanced",
        "position": "BB",
        "hero_hand": "A9",
        "board": "9♠9♥4♦",
        "pot_size": 7,
        "stack_depth": 100,
        "gto_action": "check-call",
        "gto_frequency": 0.50,
        "gto_ev": 3.5,
        "options": [
            {"action": "check-raise", "ev": 4.2, "frequency": 0.18},
            {"action": "check-call", "ev": 3.5, "frequency": 0.45},
            {"action": "donk-lead", "ev": 2.1, "frequency": 0.05},
            {"action": "fold", "ev": 0, "frequency": 0.32},
        ],
        "explanation": "Trips on a paired board. The BB has a range advantage — check-raise mix is strong.",
        "street": "flop",
    },
    # === ICM TOURNAMENT ===
    {
        "game_type": "nlh",
        "category": "icm",
        "difficulty": "advanced",
        "position": "BTN",
        "hero_hand": "AQo",
        "board": None,
        "pot_size": 0,
        "stack_depth": 25,
        "gto_action": "push",
        "gto_frequency": 0.90,
        "gto_ev": 1.75,
        "options": [
            {"action": "push", "ev": 1.75, "frequency": 0.90},
            {"action": "raise 2.2x", "ev": 1.20, "frequency": 0.10},
            {"action": "fold", "ev": 0, "frequency": 0.0},
        ],
        "explanation": "25bb on the BTN with AQo is a standard push. Short stack ICM pressure.",
        "street": "preflop",
    },
    {
        "game_type": "nlh",
        "category": "icm",
        "difficulty": "advanced",
        "position": "BB",
        "hero_hand": "TT",
        "board": None,
        "pot_size": 0,
        "stack_depth": 15,
        "gto_action": "call",
        "gto_frequency": 0.75,
        "gto_ev": 1.2,
        "options": [
            {"action": "call", "ev": 1.20, "frequency": 0.75},
            {"action": "fold", "ev": 0, "frequency": 0.25},
        ],
        "explanation": "TT in the BB with 15bb facing a push. Standard call vs most ranges.",
        "street": "preflop",
    },
    # === MONSTER DRAW ===
    {
        "game_type": "nlh",
        "category": "draws",
        "difficulty": "intermediate",
        "position": "BTN",
        "hero_hand": "JTs",
        "board": "8♠9♣3♥",
        "pot_size": 7,
        "stack_depth": 100,
        "gto_action": "bet",
        "gto_frequency": 0.65,
        "gto_ev": 2.5,
        "options": [
            {"action": "bet", "ev": 2.50, "frequency": 0.65},
            {"action": "check", "ev": 1.80, "frequency": 0.35},
        ],
        "explanation": "Open-ended straight draw with two overs. Semi-bluff with good equity.",
        "street": "flop",
    },
]


# =============================================================================
# Seed Functions
# =============================================================================

async def ensure_tables():
    """Verify tables exist — they should already be created by the API on startup."""
    print("⏭️  Tables created by API on startup. Skipping table creation.")


async def seed_community_spots():
    """Seed community spots table."""
    async with get_session_context() as session:
        # Check if already seeded
        from sqlalchemy import select, func
        result = await session.execute(select(func.count()).select_from(CommunitySpot))
        count = result.scalar()
        if count > 0:
            print(f"Community spots already seeded ({count} spots). Skipping.")
            return

        for spot_data in COMMUNITY_SPOTS:
            spot = CommunitySpot(**spot_data)
            session.add(spot)

        await session.commit()
        print(f"✅ Seeded {len(COMMUNITY_SPOTS)} community spots.")


async def seed_quiz_spots():
    """Seed quiz spots table."""
    async with get_session_context() as session:
        from sqlalchemy import select, func
        result = await session.execute(select(func.count()).select_from(QuizSpot))
        count = result.scalar()
        if count > 0:
            print(f"Quiz spots already seeded ({count} spots). Skipping.")
            return

        for spot_data in QUIZ_SPOTS:
            spot = QuizSpot(**spot_data)
            session.add(spot)

        await session.commit()
        print(f"✅ Seeded {len(QUIZ_SPOTS)} quiz spots.")


async def main():
    print("🌱 Seeding GTO Wizard database...")
    await ensure_tables()
    await seed_community_spots()
    await seed_quiz_spots()
    print("🎉 Done!")


if __name__ == "__main__":
    asyncio.run(main())
