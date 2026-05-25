# GTO Wizard Clone — Development Plan

## Overview
This is a comprehensive 14-week development plan for building a full-featured GTO poker training platform. All tasks are designed for autonomous execution via cron jobs.

## Skills and Repositories to Power the Platform

### 🔬 Core Poker Libraries
| Library | Purpose | Stars |
|---------|---------|-------|
| `zekyll/OMPEval` | Fast C++ hand evaluator | 224 |
| `siavashg87/poker-odds-calc` | Fast Node equity calc | 99 |
| `thotbreakerr/Texas-Holdem-AI` | MCCFR + GTO reference | 1 |
| `apcode/poker-mtt-icm` | Python ICM calculator | 12 |
| `battermann/equiweb` | In-browser range equity | 8 |
| `aneopsy/PokerStats` | PokerStars HH parser | 18 |

### 🛠️ Tech Stack
| Layer | Choice |
|-------|--------|
| Frontend | Next.js 15, React 19, TypeScript, Tailwind v4, Shadcn UI |
| Backend | FastAPI (Python 3.12), Pydantic v2, WebSockets |
| Solver | Python 3.12, NumPy, Numba, MCCFR algorithm |
| Database | PostgreSQL (Neon serverless) |
| Cache | Redis |
| Container | Docker + Docker Compose |
| CI/CD | GitHub Actions (path-filtered) |

---

## Phase 1: Foundation (Week 1-2)

### Week 1 — Repo & Infrastructure
- [ ] Initialize monorepo with Turbo
- [ ] Set up Docker Compose (api, solver, web, redis)
- [ ] Configure GitHub Actions CI/CD
- [ ] Add PostgreSQL (Neon) connection
- [ ] Create `packages/poker-core` — deck, hand, equity modules
- [ ] Write unit tests for poker core
- [ ] Set up `apps/api` FastAPI skeleton
- [ ] Set up `apps/web` Next.js skeleton
- [ ] Add shared TypeScript types package

### Week 2 — Core Poker Logic
- [ ] Implement `Deck` class (52-card, shuffle, draw)
- [ ] Implement `Card` class (rank/suit parsing)
- [ ] Implement `HandEvaluator` (best 5-card from 5-7)
- [ ] Implement `EquityCalculator` (exact + Monte Carlo)
- [ ] Implement `RangeParser` (JJ+, AKs, etc.)
- [ ] Build equity REST endpoint
- [ ] Build equity WebSocket endpoint
- [ ] Add Redis caching for equity results
- [ ] Write integration tests

---

## Phase 2: Equity Calculator (Week 3-4)

### Week 3 — Equity UI + Engine
- [ ] Build `RangeSelector` component (13x13 grid)
- [ ] Build `EquityChart` component (bar chart)
- [ ] Implement Monte Carlo equity engine
- [ ] Implement range expansion algorithm
- [ ] Build equity vs range calculation
- [ ] Add equity visualization (heatmaps)
- [ ] WebSocket for real-time equity updates
- [ ] Redis caching layer (key: hand+range+board)

### Week 4 — Advanced Equity
- [ ] Multi-way equity (3+ players)
- [ ] Omaha equity support
- [ ] Shortdeck support
- [ ] Equity comparison tool
- [ ] EV (Expected Value) calculation
- [ ] Fairness score calculation
- [ ] Export equity results (CSV/JSON)
- [ ] E2E tests with Playwright

---

## Phase 3: GTO Solver (Week 5-8)

### Week 5 — CFR Implementation
- [ ] Implement MCCFR algorithm
- [ ] Build game tree structure
- [ ] Implement chance sampling
- [ ] Build info set management
- [ ] Implement regret matching
- [ ] Test 2-player river solves
- [ ] Benchmark solve performance

### Week 6 — Pre-flop Strategy
- [ ] Build pre-flop push/fold charts
- [ ] Implement stack-size-aware strategy
- [ ] Pre-compute common scenarios (10bb, 20bb, 40bb)
- [ ] Store strategies in PostgreSQL
- [ ] Strategy serialization/deserialization
- [ ] Build strategy lookup API
- [ ] WebSocket progress streaming

### Week 7 — Post-flop Solver
- [ ] Flop solve engine
- [ ] Turn solve engine
- [ ] River solve engine
- [ ] Bet size optimization
- [ ] Pot size handling
- [ ] Multi-way pot support (3-6 players)
- [ ] Background job queue (Celery)
- [ ] Solve timeout handling

