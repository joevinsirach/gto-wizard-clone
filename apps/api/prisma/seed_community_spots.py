"""
Seed community spots in PostgreSQL.
Run with: DATABASE_URL="postgresql+asyncpg://postgres:postgres@localhost:5432/gto_wizard" PYTHONPATH=. python3 apps/api/prisma/seed_community_spots.py
"""

import asyncio
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from apps.api.services.database import get_session_context, init_db
from apps.api.models.spots import CommunitySpot
from sqlalchemy import select


async def seed():
    await init_db()
    async with get_session_context() as session:
        result = await session.execute(select(CommunitySpot))
        existing = result.scalars().all()
        if existing:
            print(f"Community spots already exist: {len(existing)} rows")
            return

        spots = [
            CommunitySpot(
                title="BB vs BTN Paired Board",
                description="BTN c-bets on paired flop. BB has range advantage with more full houses.",
                board="9♠9♥4♦",
                board_type="flop",
                position="BB",
                pot_size=7.5,
                stack_depth=100,
                author="GTO Coach",
                tags=["paired-board", "defense", "check-raise"],
                strategy_json={
                    "actions": [
                        {"action": "check-raise", "frequency": 0.18, "ev": 4.2},
                        {"action": "check-call", "frequency": 0.45, "ev": 2.1},
                        {"action": "fold", "frequency": 0.37, "ev": 0.0},
                    ]
                },
            ),
            CommunitySpot(
                title="CO vs BTN 3-Bet Pot",
                description="CO faces BTN 3-bet on K-high board. Spot continues on flop.",
                board="K♠7♦2♣",
                board_type="flop",
                position="CO",
                pot_size=6.0,
                stack_depth=100,
                author="GTO Coach",
                tags=["3-bet", "value", "continuation"],
                strategy_json={
                    "actions": [
                        {"action": "bet", "frequency": 0.65, "ev": 3.1},
                        {"action": "check", "frequency": 0.35, "ev": 1.8},
                    ]
                },
            ),
            CommunitySpot(
                title="SB vs BB Monotone Board",
                description="SB c-bets on monotone flush board. BB needs to defend with flush draws and sets.",
                board="8♠5♠2♠",
                board_type="flop",
                position="SB",
                pot_size=5.5,
                stack_depth=100,
                author="GTO Coach",
                tags=["monotone", "flush", "c-bet"],
                strategy_json={
                    "actions": [
                        {"action": "bet", "frequency": 0.72, "ev": 2.8},
                        {"action": "check", "frequency": 0.28, "ev": 1.2},
                    ]
                },
            ),
        ]
        for spot in spots:
            session.add(spot)
        await session.commit()
        print(f"Seeded {len(spots)} community spots")


if __name__ == "__main__":
    asyncio.run(seed())
