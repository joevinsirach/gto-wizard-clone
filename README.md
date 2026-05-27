# GTO Wizard Clone

**Open-source GTO poker training platform** — equity calculator, CFR solver, PLO4 tools, double board / bomb pot solver, training modes, hand history analysis, ICM calculator, push/fold charts, training courses, and community spots.

## Supported Game Variants

| Variant | Status | Notes |
|---------|--------|-------|
| No-Limit Hold'em (NLH) | ✅ Ready | OMPEval (C++) |
| Pot-Limit Omaha 4 (PLO4) | ✅ Phase 2b | PokerHandEvaluator (C++/Python) |
| PLO5 (5-card Omaha) | 🔬 Phase 2c | 4-card from 5 eval |
| Omaha Hi/Lo (8-or-better) | 🔬 Phase 2c | Split pot, 8-qualifier |
| Shortdeck (6+ Hold'em) | 🔬 Phase 2c | Flush > full house |
| **Double Board PLO** | ✅ Phase 2d | Two boards, scoop/chop scoring |
| **Bomb Pot** | ✅ Phase 2d | Action-first betting, straddle games |

## Key Libraries

| Library | Stars | Use |
|---------|-------|-----|
| [HenryRLee/PokerHandEvaluator](https://github.com/HenryRLee/PokerHandEvaluator) | 501 | PLO4/PLO5/Hi-Lo hand evaluation |
| [zekyll/OMPEval](https://github.com/zekyll/OMPEval) | 224 | NLH hand evaluator (C++) |
| [siavashg87/poker-odds-calc](https://github.com/siavashg87/poker-odds-calc) | 99 | Multi-variant equity (Hold'em, Omaha, Shortdeck) |
| [ksoeze/OmahaRangeExplorer](https://github.com/ksooze/OmahaRangeExplorer) | 4 | Python PLO4 range builder |
| [apcode/poker-mtt-icm](https://github.com/apcode/poker-mtt-icm) | 12 | Tournament ICM calculations |

## Architecture

```
apps/web/        Next.js 15 frontend (React 19, TypeScript, Tailwind v4)
apps/api/        FastAPI backend (Pydantic v2, WebSockets, Celery)
apps/solver/     Python MCCFR engine (gRPC)
packages/
  poker-core/    Shared poker math (Python + TypeScript)
  types/         Shared TypeScript types
  ui-components/ React component library
```

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 15, React 19, TypeScript, Tailwind v4, Shadcn UI |
| Backend | FastAPI, Pydantic v2, SQLAlchemy, WebSockets |
| Solver | Python 3.12+, NumPy, Numba, MCCFR |
| PLO4/Omaha | PokerHandEvaluator (C++/Python) |
| Database | PostgreSQL (Neon serverless) |
| Cache | Redis |

## Quick Start

```bash
# Clone the repository
git clone https://github.com/ChonSong/gto-wizard-clone.git
cd gto-wizard-clone

# Start all services with Docker Compose
docker compose up

# Access the application
# Web UI: http://localhost:3000
# API: http://localhost:8000
# API Docs: http://localhost:8000/docs
```

## Development Phases

| Phase | Focus | Status |
|-------|-------|--------|
| Phase 1 | Foundation (monorepo, Docker, CI/CD) | ✅ Complete |
| Phase 2a | NLH Equity Calculator | ✅ Complete |
| Phase 2b | PLO4 Support | ✅ Complete |
| Phase 2c | Omaha Variants + Shortdeck | 🔬 Planned |
| Phase 2d | Double Board + Bomb Pot (novel) | ✅ Complete |
| Phase 3 | GTO Solver (MCCFR) | 🔬 In Progress |
| Phase 4 | Training Mode | ✅ Complete |
| Phase 5 | Hand History Analysis | ✅ Complete |
| **Phase 6** | **ICM Calculator & Polish** | **✅ Complete** |

---

## Features

### ICM Calculator (`/icm`)

ICM (Independent Chip Model) calculator for tournament equity calculations. Supports prize pool distribution, chip stack management, and tournament equity calculations.

**Features:**
- Prize Pool Panel — Configure tournament payouts (% and amounts)
- Chip Stack Panel — Add/remove players with chip amounts
- Tournament Settings — Buy-in and total chips
- ICM Results — Equity percentages and expected values
- Bubble Factor calculations
- Tournament scenario storage and management

**API Endpoints:**
- `POST /api/v1/icm/calculate` — Calculate ICM equity
- `POST /api/v1/icm/bubble-factor` — Calculate bubble factor for a player
- `GET /api/v1/icm/scenarios` — List stored scenarios
- `POST /api/v1/icm/scenarios` — Create a scenario
- `GET /api/v1/icm/scenarios/{id}` — Get a scenario
- `PUT /api/v1/icm/scenarios/{id}` — Update a scenario
- `DELETE /api/v1/icm/scenarios/{id}` — Delete a scenario

### Push/Fold Charts (`/strategies`)

Nash-equilibrium push/fold charts for tournament situations. Pre-generated charts for common stack sizes and positions.

**Features:**
- Filterable charts by stack depth and position
- Open push and call charts
- ICM-adjusted recommendations
- Strategy storage and retrieval (Redis-backed)
- Export functionality

**API Endpoints:**
- `POST /api/v1/strategy` — Store a GTO strategy
- `GET /api/v1/strategy/{key}` — Retrieve strategy by key
- `GET /api/v1/strategy/lookup` — Look up strategy by parameters
- `GET /api/v1/strategy` — List available strategies
- `DELETE /api/v1/strategy/{key}` — Delete a strategy

### Training Courses (`/courses`)

Pre-built training courses with structured lessons, progress tracking, and multiple difficulty levels.

**Features:**
- Course categories: Preflop, Postflop, ICM, GTO Fundamentals
- Difficulty levels: Beginner, Intermediate, Advanced
- Progress tracking with completion percentages
- Quick Stats dashboard
- Continue Training button for resuming courses
- Video, text, and quiz lesson content types

**API Endpoints:**
- `GET /api/v1/courses` — List all courses (filterable)
- `GET /api/v1/courses/featured` — List featured courses
- `GET /api/v1/courses/categories` — Get available categories/difficulties
- `GET /api/v1/courses/{id}` — Get course with lessons
- `POST /api/v1/courses` — Create a course
- `PUT /api/v1/courses/{id}` — Update a course
- `DELETE /api/v1/courses/{id}` — Delete a course
- `POST /api/v1/courses/lessons` — Create a lesson
- `GET /api/v1/courses/lessons/{id}` — Get a lesson
- `PUT /api/v1/courses/lessons/{id}` — Update a lesson
- `DELETE /api/v1/courses/lessons/{id}` — Delete a lesson
- `GET /api/v1/courses/user/{id}/progress` — Get user progress

### Community Spots (`/spots`)

Share and discover community strategy spots. View, like, fork, and practice community-contributed spots.

**Features:**
- Filter by position (BTN, SB, BB, CO, etc.)
- Filter by board type (dry, wet, paired, rainbow)
- Search functionality
- Sort by recent or popular
- Like/unlike spots
- Fork spots to your account
- Comment on spots
- Share new spot functionality
- Strategy heatmap for selected spots
- Practice this spot button

**API Endpoints:**
- `GET /api/v1/spots` — List spots (filterable)
- `POST /api/v1/spots` — Create a spot
- `GET /api/v1/spots/{id}` — Get spot details
- `PUT /api/v1/spots/{id}` — Update a spot
- `DELETE /api/v1/spots/{id}` — Delete a spot
- `POST /api/v1/spots/{id}/like` — Like a spot
- `DELETE /api/v1/spots/{id}/like` — Unlike a spot
- `GET /api/v1/spots/{id}/likes` — Get spot likes
- `POST /api/v1/spots/{id}/fork` — Fork a spot
- `POST /api/v1/spots/{id}/comments` — Add comment
- `GET /api/v1/spots/{id}/comments` — Get comments
- `DELETE /api/v1/spots/{id}/comments/{id}` — Delete comment

### Equity Calculator (`/equity`)

NLH and PLO4 equity calculator with range support.

**API Endpoints:**
- `POST /api/v1/equity/calculate` — Calculate hand equity
- `POST /api/v1/equity/range-vs-range` — Range vs range equity

### PLO4/Omaha (`/plo`)

Pot-Limit Omaha 4 support with specialized evaluators.

**API Endpoints:**
- `POST /api/v1/plo4/equity` — PLO4 equity calculation
- `POST /api/v1/plo4/range-equity` — PLO4 range equity

### Hand History Analysis (`/analyze`)

Upload, parse, and analyze poker hand histories.

**API Endpoints:**
- `POST /api/v1/hh/import` — Batch import hands
- `POST /api/v1/hh/batch-upload` — File upload
- `GET /api/v1/hh/hands` — Query hands with filters
- `GET /api/v1/hh/hands/{id}` — Get single hand
- `PATCH /api/v1/hh/hands/{id}/tags` — Update tags
- `GET /api/v1/hh/export` — CSV export
- `GET /api/v1/hh/stats` — Aggregated stats
- `POST /api/v1/hh/analyze-leaks` — Leak identification

---

## PWA Installation

GTO Wizard Clone supports Progressive Web App (PWA) installation on desktop and mobile devices.

**Installation Steps:**

**Desktop (Chrome/Edge/Brave):**
1. Visit the application URL
2. Click the install icon in the address bar (or overflow menu)
3. Click "Install" in the prompt
4. App will be installed and available in your app launcher

**Desktop (Firefox):**
1. Visit the application URL
2. Click the menu (≡) button
3. Select "Install" or "Save Application"
4. Follow the prompts

**Mobile (iOS Safari):**
1. Visit the application URL
2. Tap the Share button (square with arrow)
3. Scroll down and tap "Add to Home Screen"
4. Name the app and tap "Add"
5. App icon will appear on your home screen

**Mobile (Android Chrome):**
1. Visit the application URL
2. Tap the menu (⋮) button
3. Tap "Install app" or "Add to Home screen"
4. Follow the prompts

**PWA Features:**
- Offline support (service worker)
- App shortcuts for quick navigation
- Standalone display mode
- Theme-aware status bar
- 192x192 and 512x512 icons for all devices

**PWA Shortcuts:**
- ICM Calculator → `/icm`
- Courses → `/courses`
- Community Spots → `/spots`
- Equity Calculator → `/equity`

---

## Skills Integration

| Skill | Phase | Purpose |
|-------|-------|---------|
| `repo-transmute` | 2b, 2c | Adapt external poker lib code into codebase |
| `test-driven-development` | 2b, 2c, 2d | Tests before each evaluator implementation |
| `blueprint` | 2d | Plan novel double-board + bomb-pot architecture |
| `docker-patterns` | 1, 2b | Docker Compose for solver service |
| `e2e-testing` | all | Playwright E2E tests per feature |

---

## License

MIT