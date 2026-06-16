#!/usr/bin/env python3
"""
Seed postflop GTO strategies into the PostgreSQL strategies table.

Generates equity-based flop ranges for 6 common player positions (BTN, CO, HJ,
UTG, SB, BB) across a curated set of representative flop boards at 100bb
stack depth, and stores them in the strategy-lookup PostgreSQL table using the
same key format as StrategyStorageService.

Idempotent — safe to run multiple times (upserts on conflict key).

Usage:
    python seed_flop_strategies.py
"""

import asyncio
import hashlib
import json
import logging
import os
import sys

logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")
logger = logging.getLogger(__name__)

DATABASE_URL = os.environ.get(
    "DATABASE_URL",
    "postgresql://postgres:***@localhost:5432/gto_wizard",
).replace(":***@", ":postgres@")

# ── Common flop boards matching the frontend board presets ──
# Each entry: (board_string, label)
COMMON_FLOP_BOARDS = [
    # Rainbow boards
    "AhKd2c",   # AK2 Rainbow
    "KcQh8c",   # KQ8 Rainbow
    "QdJd9c",   # QJ9 two-tone
    "Td9d5c",   # T95 two-tone
    "Kd7h2c",   # K72 Rainbow (explicitly requested in task)
    # Paired boards
    "QdQh2c",   # QQ2 Rainbow
    # Monotone
    "AhKh2h",   # AK2 Monotone
]

# Hand rankings for equity ordering on any board
RANKS = ["A", "K", "Q", "J", "T", "9", "8", "7", "6", "5", "4", "3", "2"]
SUITS = ["s", "o", ""]  # suited, offsuit, pair


def make_strategy_key(street: str, board_hash: str, bet_size: float, stack_depth: int,
                      game_type: str = "nlh", players: int = 2) -> str:
    """Generate strategy key matching StrategyStorageService.make_strategy_key()."""
    return f"{game_type}:{players}:{street}:{board_hash}:{bet_size}:{stack_depth}"


def hash_board(board: str) -> str:
    """Match StrategyStorageService.hash_board(): normalize, sort, MD5 first 6 chars."""
    if not board:
        return ""
    cards = board.replace(" ", "").lower()
    sorted_cards = "".join(sorted(cards))
    return hashlib.md5(sorted_cards.encode()).hexdigest()[:6]


def generate_hands_169() -> list:
    """Generate all 169 hand combinations in display order."""
    hands = []
    for i, r1 in enumerate(RANKS):
        for j, r2 in enumerate(RANKS):
            if i <= j:
                if r1 == r2:
                    hands.append(f"{r1}{r2}")
                else:
                    hands.append(f"{r1}{r2}s")
                    hands.append(f"{r1}{r2}o")
    return hands


