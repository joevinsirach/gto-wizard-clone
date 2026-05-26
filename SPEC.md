# GTO Wizard Clone — Architecture Specification

Open-source GTO poker training platform with equity calculator, CFR solver, training modes, hand history analysis, and ICM calculator. Supports **NLH, PLO4, PLO5, Omaha Hi/Lo, Shortdeck, Double Board PLO, and Bomb Pot**.

**Created:** 2026-05-25 | **Updated:** 2026-05-26

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         CLIENT (Browser)                            │
│  Next.js 15 + React 19 + TypeScript + Tailwind v4 + Shadcn UI       │
│  WebSocket (Socket.io) ←→ Solver progress streaming                 │
└────────────────────────┬────────────────────────────────────────────┘
                         │ REST + WebSocket
┌────────────────────────▼────────────────────────────────────────────┐
│                      FASTAPI API GATEWAY                             │
│  /api/v1/*  — REST endpoints                                        │
│  /ws/*      — WebSocket for real-time (solve progress, quiz events) │
└─────┬──────────────────────┬───────────────────────────────────────┘
      │                      │
┌─────▼──────┐    ┌──────────▼──────────┐
│   Redis    │    │   PostgreSQL (Neon) │
│   Cache    │    │   Strategies, HH    │
└────────────┘    └─────────────────────┘
```

---

## Supported Game Variants

| Variant | Code | Phase | Evaluator | Notes |
|---------|------|-------|-----------|-------|
| No-Limit Hold'em | `nlh` | ✅ Ready | OMPEval (C++) | Standard |
| Pot-Limit Omaha 4 | `plo4` | Phase 2b | **PokerHandEvaluator** (C++/Python) | 4 hole cards |
| PLO5 (5-card Omaha) | `plo5` | Phase 2c | 4-card from 5 eval | 5 hole cards |
| Omaha Hi/Lo (8-or-better) | `plo_hi_lo` | Phase 2c | PokerHandEvaluator (native) | Split pot + 8-qualifier required |
| Shortdeck (6+ Hold'em) | `shortdeck` | Phase 2c | Modified rankings | A-6 only, flush > full house |
| **Double Board PLO** | `double_board_plo` | Phase 2d | **Novel** — two boards | Scoop/chop scoring |
| **Bomb Pot** | `bomb_pot` | Phase 2d | **Novel** — action-first | Straddle/junk blinds |

---

## Application Structure

### `apps/web` — Frontend (Next.js 15)
Key pages: `/`, `/equity`, `/plo`, `/train`, `/analyze`, `/icm`, `/ranges`, `/double-board`, `/bomb-pot`

### `apps/api` — Backend (FastAPI)
Key routers: `equity.py`, `solver.py`, `quiz.py`, `hh.py`, `plo.py`, `double_board.py`, `bomb_pot.py`, `icm.py`

### `apps/solver` — GTO Solver (Python MCCFR)

### `packages/poker-core` — Shared Poker Logic
`deck.py`, `hand.py`, `equity.py`, `range.py`, `plo4.py`, `omaha_hi_lo.py`, `shortdeck.py`, `double_board.py`, `bomb_pot.py`

---

## External Libraries

| Library | Stars | Use |
|---------|-------|-----|
| [HenryRLee/PokerHandEvaluator](https://github.com/HenryRLee/PokerHandEvaluator) | 501 | PLO4/PLO5/Hi-Lo hand evaluation |
| [zekyll/OMPEval](https://github.com/zekyll/OMPEval) | 224 | NLH hand evaluator (C++) |
| [siavashg87/poker-odds-calc](https://github.com/siavashg87/poker-odds-calc) | 99 | Multi-variant equity |
| [ksoeze/OmahaRangeExplorer](https://github.com/ksoeze/OmahaRangeExplorer) | 4 | Python PLO4 range builder |
| [apcode/poker-mtt-icm](https://github.com/apcode/poker-mtt-icm) | 12 | Tournament ICM |

---

## PLO4 Implementation

PLO4 uses 4 hole cards per player. Best 2-card combination from 4 + best 3-card combination from 5 board = 5-card poker hand.

**Key library:** `PokerHandEvaluator` — 501 stars, C++/Python, native PLO4/PLO5/Hi-Lo with wheel/broadway/four-straight detection.

```python
# PLO4 hand evaluation flow
from poker_hand_evaluator import evaluate

hand = ["Ah", "Kd", "Tc", "9s"]   # 4 hole cards
board = ["Js", "8d", "2h"]        # 3 board cards

# Best hand = best 2-of-4 + board 3-of-5
result = evaluate(hand, board)  # returns hand_rank (lower = better)
```

### Backend Routers

```
plo4_equity.py      — PLO4 equity endpoints (/api/v1/plo4/equity, /api/v1/plo4/range-equity)
plo4_ranges.py     — PLO4 range builder + push/fold charts
```

---

## Double Board PLO (Phase 2d — Novel)

Two independent boards per showdown. Player scoops if they win **both** boards; chops if they win one; wins nothing if they lose both.

**Scoring formula:**
```
adjusted_equity = (scoop_wins × 1.0 + chop_wins × 0.5) / total_sims
```

**Frontend page:** `/double-board` — board selector for both boards, hand input, scoop/chop equity display.

**Key challenge:** Standard hand evaluators are built for single-board. Double board requires two independent evaluations and a scoop accumulator.

### Double Board PLO Architecture

```
double_board.py
├── DoubleBoardEvaluator
│   ├── evaluate(hole, board1, board2) -> (rank1, rank2)
│   └── evaluate_showdown(holes, board1, board2) -> scoop_results
├── DoubleBoardEquity
│   ├── calculate(hand1, hand2, board1, board2) -> (eq1, eq2)
│   ├── _monte_carlo() -> simulates remaining cards
│   └── _exact_equity() -> complete board enumeration
└── ScoopTracker
    ├── scoop_wins, chop_wins, total_sims
    └── adjusted_equity property
```

**Core logic:**
- For each simulation: evaluate player hand on board1 AND board2 independently
- Player 1 scoops: wins 1.0 (both boards better)
- Player 1 chops: wins 0.5 (one board better, one worse — tie)
- Neither scoops nor chops: 0.0

**API Endpoints:**
- `POST /api/v1/double-board/equity` — calculate double board equity
- `POST /api/v1/double-board/hand-rank` — evaluate hand on both boards

---

## Bomb Pot (Phase 2d — Novel)

**Rules twist:** Actions happen BEFORE the board is dealt. In a bomb pot, players post straddle/junk blinds that are larger than normal, and betting proceeds pre-flop with no option to fold (until post-flop action). The board is then dealt and regular post-flop betting continues.

**Key properties:**
- No pre-flop "fold" option exists for players who posted straddle
- All players see the flop/turn/river regardless of pre-flop action
- Often played as a "action game" variant

**Frontend page:** `/bomb-pot` — player count, straddle map (which positions straddle and how much), junk blind amounts.

**Key challenge:** Game theory for bomb pots is non-standard — theInfoset model changes because the initial state includes a straddle-round rather than a fold-round.

### Bomb Pot Architecture

```
bomb_pot.py
├── BombPotGameState
│   ├── straddle_map: Dict[Position, int]  # which positions straddle and amounts
│   ├── junk_blinds: List[int]              # extra blinds from bomb pot rules
│   ├── betting_order: List[Position]       # who acts next
│   └── phase: Phase (STRADDLE_ROUND, FLOP, TURN, RIVER)
├── BombPotAction
│   ├── action_type: ActionType (STRADDLE, CALL, RAISE, CHECK)
│   ├── amount: int (for raises)
│   └── player: Position
├── BombPotGameModel
│   ├── create_straddle_map(positions, amounts) -> Dict
│   ├── next_bettor(state) -> Position
│   ├── resolve_preflop(state) -> (pot, betting_complete)
│   └── is_betting_complete(state) -> bool
```

**Game model properties:**
- `straddle_map`: Maps position -> straddle amount. E.g., `{1: 20, 3: 40}` means UTG+1 straddle $20, CO straddle $40
- `junk_blinds`: Additional dead money from bomb pot rules (ante, straddle adds to pot)
- `betting_order`: Order of players who act in straddle round

**Key difference from standard poker:**
- Round 0 = straddle round (no fold option)
- Players who straddle are automatically in the hand
- Straddle is a raise option, not mandatory (unless "mandatory straddle" rule)

**API Endpoints:**
- `POST /api/v1/bomb-pot/game-state` — create new bomb pot game state
- `POST /api/v1/bomb-pot/action` — submit an action
- `GET /api/v1/bomb-pot/equity` — calculate bomb pot equity given state

---

## Phase 2b/2c/2d Skills

Each sub-phase uses targeted skills:

| Phase | Primary Skill | Secondary Skill | Description |
|-------|--------------|-----------------|-------------|
| 2b PLO4 | `repo-transmute` | `test-driven-development` | Adapt PokerHandEvaluator bindings, test equity |
| 2c Omaha+Shortdeck | `docker-patterns` | `test-driven-development` | Dockerize PHE library, add variant eval |
| 2d Double Board | `blueprint` | `test-driven-development` | Plan novel architecture, scoop/chop logic |
| 2d Bomb Pot | `blueprint` | `test-driven-development` | Plan action-first game model, no-fold preflop |

---

*Last updated: 2026-05-26*