### Week 8 — Strategy UI
- [ ] Strategy visualization (heatmap)
- [ ] Strategy comparison (yours vs GTO)
- [ ] Frequency charts (raise/call/fold)
- [ ] EV display per action
- [ ] Strategy export (JSON, TXT)
- [ ] Custom scenario builder
- [ ] Solve job management UI
- [ ] E2E tests

---

## Phase 4: Training Mode (Week 9-10)

### Week 9 — Quiz Engine
- [ ] Build quiz database (pre-made spots)
- [ ] Implement spot randomization
- [ ] Build quiz submission API
- [ ] GTO answer comparison logic
- [ ] EV loss calculation per spot
- [ ] Accuracy tracking
- [ ] Streak tracking
- [ ] WebSocket for quiz updates

### Week 10 — Training UI + Gamification
- [ ] Quiz interface (Flop/Turn/River)
- [ ] Training dashboard
- [ ] Progress tracking (charts)
- [ ] Leaderboard system
- [ ] Spot categories (3-bet, overcard, etc.)
- [ ] Difficulty levels
- [ ] Review missed spots
- [ ] Training statistics

---

## Phase 5: Hand History (Week 11-12)

### Week 11 — HH Parsing
- [ ] PokerStars HH parser
- [ ] GGPoker HH parser
- [ ] Winamax HH parser
- [ ] HH file upload UI
- [ ] HH storage in PostgreSQL
- [ ] HH search/filter API
- [ ] Batch upload support
- [ ] HH validation and error handling

### Week 12 — HH Analysis
- [ ] HH playback viewer
- [ ] Leak identification vs GTO
- [ ] EV loss per spot category
- [ ] Most common mistakes report
- [ ] Export HH analysis (CSV)
- [ ] Tag and organize hands
- [ ] HH comparison (vs GTO)
- [ ] E2E tests

---

## Phase 6: ICM + Content (Week 13-14)

### Week 13 — ICM Calculator
- [ ] ICM algorithm implementation
- [ ] Push/fold charts
- [ ] Final table ICM
- [ ] Tournament scenario builder
- [ ] ICM training scenarios
- [ ] Bubble factor calculation
- [ ] ICM-aware GTO integration
- [ ] ICM UI components

### Week 14 — Content Library + Polish
- [ ] Pre-built courses
- [ ] Community spot sharing
- [ ] User-generated content
- [ ] Video content integration
- [ ] Mobile-responsive design
- [ ] PWA support
- [ ] Performance optimization
- [ ] Final integration testing
- [ ] Documentation

---

## Cron Job Architecture

All phases are designed for autonomous execution via cron jobs:

| Phase | Cron Schedule | Agent Tasks |
|-------|--------------|-------------|
| Foundation | Daily 9am, 3pm, 9pm | Build infrastructure, write core modules |
| Equity | Daily 9am, 3pm, 9pm | Implement equity engine, build UI |
| Solver | Every 4h (continuous) | Run CFR implementation, pre-flop tables |
| Training | Daily at 9am | Build quiz engine, training modes |
| HH | Daily at 3pm | HH parser, analysis tools |
| ICM | Daily at 9pm | ICM calculator, push/fold charts |
| Polish | Weekly | E2E tests, performance, docs |

## Repository Structure

```
gto-wizard-clone/
├── apps/
│   ├── web/              # Next.js frontend
│   │   ├── src/app/      # App router pages
│   │   ├── src/components/  # React components
│   │   ├── src/lib/      # Utilities
│   │   └── tests/       # Tests
│   ├── api/              # FastAPI backend
│   │   ├── main.py       # FastAPI app
│   │   ├── routers/      # API routes
│   │   ├── models/       # Pydantic models
│   │   ├── services/     # Business logic
│   │   └── tests/       # Tests
│   └── solver/           # Python CFR engine
│       ├── solver/       # MCCFR implementation
│       ├── service.py    # gRPC service
│       └── tests/        # Tests
├── packages/
│   ├── poker-core/       # Shared poker logic (TS + Python)
│   │   └── src/gto_poker/
│   ├── ui-components/    # Shared React components
│   └── types/            # Shared TypeScript types
├── infra/
│   └── docker/           # Docker configs
├── .github/workflows/    # CI/CD
├── SPEC.md               # Architecture spec
└── README.md             # Overview
```

---

## Quality Gates

Each phase must pass before moving to next:
1. Unit tests (≥80% coverage)
2. Integration tests
3. E2E tests (Playwright)
4. CI passes on all paths
5. Docker image builds successfully
6. No critical security issues

---

*Plan created: 2026-05-25*