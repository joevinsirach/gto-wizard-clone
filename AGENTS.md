# AGENTS.md — GTO Wizard Clone

## About
Open-source GTO poker training platform. Equity calculator, CFR solver, training modes, hand history analysis, ICM calculator, push/fold charts, and training courses. Live at `wiz.codeovertcp.com`.

**Status:** Active development — core features exist, polish needed.

## Architecture

### Stack
- **Frontend**: Next.js 15 + React 19 + TypeScript + Tailwind CSS v4 + shadcn/ui
- **Backend**: Python 3.12 FastAPI on port 8002
- **Solver**: Python MCCFR engine (apps/solver/) with gRPC
- **Cache**: Redis (fakeredis fallback)
- **Database**: PostgreSQL (Neon) via SQLAlchemy
- **Monorepo**: Nx with TurboRepo

### Key Directories
| Path | Purpose |
|------|---------|
| `apps/web/` | Next.js frontend (22+ page routes) |
| `apps/web/src/app/` | Page routes by path |
| `apps/web/src/components/` | Shared React components (equity, stud, badugi, hh, icm, train) |
| `apps/web/src/lib/` | API client library |
| `apps/api/` | FastAPI backend (11 routers) |
| `apps/api/routers/` | API route handlers |
| `apps/solver/` | MCCFR solver engine |
| `packages/poker-core/` | Shared poker logic (equity, hand eval, range, variants) |
| `packages/ui-components/` | Shared UI components |
| `packages/types/` | TypeScript type definitions |

### Available API Routes
`/api/v1/equity`, `/api/v1/variants`, `/api/v1/solver`, `/api/v1/courses`, `/api/v1/quiz`,
`/api/v1/icm`, `/api/v1/hh`, `/api/v1/strategy`, `/api/v1/plo4`, `/api/v1/omaha`,
`/api/v1/double-board`, `/api/v1/bomb-pot`

## Conventions
- **Setup**: `source .venv/bin/activate && pip install -e packages/poker-core`
- **Backend dev**: `PYTHONPATH=apps/api python -m uvicorn main:app --reload --port 8002`
- **Frontend dev**: `cd apps/web && npm run dev`
- **Tests**: `uv sync` first (pytest not currently in venv), then `python -m pytest packages/poker-core/tests/`
- **Commits**: Conventional commits (`feat:`, `fix:`, `test:`, `docs:`)
- **Python**: 3.12+, ruff linting (line-length 100)

## Skills
These skills are loaded automatically when the Player works on this project:

| Skill | When | Why |
|-------|------|-----|
| `subagent-driven-development` | Complex features with multiple independent components | Parallel delegation for speed |
| `test-driven-development` | Test-heavy tasks (fix-dev-env, add-e2e-tests) | Enforce red-green-refactor discipline |
| `systematic-debugging` | Any task where tests fail or behavior is unexpected | 4-phase root cause debugging |

## Tasks

Ordered by priority. Each task is one unit of work for one player tick.

### Task: fix-dev-environment
- **Description**: Install pytest and test dependencies in the .venv. Ensure `uv sync` works and all existing tests run without errors. Declare dependencies properly in pyproject.toml (pytest, fastapi, uvicorn, httpx, etc.).
- **Success criteria**: `python -m pytest packages/poker-core/tests/ -q` exits 0. `python -m pytest apps/api/tests/ -q` exits 0. `python -m pytest apps/solver/tests/ -q` exits 0.
- **Coach checks**:
  - pyproject.toml has proper `[dependency-groups]` or `[project.optional-dependencies]` with test deps
  - No unrelated files changed
  - Tests actually pass, not just exist
  - `uv sync --no-dev` (or equivalent) still works cleanly
- **Skills**: none beyond project defaults

### Task: fix-variant-equity-pages
- **Description**: The Stud, Badugi, and Razz variant equity pages exist at `/equity/stud`, `/equity/badugi`, `/equity/razz` but are thin (~100 lines vs NLH equity's 748). Wire them to the `/api/v1/variants/{key}/equity` endpoint and verify they render correct equity results for each variant.
- **Success criteria**:
  - Stud equity calculator selects 3 down cards, 0-4 up cards per player
  - Badugi equity calculator selects 4 cards per player, evaluates lowball
  - Razz equity calculator selects 7 cards, evaluates lowball
  - Each page returns equity API response with valid hero/villain equity split
  - No console errors on page load
- **Coach checks**:
  - Test each variant page loads with a known hand matchup
  - Verify API call shape matches EquityRequest schema
  - Check for broken imports or missing component references
  - Confirm the page is navigable from the /equity index
- **Skills**: none

### Task: polish-courses-page
- **Description**: The courses page exists (327 lines) but needs full integration with the `/api/v1/courses` endpoint. Ensure course listing, filtering by category/difficulty, and detail view all work correctly with the 5 seeded courses.
- **Success criteria**:
  - Courses load from API and display correctly
  - Filter by difficulty (beginner/intermediate/advanced) works
  - Filter by category (preflop/postflop/icm) works
  - Clicking a course shows its lessons
  - Empty state handled gracefully
- **Coach checks**:
  - API returns correct course data
  - No hardcoded mock data in production code paths
  - Loading states present
  - Error states handled
- **Skills**: none

### Task: add-e2e-smoke-tests
- **Description**: Add Playwright E2E smoke tests covering the 5 most important user flows: landing page loads, equity calculator runs, ICM calculator loads, courses list displays, variant selector page loads.
- **Success criteria**: `cd apps/web && npx playwright test` with 5 passing smoke tests.
- **Coach checks**:
  - Tests run against the live dev server (localhost:3000)
  - Tests check real API responses, not static content
  - No test overlaps with existing test files
- **Skills**: none

### Task: add-stud-draw-variant-selectors
- **Description**: The stud and draw variants (Stud, Razz, Badugi, 2-7 Triple Draw, etc.) exist in the API but lack dedicated landing pages. Create a variant selector page at `/variants` that lists all 10 registered variants from `/api/v1/variants` with descriptions, categories, and links to their equity calculators. Allow filtering by category (flop, stud, draw, community).
- **Success criteria**:
  - 10 variants displayed with correct metadata
  - Filter by category works
  - Each variant links to its equity calculator page (existing or stub)
  - Mobile-responsive layout
- **Coach checks**:
  - API returns 10 variants with correct categories
  - All links resolve to existing pages
  - Missing variant pages redirect gracefully
  - No console errors
- **Skills**: none

## Coach Configuration
- **Review scope**: git diff of latest commit, test output, success criteria from AGENTS.md task, console errors from frontend pages (check via curl/browser)
- **Pass conditions**: All success criteria for the task are met. No regression in previously passing tests. No console errors introduced.
- **Fail actions** (descending severity):
  1. Coach creates a corrective commit fixing the issue directly
  2. Coach reverts the commit and creates a fix task pinned to the issue
  3. For ambiguous or high-risk failures, coach blocks and tags for human review
