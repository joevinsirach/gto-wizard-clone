# GTO Wizard Clone — Architecture Specification

## Overview

Open-source GTO poker training platform with equity calculator, CFR solver, training modes, hand history analysis, and ICM calculator.

**Created:** 2026-05-25
**Status:** In Development

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         CLIENT (Browser)                            │
│  Next.js 15 + React 19 + TypeScript + Tailwind + Shadcn UI          │
│  WebSocket (Socket.io) ←→ Solver progress streaming                 │
└────────────────────────┬────────────────────────────────────────────┘
                         │ REST + WebSocket
┌────────────────────────▼────────────────────────────────────────────┐
│                      FASTAPI API GATEWAY                             │
│  /api/v1/*  — REST endpoints                                        │
│  /ws/*      — WebSocket for real-time (solve progress, quiz events) │
│  Auth: JWT tokens                                                   │
└─────┬──────────────────────┬───────────────────────────────────────┘
      │                      │
┌─────▼──────┐    ┌──────────▼──────────┐
│   Redis    │    │   PostgreSQL (Neon) │
│   Cache    │    │   User data,        │
│   Sessions │    │   strategies, HH    │
│   Equity   │    │                    │
│   caches   │    │                    │
└────────────┘    └────────────────────┘
                       │
        ┌──────────────┼──────────────────┐
        │              │                  │
┌───────▼─────┐ ┌──────▼──────┐ ┌────────▼────────┐
│ GTO Solver  │ │  Background │ │  HH Parser      │
│ gRPC Service│ │  Task Queue │ │  Worker         │
│ Python 3.12 │ │  (Celery)   │ │                 │
│ MCCFR      │ │             │ │                 │
└─────────────┘ └─────────────┘ └─────────────────┘
```

---

## Application Structure

### `apps/web` — Frontend

**Stack:** Next.js 15, React 19, TypeScript, Tailwind CSS, Shadcn UI, Socket.io Client, Chart.js

**Purpose:** User-facing web application

**Key pages:**
- `/` — Landing + feature overview
- `/equity` — Equity calculator
- `/train` — Training quizzes
- `/analyze` — Hand history upload + analysis
- `/icm` — ICM calculator
- `/ranges` — Range builder
- `/dashboard` — User progress dashboard
- `/auth` — Login/signup

**Components:**
- `RangeSelector` — 13x13 grid for hand range selection
- `EquityChart` — Bar/line chart for equity display
- `StrategyHeatmap` — Color-coded strategy visualization
- `HandHistoryViewer` — HH playback with GTO comparison
- `QuizCard` — Training quiz interface
- `ICMCalculator` — Tournament ICM inputs/outputs

---

### `apps/api` — Backend API

**Stack:** FastAPI, Pydantic v2, SQLAlchemy, Socket.io, Celery, Redis, PostgreSQL

**Purpose:** REST API + WebSocket server + task queue

**Endpoints:**

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/v1/auth/register` | User registration |
| POST | `/api/v1/auth/login` | Login, returns JWT |
| GET | `/api/v1/equity/calculate` | Compute equity (sync for small, async for large) |
| POST | `/api/v1/equity/batch` | Batch equity jobs |
| GET | `/api/v1/solver/status/{job_id}` | Check solve job status |
| POST | `/api/v1/solver/solve` | Submit a GTO solve job |
| GET | `/api/v1/solver/strategy/{spot_id}` | Retrieve stored strategy |
| POST | `/api/v1/hh/upload` | Upload hand history file |
| GET | `/api/v1/hh/hands` | Query stored hands |
| POST | `/api/v1/quiz/submit` | Submit quiz answer |
| GET | `/api/v1/quiz/stats` | User quiz statistics |

**WebSocket Events:**
- `solve:progress` — Solver iteration progress
- `solve:complete` — Strategy ready
- `quiz:next` — New quiz question ready

---

### `apps/solver` — GTO Solver Engine

**Stack:** Python 3.12, NumPy, Numba, gRPC

**Purpose:** High-performance CFR Nash equilibrium solver

**Algorithm:** Monte Carlo CFR (MCCFR) with chance sampling

**Solved game types:**
- No-Limit Hold'em (2-6 players)
- Pot-Limit Omaha (future)

**Solve categories:**
1. **Pre-flop** — Pre-computed push/fold tables for all stack sizes
2. **Post-flop** — On-demand solve for specific flop/turn/river boards
3. **Custom** — User-defined bet sizes, stack depths, board textures

**Performance targets:**
| Spot Type | 2 Players | 3+ Players |
|-----------|-----------|------------|
| River (1 card) | <1s | <5s |
| Turn (2 cards) | <10s | <60s |
| Flop (3 cards) | <60s | <300s |

**Storage:** Solved strategies serialized to JSON, stored in PostgreSQL. Key format: `{game_type}:{players}:{board}:{bet_sizes}:{stack_depth}`.

---

### `packages/poker-core` — Shared Poker Logic

**Stack:** Python + TypeScript (compiled)

**Purpose:** Core poker mathematics, shared between web and API

**Capabilities:**
- Deck generation
- Hand evaluation (2-7 card combinations)
- Equity calculation (enumerate all combo vs combo)
- Range parsing (e.g., "JJ+, AQs+, KJs")
- Hand history parsing (PokerStars, GGPoker, Winamax formats)

**Python sub-package:** Optimized with NumPy for equity calcs
**TypeScript package:** For web UI equity previews

---

### `packages/types` — Shared TypeScript Types

**Purpose:** Single source of truth for type definitions

**Key types:**
```typescript
HandRange = string  // e.g., "JJ+, AQs+, KJs"
Board = string      // e.g., "Kd7h2c"
EquityResult = { hand: string, equity: number, ev: number }
GTOStrategy = { action: 'raise' | 'call' | 'fold', frequency: number, ev: number }
SolveJob = { id: string, status: 'queued' | 'running' | 'complete' | 'error', progress: number }
```

---

### `packages/ui-components` — Shared UI Library

**Purpose:** Shared React components for web + potential mobile

**Components:**
- `Button`, `Input`, `Card` — Base UI
- `RangeGrid` — 13x13 poker hand matrix selector
- `EquityBar` — Equity comparison bar chart
- `StrategyMatrix` — GTO strategy heatmap

---

## Database Schema (Neon PostgreSQL)

```sql
-- Users
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- GTO Strategies (pre-solved spots)
CREATE TABLE strategies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_type TEXT NOT NULL,     -- 'nlh', 'plo'
  players INTEGER NOT NULL,
  board TEXT NOT NULL,         -- 'Kd7h2c' or empty for preflop
  pot_size INTEGER NOT NULL,
  stack_depth INTEGER NOT NULL,
  strategy_data JSONB NOT NULL,
  solved_at TIMESTAMPTZ DEFAULT NOW()
);

-- Solve Jobs
CREATE TABLE solve_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  params JSONB NOT NULL,
  status TEXT DEFAULT 'queued',  -- queued, running, complete, error
  progress INTEGER DEFAULT 0,
  result JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Hand Histories
CREATE TABLE hand_histories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  site TEXT NOT NULL,           -- 'pokerstars', 'ggpoker', 'winamax'
  raw_text TEXT NOT NULL,
  parsed_data JSONB NOT NULL,
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- Quiz Results
CREATE TABLE quiz_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  spot_type TEXT NOT NULL,
  user_action TEXT NOT NULL,
  gto_action TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL,
  ev_loss REAL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## Infrastructure

### Docker Compose

- **postgres** — Neon (external, not Docker)
- **redis** — `redis:7-alpine`
- **api** — FastAPI app
- **solver** — Python gRPC service
- **worker** — Celery worker for background tasks
- **web** — Next.js (Node)

### CI/CD (GitHub Actions)

- Path-filtered builds per app
- `apps/web/**` → Node build + Docker push
- `apps/api/**` → Python lint + tests + Docker push
- `apps/solver/**` → Python lint + tests + Docker push
- Semantic release on main branch merge

---

## Development Workflow

1. Fork/branch from `main`
2. Implement feature in isolated workspace
3. Write tests (pytest for Python, Playwright for E2E)
4. PR with description → code review
5. Squash merge to main → auto-deploy

---

## External Dependencies

| Service | Purpose | Cost |
|---------|---------|------|
| Neon | PostgreSQL | Free tier (2GB) |
| Redis Cloud | Cache | Free tier |
| GitHub Container Registry | Docker images | Free |
| Vercel | Frontend hosting | Free tier |
| Railway/Render | API + Solver hosting | Pay-as-go |

---

## Key Algorithms

### MCCFR (Monte Carlo Counterfactual Regret Minimization)

1. Initialize strategy for all infosets (empty)
2. For N iterations:
   - Sample game tree (with chance sampling for cards)
   - Play to terminal state
   - Update regrets for each infoset visited
3. Normalize regrets → Nash equilibrium strategy

### Equity Calculation

1. Enumerate all possible opponent hands (combinatorics)
2. For each combo, enumerate all 5-card board combinations
3. Evaluate hand ranks via OMPEval
4. Aggregate equity percentages

### ICM (Independent Chip Model)

```
EV_i = Σ (p_j * prize_j) / chips_i
where p_j = probability of finishing in place j
```

Computed via dynamic programming over tournament payout structure.

---

*Last updated: 2026-05-25*