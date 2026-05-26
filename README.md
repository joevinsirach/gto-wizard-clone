# GTO Wizard Clone

**Open-source GTO poker training platform** — equity calculator, CFR solver, PLO4 tools, double board / bomb pot solver, training modes, hand history analysis, and ICM calculator.

## Supported Game Variants

| Variant | Status | Notes |
|---------|--------|-------|
| No-Limit Hold'em (NLH) | ✅ Equity ready | OMPEval (C++) |
| Pot-Limit Omaha 4 (PLO4) | 🔬 Phase 2b | PokerHandEvaluator (C++/Python) |
| PLO5 (5-card Omaha) | 🔬 Phase 2c | 4-card from 5 eval |
| Omaha Hi/Lo (8-or-better) | 🔬 Phase 2c | Split pot, 8-qualifier |
| Shortdeck (6+ Hold'em) | 🔬 Phase 2c | Flush > full house |
| **Double Board PLO** | 🔬 Phase 2d (novel) | Two boards, scoop/chop scoring |
| **Bomb Pot** | 🔬 Phase 2d (novel) | Action-first betting, straddle games |

## Key Libraries

| Library | Stars | Use |
|---------|-------|-----|
| [HenryRLee/PokerHandEvaluator](https://github.com/HenryRLee/PokerHandEvaluator) | 501 | PLO4/PLO5/Hi-Lo hand evaluation |
| [zekyll/OMPEval](https://github.com/zekyll/OMPEval) | 224 | NLH hand evaluator (C++) |
| [siavashg87/poker-odds-calc](https://github.com/siavashg87/poker-odds-calc) | 99 | Multi-variant equity (Hold'em, Omaha, Shortdeck) |
| [ksoeze/OmahaRangeExplorer](https://github.com/ksoeze/OmahaRangeExplorer) | 4 | Python PLO4 range builder |

## Architecture

```
apps/web/        Next.js 15 frontend
apps/api/        FastAPI backend
apps/solver/     Python MCCFR engine (gRPC)
packages/
  poker-core/    Shared poker math (Python + TypeScript)
  types/         Shared TypeScript types
  ui-components/ React component library
```

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 15, React 19, TypeScript, Tailwind v4 |
| Backend | FastAPI, Pydantic v2, WebSockets, Celery |
| Solver | Python 3.12, NumPy, Numba, MCCFR |
| PLO4/Omaha | PokerHandEvaluator (C++/Python) |
| Database | PostgreSQL (Neon serverless) |
| Cache | Redis |

## Quick Start

```bash
git clone https://github.com/ChonSong/gto-wizard-clone.git
cd gto-wizard-clone
docker compose up
```

## Development Phases

| Phase | Focus | Status |
|-------|-------|--------|
| Phase 1 | Foundation (monorepo, Docker, CI/CD) | ✅ Complete |
| Phase 2a | NLH Equity Calculator | 🔄 In progress |
| Phase 2b | PLO4 Support | 🔬 Planned |
| Phase 2c | Omaha Variants + Shortdeck | 🔬 Planned |
| Phase 2d | Double Board + Bomb Pot (novel) | 🔬 Planned |
| Phase 3 | GTO Solver (MCCFR) | 🔬 Planned |
| Phase 4 | Training Mode | 🔬 Planned |
| Phase 5 | Hand History Analysis | 🔬 Planned |
| Phase 6 | ICM + Polish | 🔬 Planned |

## Skills Integration

| Skill | Phase | Purpose |
|-------|-------|---------|
| `repo-transmute` | 2b, 2c | Adapt external poker lib code into codebase |
| `test-driven-development` | 2b, 2c, 2d | Tests before each evaluator implementation |
| `blueprint` | 2d | Plan novel double-board + bomb-pot architecture |
| `docker-patterns` | 1, 2b | Docker Compose for solver service |
| `e2e-testing` | all | Playwright E2E tests per feature |

## License

MIT