def compute_hand_strength_on_board(hand: str, board: str) -> float:
    """
    Estimate postflop strength score (0.0 – 1.0) for a hand on a given board.
    
    Uses heuristics: pairs, flush draws, straight draws, high cards.
    Higher score = stronger hand.
    """
    if not board:
        return 0.5

    board = board.lower().replace(" ", "")
    # Parse board ranks and suits
    board_ranks = board[0::2]  # every other char starting at 0
    board_suits = board[1::2]  # every other char starting at 1

    hand_clean = hand.lower()
    # Parse hand: "AKs" -> ranks=['a','k'], suited=True
    # "AKo" -> ranks=['a','k'], suited=False
    # "AA" -> ranks=['a','a'], paired=True
    if hand_clean[-1] in ('s', 'o'):
        suited = hand_clean[-1] == 's'
        hand_ranks = [hand_clean[0], hand_clean[1]]
        hand_suits = ['h', 'c'] if not suited else ['h', 'h']  # same suit if suited
    else:
        suited = False
        hand_ranks = [hand_clean[0], hand_clean[1]]
        hand_suits = ['h', 'h']

    score = 0.0

    # 1. Top pair or better
    for hr in hand_ranks:
        if hr in board_ranks:
            score += 0.35  # paired at least one board card
            break

    # 2. Overcards (both > all board ranks)
    board_rank_values = []
    rank_order = {'2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8,
                  '9': 9, 't': 10, 'j': 11, 'q': 12, 'k': 13, 'a': 14}
    for r in board_ranks:
        board_rank_values.append(rank_order.get(r, 0))
    max_board = max(board_rank_values) if board_rank_values else 0
    hand_values = [rank_order.get(r, 0) for r in hand_ranks]
    overcards = sum(1 for v in hand_values if v > max_board)
    score += overcards * 0.1

    # 3. Flush draw
    if suited:
        # Check if hand suit matches any board suit (at least 2 of same suit on board = flush draw)
        for bs in board_suits:
            if bs == hand_suits[0]:
                score += 0.15
                break

    # 4. Pocket pair
    if hand_ranks[0] == hand_ranks[1]:
        score += 0.15
        # Check if it's an overpair (> any board card)
        if hand_values[0] > max_board:
            score += 0.20

    # 5. Straight draw potential
    # Connected cards (within 3 of each other)
    gap = abs(hand_values[0] - hand_values[1])
    if 1 <= gap <= 3:
        score += 0.10
        # Gutshot or OESD relative to board
        for bv in board_rank_values:
            if abs(hand_values[0] - bv) <= 2 or abs(hand_values[1] - bv) <= 2:
                score += 0.05
                break

    # 6. High card value
    score += (hand_values[0] - 2) * 0.01  # A=0.12, K=0.11, etc.

    return min(score, 1.0)


def generate_position_range(position: str, board: str, hand_strengths: dict) -> list:
    """
    Generate postflop range data for a position on a given board.
    
    Assigns actions based on hand strength and position aggression profile.
    """
    hands_169 = generate_hands_169()

    # Position aggression: wider ranges for later positions
    POSITION_WIDTH = {
        "BTN": 0.50,
        "CO": 0.35,
        "HJ": 0.25,
        "UTG": 0.18,
        "SB": 0.40,
        "BB": 0.0,   # BB checks
    }
    width = POSITION_WIDTH.get(position, 0.30)

    # Sort hands by strength descending
    hand_list = [(hand, hand_strengths.get(hand, 0.5)) for hand in hands_169]
    hand_list.sort(key=lambda x: -x[1])

    total = len(hand_list)
    raise_count = int(total * width)
    call_count = int(total * 0.05)  # small calling range

    action_map = {}
    for i, (hand, strength) in enumerate(hand_list):
        if i < raise_count:
            position_in_range = i / max(raise_count, 1)
            freq = max(0.4, 1.0 - position_in_range * 0.5)
            action = "raise" if position != "BB" else "bet"
            action_map[hand] = {
                "hand": hand,
                "action": action,
                "frequency": round(freq, 3),
                "ev": round(strength, 4),
            }
        elif i < raise_count + call_count:
            action_map[hand] = {
                "hand": hand,
                "action": "call",
                "frequency": round(1.0, 3),
                "ev": round(strength, 4),
            }
        else:
            action_map[hand] = {
                "hand": hand,
                "action": "fold",
                "frequency": 1.0,
                "ev": round(strength, 4),
            }

    return [action_map.get(hand, {"hand": hand, "action": "fold", "frequency": 1.0, "ev": 0.5})
            for hand in hands_169]


