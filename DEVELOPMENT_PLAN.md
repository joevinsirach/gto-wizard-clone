---

## Phase 2d: Double Board PLO + Bomb Pot (Week 7 — Novel Implementation)

### 2d-A: Double Board PLO (Novel)

**Rules:** Two independent boards. Player scoops if they win both boards; chops if they win one; loses both.

**Scoring:**
```
adjusted_equity = (scoop_wins × 1.0 + chop_wins × 0.5) / total_sims
```

**Files:**
- `packages/poker-core/src/gto_poker/double_board.py` — DoubleBoardEvaluator + DoubleBoardEquity
- `packages/poker-core/tests/test_double_board.py` — TDD tests
- `apps/api/routers/double_board.py` — REST endpoints
- `apps/web/src/app/double-board/page.tsx` — Frontend UI

**Key classes:**
- `DoubleBoardEvaluator.evaluate(hole, board1, board2)` → (rank1, rank2)
- `DoubleBoardEquity.calculate(hand1, hand2, board1, board2, samples)` → (eq1, eq2, scoop_stats)
- `ScoopTracker` — tracks scoop_wins, chop_wins, total_sims, adjusted_equity

**Test scenarios:**
1. Both players scoop different boards → equity split
2. One player scoops both → 100% equity for scooper
3. Chop scenario → 50% equity
4. Exact board evaluation (no Monte Carlo)
5. Monte Carlo simulation

### 2d-B: Bomb Pot (Novel)

**Rules:** Pre-flop action happens BEFORE board is dealt. No fold option for straddlers. Straddle round is mandatory action round.

**Game model:**
- `straddle_map`: Dict[Position, int] — which positions straddle and how much
- `junk_blinds`: List[int] — extra dead money from bomb pot rules
- `betting_order`: List[Position] — who acts in straddle round
- `phase`: STRADDLE_ROUND → FLOP → TURN → RIVER

**Files:**
- `packages/poker-core/src/gto_poker/bomb_pot.py` — BombPotGameState + BombPotGameModel
- `packages/poker-core/tests/test_bomb_pot.py` — TDD tests
- `apps/api/routers/bomb_pot.py` — REST endpoints
- `apps/web/src/app/bomb-pot/page.tsx` — Frontend UI

**Key classes:**
- `BombPotGameState` — holds straddle_map, junk_blinds, betting_order, phase
- `BombPotAction` — action_type (STRADDLE/CALL/RAISE/CHECK), amount, player
- `BombPotGameModel` — creates straddle map, resolves preflop, checks betting complete

**Test scenarios:**
1. Create bomb pot with straddle_map → verify pot size
2. Action order respects betting_order
3. No fold allowed in straddle round
4. Resolve preflop → transition to flop phase
5. Equity calculation with straddle in pot

### 2d-C: Frontend Pages

**`/double-board`** — Double Board PLO equity calculator
- Two board card selectors (independent)
- Hand input for 2+ players
- Scoop/chop/win display
- Monte Carlo + exact modes

**`/bomb-pot`** — Bomb Pot game setup
- Player count selector (2-6)
- Straddle map builder (which positions straddle, amounts)
- Junk blind configuration
- Pre-flop action simulator

### 2d-D: Backend Routers

**`/api/v1/double-board/equity`** — POST
- Input: { hands, board1, board2, samples }
- Output: { equities[], scoop_stats[], samples }

**`/api/v1/bomb-pot/game-state`** — POST
- Input: { player_count, straddle_map, junk_blinds }
- Output: { game_state_id, pot, phase, betting_order }

**`/api/v1/bomb-pot/action`** — POST
- Input: { game_state_id, action }
- Output: { updated_state, pot, phase }

---

*Phase 2d created: 2026-05-26*
---

## Phase 4: Training Mode (Week 9-10)

### Quiz Database Schema

**Models** (`apps/api/services/quiz_models.py`):
- `QuizSpot` — poker spots with board, ranges, pot size, stack depth, GTO action
- `QuizSubmission` — user's answer to a quiz spot
- `UserStats` — per-user accuracy tracking and streaks
- `ReviewSpot` — spots marked for review by user

**Spot categories**: `3-bet pot`, `open-raise pot`, `overcard board`, `monoboard`, `paired board`, `wet board`, `straight completed`
**Difficulties**: `beginner`, `intermediate`, `advanced`
**Streets**: `preflop`, `flop`, `turn`, `river`

### API Endpoints (`apps/api/routers/quiz.py`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/quiz/random` | Random spot with optional filters |
| POST | `/api/v1/quiz/submit` | Submit answer, compare GTO, record result |
| GET | `/api/v1/quiz/stats/{user_id}` | User accuracy and streak tracking |
| GET | `/api/v1/quiz/leaderboard` | Users ranked by accuracy + solves |
| GET | `/api/v1/quiz/categories` | All spot categories + difficulties |
| GET | `/api/v1/quiz/missed/{user_id}` | Missed spots for review mode |
| POST | `/api/v1/quiz/review/{spot_id}` | Mark spot for review |

### WebSocket for Quiz (`apps/api/routers/quiz_ws.py`)

Endpoint: `/ws/quiz`

Events:
- `join_quiz_session` — join a real-time quiz session room
- `leave_quiz_session` — leave current session
- `quiz_answer` — broadcast answer to all participants
- `request_leaderboard` — get current session leaderboard

Broadcast events:
- `quiz:user_answered` — real-time answer notification
- `quiz:user_joined` / `quiz:user_left` — participation updates
- `leaderboard` — current rankings

### Frontend Components

**`apps/web/src/hooks/useQuizApi.ts`** — React hook for quiz API:
- `fetchRandomSpot(category?, difficulty?)` → `QuizSpot`
- `submitAnswer(...)` → `QuizAnswerResponse`
- `fetchUserStats(userId)` → `UserStats`
- `fetchCategories()` → `Category[]`

**`apps/web/src/app/train/page.tsx`** — Training mode UI with:
- QuizCard for showing spot and receiving user action
- Category/difficulty filters
- Accuracy charts and weak spot analysis
- Session stats sidebar

**`apps/web/src/app/train/review/page.tsx`** — Review mode for missed spots

**`apps/web/src/components/train/LeaderboardPanel.tsx`** — Real-time leaderboard widget

### EV Loss Calculation

When user selects wrong action:
```
ev_loss = gto_ev - selected_action_ev
```

If user's EV is lower, they "lost" the difference in expected value.

### Leaderboard Scoring

```
score = correct_count × 10 + streak × 2 - avg_ev_loss × 100
```

Ranked by score descending (min 10 solves for ranking).

### Key Files

- `apps/api/routers/quiz.py` — REST API for quiz
- `apps/api/routers/quiz_ws.py` — WebSocket for real-time quiz
- `apps/api/services/quiz_models.py` — SQLAlchemy models
- `apps/api/prisma/seed.py` — 50+ seeded quiz spots
- `apps/web/src/hooks/useQuizApi.ts` — API hook
- `apps/web/src/app/train/page.tsx` — Training page
- `apps/web/src/app/train/review/page.tsx` — Review mode page
- `apps/web/src/components/train/QuizCard.tsx` — Quiz interaction component
- `apps/web/src/components/train/LeaderboardPanel.tsx` — Leaderboard widget
