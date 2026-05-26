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