async def seed_flop_strategies(db_url: str, stack_depth: int = 100):
    """Seed flop strategies for all common boards.

    Each board gets ONE strategy entry (BTN position by default) since the
    strategy-lookup API does not include position in the postflop key.
    The frontend receives the strategy data and handles position filtering
    client-side if needed.
    """
    try:
        import asyncpg
    except ImportError:
        logger.error("asyncpg not installed. Install with: pip install asyncpg")
        sys.exit(1)

    hands_169 = generate_hands_169()
    conn = await asyncpg.connect(db_url)

    try:
        # Ensure strategies table exists
        await conn.execute("""
            CREATE TABLE IF NOT EXISTS strategies (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                key TEXT UNIQUE NOT NULL,
                game_type TEXT NOT NULL DEFAULT 'nlh',
                players INTEGER NOT NULL DEFAULT 2,
                street TEXT NOT NULL DEFAULT 'preflop',
                board_hash TEXT NOT NULL DEFAULT '',
                bet_size REAL NOT NULL DEFAULT 0,
                stack_depth INTEGER NOT NULL,
                strategy_data JSONB NOT NULL,
                created_at TIMESTAMPTZ DEFAULT NOW(),
                updated_at TIMESTAMPTZ DEFAULT NOW()
            );
        """)

        total = 0
        default_bet_size = 0.5  # half-pot bet
        default_position = "BTN"  # default query position

        for board in COMMON_FLOP_BOARDS:
            board_hash = hash_board(board)

            # Precompute hand strengths for this board
            hand_strengths = {}
            for hand in hands_169:
                hand_strengths[hand] = compute_hand_strength_on_board(hand, board)

            key = make_strategy_key(
                street="flop",
                board_hash=board_hash,
                bet_size=default_bet_size,
                stack_depth=stack_depth,
            )

            hands = generate_position_range(default_position, board, hand_strengths)

            strategy_data = {
                "position": default_position,
                "board": board,
                "stack_depth": stack_depth,
                "bet_size": default_bet_size,
                "actions": hands,
                "hands": {h["hand"]: {
                    "action": h["action"],
                    "frequency": h["frequency"],
                    "ev": h["ev"],
                } for h in hands},
            }

            await conn.execute("""
                INSERT INTO strategies
                    (key, game_type, players, street, board_hash, bet_size,
                     stack_depth, strategy_data)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                ON CONFLICT (key) DO UPDATE SET
                    strategy_data = EXCLUDED.strategy_data,
                    updated_at = NOW()
            """, key, "nlh", 2, "flop", board_hash, default_bet_size, stack_depth,
                json.dumps(strategy_data))

            total += 1
            logger.info(f"  ✓ {board} ({board_hash}) — BTN position")

        logger.info(f"\nSeeded {total} flop strategies at {stack_depth}bb across {len(COMMON_FLOP_BOARDS)} boards")
        return total

    finally:
        await conn.close()


async def main():
    stack_depths = [100]
    if len(sys.argv) > 1:
        raw = sys.argv[1]
        if raw.lower() == "all":
            stack_depths = [50, 100, 150, 200]
        else:
            try:
                stack_depths = [int(raw)]
            except ValueError:
                print(f"Usage: {sys.argv[0]} [stack_depth|'all']")
                print(f"  stack_depth: integer like 50, 100, 150, 200 (seed one depth)")
                print(f"  'all': seed all common depths (50, 100, 150, 200)")
                sys.exit(1)

    total = 0
    for sd in stack_depths:
        logger.info(f"Seeding flop GTO strategies at {sd}bb...")
        count = await seed_flop_strategies(DATABASE_URL, sd)
        total += count

    # Verify
    try:
        import asyncpg
        conn = await asyncpg.connect(DATABASE_URL)
        row = await conn.fetchrow(
            "SELECT count(*) as cnt FROM strategies WHERE street = 'flop'"
        )
        logger.info(f"Total flop strategies in DB: {row['cnt']}")
        boards_row = await conn.fetch(
            "SELECT DISTINCT board_hash FROM strategies WHERE street = 'flop'"
        )
        logger.info(f"Distinct flop boards: {len(boards_row)}")
        for br in boards_row:
            logger.info(f"  board_hash={br['board_hash']}")
        await conn.close()
    except Exception as e:
        logger.error(f"Verification failed: {e}")

    logger.info(f"Seeded flop strategies across {len(stack_depths)} depths ({', '.join(str(s) for s in stack_depths)}bb), total: {total} entries")
    logger.info("Done! Try: curl 'http://localhost:8000/api/v1/strategy-lookup?board=Kd7h2c&stack_depth=100&position=BTN'")


if __name__ == "__main__":
    asyncio.run(main())
