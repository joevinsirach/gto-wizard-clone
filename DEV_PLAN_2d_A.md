# DEV_PLAN.md — Phase 2d-A: Double Board PLO

## Overview

Double Board PLO is a novel variant where two independent boards are dealt per showdown. Players must win **both** boards to scoop the pot. The scoring is: `adjusted_equity = (scoop_wins × 1.0 + chop_wins × 0.5) / total_sims`

## Architecture

### Core Components

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

### Scoring Logic

| Outcome | Condition | Points |
|---------|-----------|--------|
| Scoop win | Player wins BOTH boards | 1.0 |
| Chop | Player wins one, loses one | 0.5 |
| Loss | Player loses BOTH boards | 0.0 |

### API Endpoints

- `POST /api/v1/double-board/equity` — calculate double board equity
- `POST /api/v1/double-board/hand-rank` — evaluate hand on both boards

## Implementation Plan

1. **DoubleBoardEvaluator**: Uses PLO4Evaluator internally; evaluates each hole hand against each board independently, returns tuple of (rank1, rank2)
2. **ScoopTracker**: Accumulates wins/chops across simulations; computes adjusted_equity
3. **DoubleBoardEquity**: Orchestrates Monte Carlo or exact enumeration; returns scoop-adjusted equity percentages
4. **Tests**: Unit tests for evaluator, equity calculator, and scoop tracking

## Dependencies

- `PLO4Evaluator` from `gto_poker.plo4`
- `Deck` from `gto_poker.deck`
- Standard library: `random`, `itertools.combinations`

## File Locations

- Module: `/tmp/gto-wizard-clone/packages/poker-core/src/gto_poker/double_board.py`
- Tests: `/tmp/gto-wizard-clone/packages/poker-core/tests/test_double_board.py`