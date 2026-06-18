# AGENTS.md — GTO Wizard Clone

## About
Open-source GTO poker training platform. Equity calculator, CFR solver, training modes, hand history analysis, ICM calculator, push/fold charts, and training courses. Live at `wiz.codeovertcp.com`.

**Status:** Active development — core features exist, polish needed.

## Visual Reference Screenshots

The `docs/` directory contains screenshots of the real GTO Wizard that serve as the design target. When working on any page, the Player MUST:

1. Load the reference screenshot with `vision_analyze` to understand the target design
2. Load the live page with `browser_navigate` and take a screenshot with `browser_vision`
3. Compare the two and identify specific visual gaps
4. Fix gaps iteratively until the live page matches the reference

### Reference Files

| File | Target Page | What to Match |
|------|-------------|---------------|
| `docs/reference-dashboard.png` | `/` | Layout, navigation, cards, colors |
| `docs/reference-study-interface.png` | `/study` (postflop mode) | Board cards, action buttons, GTO frequencies, position columns |
| `docs/reference-study.png` | `/study` (preflop mode) | Hand matrix, position buttons, stack selector, action panel |
| `docs/reference-trainer.png` | `/practice` | Training interface, controls, feedback |
| `docs/reference-equity.png` | `/equity` | Equity calculator UI |
| `docs/reference-icm.png` | `/icm` | ICM calculator UI |
| `docs/reference-courses.png` | `/courses` | Course listing, progress |
| `docs/reference-solutions.png` | `/solutions` | Solutions browser |

### Key Design Patterns (from references)

**Study Page — Preflop Mode:**
- 13×13 hand matrix with color-coded cells (red=raise, blue=call, fold=gray)
- Position buttons (UTG/HJ/CO/BTN/SB/BB) with active position highlighted green
- Stack depth selector (50bb/75bb/100bb/125bb/150bb/200bb)
- Right panel: selected hand info, action buttons (FOLD/CALL/RAISE/ALL IN), GTO frequency comparison
- Action buttons are large, clearly labeled, with GTO frequency % shown as micro-chips
- "Check vs GTO" button after selecting action, shows correct/incorrect feedback
- Hand combo grid below action area showing individual combos with suit colors

**Study Page — Postflop Mode:**
- Board cards rendered as styled playing cards (rank + suit, red for hearts/diamonds)
- Street breadcrumb (PREFLOP → FLOP → TURN → RIVER) with active street highlighted
- Pot size display, active player highlight
- Action buttons grouped by type: CHECK, BET (33%/50%/75%/125%), FOLD, CALL, RAISE, ALL IN
- Each button shows chip amount + pot % + GTO frequency
- GTO comparison overlay after user selects action
- "Configure Spot" panel for setting up custom scenarios

**General Design:**
- Dark theme (#0E0E0E background, #1C1C1C cards, #262626 borders)
- Green (#00C853) for active/selected states
- Red (#E53935) for raise/bet actions
- Blue (#3A6EA5) for call actions
- Gray (#2a2a2a) for fold actions
- Compact, information-dense layout — no wasted space
- shadcn/ui component style with rounded corners and subtle borders

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

### Solver API (for post-flop training)
`POST /api/v1/solver/solve` accepts `board`, `street`, `pot_size`, `stack_depth`, `bet_sizes`, `position` and returns GTO strategy actions with frequencies and EV. This is the backend that powers the interactive study page training mode. Currently supports river solving with a defined board.

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
| `scout-agent` | Insufficient task context — need to research libraries, APIs, or approaches | Bounded 1-page research brief with options and trade-offs |

## Tasks

Ordered by priority. Each task is one unit of work for one player tick.

### Task: keep-api-server-running
- **Description**: The FastAPI backend on port 8000 crashes on container restart or host reboot. Set up a systemd --user service (or screen/tmux wrapper) that auto-restarts the API when it dies. The API runs from the repo root with `PYTHONPATH=apps/api uv run uvicorn main:app --host 0.0.0.0 --port 8000`. Also install fakeredis (already done) and ensure `uv sync --group runtime` has all needed deps.
- **Success criteria**:
  - `curl http://localhost:8000/api/v1/health` returns 200 after the service starts
  - Service auto-restarts if the process crashes
  - Service starts on boot (systemd --user enable)
- **Coach checks**:
  - Verify the service file exists at ~/.config/systemd/user/gto-api.service
  - Test stop/start cycle: `systemctl --user stop gto-api && systemctl --user start gto-api` then curl health
  - Check journalctl for errors

### Task: fix-strategy-lookup
- **Description**: The `GET /api/v1/strategy-lookup` endpoint returns HTTP 500 with error `'dict' object has no attribute 'game_type'`. The root cause is that `get_strategy()` returns a `StoredStrategy` object, but when the strategy is not found in the database and the fallback path (`list_strategies`) is hit, the candidate iteration or subsequent handling produces a dict instead. Fix the type mismatch in `apps/api/routers/strategy_lookup.py` or `apps/api/services/strategy_storage.py` so strategy lookups work correctly.
- **Success criteria**:
  - `curl "http://localhost:8000/api/v1/strategy-lookup?board=preflop&stack_depth=100&position=UTG"` returns a valid JSON response (may be 404 if no seed data — that's acceptable) rather than a 500
  - Strategy lookup with valid parameters returns strategy data
- **Coach checks**:
  - The fix handles both found and not-found paths cleanly
  - No regression in other endpoint behaviour
  - The fix doesn't silently swallow errors

### Task: seed-preflop-strategies
- **Description**: The strategy_lookup endpoint returns 404 because no strategy data exists in the PostgreSQL database. Create a seed script that inserts the pre-computed preflop GTO ranges (UTG, HJ, CO, BTN, SB, BB for 100bb) from the solver output into the strategies table. The seed data should be generated by the solver or sourced from the existing preflop data embedded in the frontend.
- **Success criteria**:
  - `curl "http://localhost:8000/api/v1/strategy-lookup?board=preflop&stack_depth=100&position=UTG"` returns 200 with strategy data
  - All 6 common positions have preflop data
- **Coach checks**:
  - Seed script is idempotent (safe to run multiple times)
  - Strategy data matches expected GTO ranges
  - Seed script is documented in AGENTS.md

### Task: fix-solver-docker-build
- **Description**: `docker compose build solver` fails with a numpy version conflict (`numpy==2.2.3` vs `numba 0.61.0` requiring `numpy<2.2`). The solver Dockerfile at `apps/solver/Dockerfile` or its requirements.txt has pinned version conflicts. Fix the dependency versions so the solver image builds cleanly.
- **Success criteria**:
  - `docker compose build solver` exits 0
- **Coach checks**:
  - Check that the solver starts: `docker compose up -d solver` then check logs
  - Verify the solver gRPC port 50051 is listening

### Task: fix-solver-protobuf-version
- **Description**: The solver Docker image builds but crashes at runtime with `VersionError: Detected incompatible Protobuf Gencode/Runtime versions when loading solver.proto: gencode 6.31.1 runtime 5.29.6`. Pin `protobuf>=6.31.1` or re-pin grpcio-tools to match the runtime protobuf in `apps/solver/requirements.txt` so the solver service starts without crashing.
- **Success criteria**:
  - `docker compose up -d solver` starts without protobuf error
  - `docker logs gto-wizard-clone-solver-1` shows no VersionError
  - `curl http://localhost:8000/api/v1/solver/health` returns 200 or the solver gRPC port 50051 is listening
- **Coach checks**:
  - Verify protobuf version in requirements.txt is compatible with the compiled proto files
  - Verify solver health endpoint responds

### Task: document-seed-script
- **Description**: Add usage instructions for `apps/api/prisma/seed_preflop_strategies.py` to the AGENTS.md Conventions or Seed Data section. Ensure a newcomer can read AGENTS.md and know how to populate the strategy database.
- **Success criteria**:
  - AGENTS.md has explicit instructions for running the seed script
- **Coach checks**:
  - Verify the documentation exists in AGENTS.md
  - Verify the instructions are accurate (run the command and confirm it works)

### Task: automate-seed-on-deploy
- **Description**: Add a Makefile target or post-deploy hook (e.g., in docker-compose or a systemd service unit) that runs `seed_preflop_strategies.py` after database migrations to ensure preflop strategy data exists in all environments (local, preview, production).
- **Success criteria**:
  - Running `make seed-preflop` (or equivalent) seeds strategies without errors
  - Running the command twice is idempotent (same result)
- **Coach checks**:
  - Check the Makefile or deploy script for the new target
  - Run it twice and verify idempotency

### Task: quiz-frontend-page
- **Description**: Create a `/quiz` frontend page at `apps/web/src/app/quiz/page.tsx` that uses the existing `GET /api/v1/quiz/random` and related quiz API endpoints to deliver GTO training spots. The page should fetch a random spot, display the board/hand/options, let the user pick an action, and show the GTO answer with EV comparison.
- **Success criteria**:
  - `curl http://localhost:3000/quiz` returns 200 with rendered HTML
  - Page loads a random spot from the API and displays it
  - User can select an action and see GTO comparison feedback
- **Coach checks**:
  - Verify the page route exists at apps/web/src/app/quiz/page.tsx
  - Load /quiz and confirm no console errors
  - Verify quiz spots load and interaction works

### Task: hand-history-frontend-page
- **Description**: Create a `/hand-history` frontend page at `apps/web/src/app/hand-history/page.tsx` that uses the existing `GET /api/v1/hh/hands` and related HH API endpoints. The page should show a searchable/filterable list of imported hands with key details (position, board, action, EV).
- **Success criteria**:
  - `curl http://localhost:3000/hand-history` returns 200 with rendered HTML
  - Page connects to the HH API and displays hand data
  - Filter/search controls are functional
- **Coach checks**:
  - Verify the page route exists at apps/web/src/app/hand-history/page.tsx
  - Load /hand-history and confirm no console errors
  - Verify the page renders hand data from the API

### Task: plo4-frontend-page
- **Description**: Create a `/plo4` frontend page at `apps/web/src/app/plo4/page.tsx` for Pot-Limit Omaha 4-card equity calculations. The API has a `/api/v1/plo4` router (plo4_equity.py) — wire it up so users can input PLO4 hand combos and see equity results.
- **Success criteria**:
  - `curl http://localhost:3000/plo4` returns 200 with rendered HTML
  - Page loads the PLO4 equity calculator interface
  - Users can input hands and get equity results from the API
- **Coach checks**:
  - Verify the page route exists at apps/web/src/app/plo4/page.tsx
  - Load /plo4 and confirm no console errors
  - Verify a PLO4 equity calculation works end-to-end

### Task: postflop-solver-api-endpoint
- **Description**: Create a dedicated `POST /api/v1/solver/postflop-strategy` endpoint that the study page's interactive training mode will call. Unlike the existing `/solve` endpoint (which runs a live CFR solve — too slow for interactive use), this endpoint returns cached/quick pre-computed strategy data for common postflop spots. Accept `board` (string like "KsKc3s"), `position` (player acting), `street` (flop/turn/river), `pot_size`, `stack_depth`, `hero_hand`. Return top N actions (check, bet sizes, fold, call, raise) with GTO frequency % and EV. The `/solve` endpoint already supports postflop parameters as a fallback — if no cached data exists, fall through to call the live solver engine with a 30-second timeout.
- **Success criteria**:
  - `curl -X POST http://localhost:8000/api/v1/solver/postflop-strategy -H 'Content-Type: application/json' -d '{"board":"KsKc3s","position":"BTN","street":"flop","pot_size":5.5,"stack_depth":97.5}'` returns 200 with action list
  - Each action has `action` (string like "bet_33", "check", "fold"), `frequency` (0-1), `ev` (float)
  - Response includes the strategy source ("cached" vs "live-solver")
- **Coach checks**:
  - Verify the endpoint exists in the API router tree
  - Test with a known board+position combo, confirm response shape matches spec
  - Test with invalid board format, confirm graceful error (not 500)
  - Check the endpoint doesn't block for >5s if live solver is down

### Task: interactive-postflop-study-buttons
- **Description**: Add an interactive postflop training mode to the /study page. The page currently shows a static preflop range viewer. Add a new mode (toggled via a "Postflop Training" / "Preflop Ranges" switch) that shows:
  1. **Board cards** — 3-5 community card slots (flop/turn/river). Parse from a card string like "KsKc3s" and render styled cards with suit colors.
  2. **Pot size** — displays current pot, updates per street.
  3. **Active player highlight** — green-bordered column showing whose turn it is.
  4. **Action history** — for each position still in the hand, show whether they folded or their action so far.
  5. **Interactive action buttons** — user can click an action to make a decision. Buttons should be styled per type: CHECK, BET 33%/50%/75%/125%, FOLD, CALL, RAISE 50%/100%, ALLIN (all-in with remaining stack). Each button shows chip amount + pot %.
  6. **GTO comparison** — after user picks an action, overlay the GTO strategy from the API for each action option as micro-chips (frequency %, EV). Highlight the user's choice vs the GTO-recommended action.
  
  Reference the image at `docs/reference-study-interface.png` for exact layout and styling. The left column should show the strategy matrix (preflop view) or board+actions (postflop view). The right column should always show the GTO action breakdown and EV comparison.
- **Success criteria**:
  - `/study` page loads without console errors
  - Toggle between "Preflop Ranges" and "Postflop Training" modes works
  - Postflop mode shows: board cards, pot size, active player highlight, action history per position
  - All action buttons render: CHECK, BET (33%/50%/75%/125%), FOLD, CALL, RAISE (50%/100%), ALLIN
  - Clicking an action button calls `POST /api/v1/solver/postflop-strategy` and shows GTO comparison feedback
  - Reference screenshot at `docs/reference-study-interface.png` matches the rendered UI layout
- **Coach checks**:
  - Open browser to /study, check for console errors (0 errors)
  - Verify the preflop/postflop toggle exists and switches views
  - Verify board cards render with correct suit symbols and colors
  - Click each action button type — verify API call happens and response renders
  - Compare rendered UI against `docs/reference-study-interface.png`: verify action button layout, bet sizing notation, pot size display, position column layout all match
  - Check mobile/small viewport doesn't break the layout entirely (responsive enough to not lose buttons)

### Task: postflop-spot-configuration
- **Description**: Add a configuration panel to the postflop training mode that lets the user set up a training scenario. Before starting a postflop hand, the user should be able to:
  1. Select which positions are in the hand (e.g., BTN vs BB heads-up, or multi-way)
  2. Input the board cards (3-5 community cards)
  3. Set pot size and stack depths
  4. Choose the street (flop/turn/river)
  5. Optionally input hero's hole cards to see personalized GTO strategy
  
  The configuration should be a collapsible panel that opens with a "Configure Spot" button and collapses after setup. Default configuration: BTN vs BB, K♠K♣3♠ flop, 5.5bb pot, 100bb stacks — matching the reference image at `docs/reference-study-interface.png`.
- **Success criteria**:
  - Configuration panel opens/closes with button toggle
  - User can select positions, enter board cards, set pot/stack
  - Changes take effect and the action buttons update
  - Default config matches the reference image
- **Coach checks**:
  - Open the config panel, change a setting, verify the board/pot/position updates
  - Close and re-open the config panel, verify settings persist
  - Verify the default config renders identically to `docs/reference-study-interface.png`

### Task: postflop-street-navigation
- **Description**: Add street-by-street navigation to the postflop training mode. After the user makes an action on one street (e.g., flop), they should be able to advance to the next street (turn, then river). Each street:
  1. Reveals new community cards
  2. Updates the pot size based on previous action
  3. Generates a new set of GTO action buttons for the active player
  
  Include a hand history breadcrumb at the top showing: Preflop actions → Flop (current) → Turn (locked) → River (locked) — with past streets showing what action was taken.
- **Success criteria**:
  - After selecting an action, user can advance to next street
  - New board cards appear on turn/river
  - Pot size updates correctly
  - New action buttons appear for the active player on each street
  - Street breadcrumb shows past actions per street
- **Coach checks**:
  - Advance through flop → turn → river, verify each street shows correct board + pot
  - Verify the street breadcrumb updates correctly
  - Verify the action buttons change per street (more options on river with all-in)

## Coach Configuration
- **Review scope**: git diff of latest commit, test output, success criteria from AGENTS.md task, console errors from frontend pages (check via curl/browser)
- **Pass conditions**: All success criteria for the task are met. No regression in previously passing tests. No console errors introduced.
- **Fail actions** (descending severity):
  1. Coach creates a corrective commit fixing the issue directly
  2. Coach reverts the commit and creates a fix task pinned to the issue
  3. For ambiguous or high-risk failures, coach blocks and tags for human review

**Reference for visual comparison**: The file `docs/reference-study-interface.png` is a screenshot of the target interactive postflop training interface. When reviewing tasks `interactive-postflop-study-buttons`, `postflop-spot-configuration`, and `postflop-street-navigation`, the coach SHOULD load this image via `vision_analyze` to compare the player's rendered output against the visual reference. Specific visual elements to match:
- Action button layout (BET sizes as 33%/50%/75%/125% of pot)
- Position column layout (UTG/HJ/CO/BTN/SB/BB in that order, with green highlight on active)
- Board card display (centered, with suit colors)
- Pot size notation (e.g., "5.5" next to "FLOP" label)
- Street breadcrumb style (tabs with active street highlighted)

## Seed Data
- **Run (preflop only)**: `cd /home/sc/repos/gto-wizard-clone && PYTHONPATH=apps/api .venv/bin/python apps/api/prisma/seed_preflop_strategies.py`
- **Run (all: preflop + flop)**: `cd /home/sc/repos/gto-wizard-clone && PYTHONPATH=apps/api .venv/bin/python apps/api/prisma/seed_all_strategies.py`
- **Make target**: `make seed-all` (seeds preflop + flop at 50, 100, 150, 200bb) or `make seed-preflop` (preflop only)
- **Note**: Idempotent — safe to run multiple times. Seeds strategies at all common stack depths (50, 100, 150, 200bb). Requires the venv (`.venv`) with asyncpg installed (run `uv sync --group runtime` first if needed).
- **Docker**: The `docker compose up -d` seed service runs the combined seed automatically via `seed_all_strategies.py`.
- **Verify**: After seeding, test with `curl 'http://localhost:8000/api/v1/strategy-lookup?board=preflop&stack_depth=100&position=UTG'`

### Task: fix-omaha-api-url
- **Description**: The `/omaha` frontend page calls `/api/omaha/plo5/equity`, `/api/omaha/hi-lo/equity`, and `/api/omaha/shortdeck/equity` but the backend serves these at `/omaha/plo5/equity/calculate`, `/omaha/hi-lo/equity/calculate`, `/omaha/shortdeck/equity/calculate`. Fix the API URLs in `apps/web/src/app/omaha/page.tsx` — remove the `/api` prefix and add the `/calculate` suffix.
- **Success criteria**: Clicking "Calculate Equity" on the Omaha page for any variant (PLO5, Hi-Lo, Shortdeck) returns results instead of a 404 error. Confirm with `curl http://localhost:8000/omaha/plo5/equity/calculate -X POST -H 'Content-Type: application/json' -d '{"hand1": "AhKhQsJd", "hand2": "KsQsJhTd"}'` returns 200.
- **Coach checks**: Load `/omaha` page, submit an Omaha equity calculation, verify response renders correctly. Check browser console for 404 errors on API calls.

### Task: fix-bomb-pot-api-url
- **Description**: The `/bomb-pot` frontend page calls `/api/bomb-pot/game-state` and `/api/bomb-pot/equity` but the backend serves these at `/bomb-pot/game-state` and `/bomb-pot/equity` (no `/api` prefix). Fix the fetch URLs in `apps/web/src/app/bomb-pot/page.tsx` to remove the `/api` prefix from the paths.
- **Success criteria**: Clicking "Create Game" on the bomb-pot page creates a game state instead of getting a 404. Confirm with `curl http://localhost:8000/bomb-pot/game-state -X POST -H 'Content-Type: application/json' -d '{}'` returns a valid game state object.
- **Coach checks**: Load `/bomb-pot` page, try creating a game state, verify game renders. Check console for 404 errors.

### Task: fix-double-board-api-url
- **Description**: The `/double-board` frontend page calls `/api/double-board/equity` but the backend serves this at `/double-board/equity` (no `/api` prefix). Fix the fetch URL in `apps/web/src/app/double-board/page.tsx` to remove the `/api` prefix.
- **Success criteria**: Clicking "Calculate Equity" on the double-board page returns equity results instead of a 404. Confirm with `curl http://localhost:8000/double-board/equity -X POST -H 'Content-Type: application/json' -d '{"hero": "AhKh", "villain": "QsQd", "board1": ["Ks", "7c", "2d"], "board2": ["3h", "9d"]}'` — adjust field names as needed to match the API schema.
- **Coach checks**: Load `/double-board` page, submit a calculation, verify results render. Check console for 404 errors.

### Task: fix-strategies-api-url-prefix
- **Description**: The `/strategies` frontend page defines `API_BASE = "http://localhost:8080"` and then constructs URLs like `${API_BASE}/api/v1/strategy/lookup`. This results in double-prefix URLs that break in production (calls `http://localhost:8080/api/v1/...` directly instead of using the Next.js proxy). Fix by removing the hardcoded API_BASE and using relative paths (`/api/v1/strategy/lookup` etc.) so the Next.js rewrite proxy handles routing. Update `apps/web/src/app/strategies/page.tsx`.
- **Success criteria**: The strategies page loads strategy data via the Next.js proxy instead of bypassing it. `curl http://localhost:3000/strategies` returns a page that successfully loads strategy data from the API.
|- **Coach checks**: Load `/strategies` page, verify strategy data loads (no 404 or connection refused errors in browser console). Verify all three API calls (strategy lookup, solver solve, solver WS) use relative paths.

### Task: fix-strategy-route-order
- **Description**: The `GET /api/v1/strategy/{key}` route in `apps/api/routers/strategy.py` (line 185) is defined before `GET /api/v1/strategy/lookup` (line 228), causing `/api/v1/strategy/lookup` requests to be intercepted by `/{key}` with `key="lookup"`, which then fails `parse_strategy_key("lookup")` with `Invalid strategy key format: lookup`. Move the `/lookup` route before `/{key}` in strategy.py so the static path matches first. Verify with `curl http://localhost:8000/api/v1/strategy/lookup?game_type=nlh&players=2&board=preflop&stack_depth=100` returns a valid response (not the `Invalid strategy key format` error).
- **Success criteria**: `curl "http://localhost:8000/api/v1/strategy/lookup?game_type=nlh&players=2&board=preflop&stack_depth=100"` returns a strategy response or 404 (not 400 with "Invalid strategy key format"). The `/api/v1/strategy/{key}` endpoint still works for valid keys.
- **Coach checks**: Run the lookup curl and verify no "Invalid strategy key format" error. Also test `GET /api/v1/strategy/nlh:2:preflop::100` still returns proper response or 404 (not shadowed by lookup). Check that all 368 tests still pass.

### Task: add-strategies-page-e2e-test
- **Description**: The `/strategies` page currently shows "0 spots found" because the strategy lookup API call fails with the route shadowing bug. After `fix-strategy-route-order` is deployed, the strategies page should be able to load strategy data. Add a basic e2e smoke test that loads `/strategies` and verifies the page renders the strategy browser UI without console errors. The test can be a simple Playwright or curl-based check.
- **Success criteria**: `curl http://localhost:3000/strategies` returns 200 with the HTML strategy browser UI. Loading the page in a browser shows no console errors. The "0 spots found" text appears if no seed data exists (expected), not because of API errors.
- **Coach checks**: Load `/strategies` page. Check console for errors. Verify the board card inputs, position selector, and "Solve New Spot" button all render.

### Task: add-deploy-health-monitoring
- **Description**: Add a simple deploy monitoring script that checks key API endpoints and frontend pages are returning 200 after deployment. Create `scripts/deploy-health-check.sh` that curls: `GET /api/v1/health` (backend), `GET /` (frontend), `GET /study` (study page), `POST /api/v1/solver/postflop-strategy` (solver endpoint). Exit 0 only if all checks pass. Integrate into a Makefile `make health-check` target.
- **Success criteria**: `bash scripts/deploy-health-check.sh` exits 0 and checks at least 4 endpoints. `make health-check` works.
- **Coach checks**: Run the script, verify all checks pass. Run `make health-check` and verify the target exists.

### Task: start-solver-docker-service
- **Description**: The solver Docker image was built (via `fix-solver-docker-build` and `fix-solver-protobuf-version`) but the solver container is not running. Only PostgreSQL and Redis are up. Build and start the solver container: `docker compose build solver && docker compose up -d solver`. Verify the solver gRPC port 50051 is listening and the solver health endpoint returns success.
- **Success criteria**: `docker compose ps` shows the solver container as "Up". `curl http://localhost:8000/api/v1/solver/health` returns 200. `curl -s --max-time 5 http://localhost:50051` connects (or returns gRPC response).
- **Coach checks**: Check `docker compose ps` for solver container. Verify solver health endpoint. Check `docker logs gto-wizard-clone-solver-1` for errors.

### Task: add-periodic-health-check-cron
- **Description**: Create a Hermes cron job that runs `make health-check` (or `bash scripts/deploy-health-check.sh`) every 6 hours to proactively detect service degradation. The cron job should report the health check results to the user's origin channel. Name the cron job "gto-wizard-health-check", schedule `0 */6 * * *`.
- **Success criteria**: Cron job exists with name "gto-wizard-health-check", schedule `0 */6 * * *`, pinned to deepseek-v4-flash/opencode-go, delivers to origin.
- **Coach checks**: List cron jobs — verify entry exists with correct schedule and delivery.

### Task: add-solver-e2e-test
- **Description**: Add a playwright e2e test that navigates to the study page, configures a postflop spot (board KsKc3s, position BTN, street flop), clicks "Solve", and verifies the solver response is rendered (action frequencies, EV values). This validates the full stack: frontend → API → solver. Follow the existing e2e test pattern in `apps/web/e2e/`.
- **Success criteria**: `cd apps/web && npx playwright test` includes a passing solver test. The test verifies that solver strategy actions appear in the rendered output.
- **Coach checks**: Run the e2e tests. Verify the solver test specifically passes.

### Task: re-seed-strategy-data
- **Description**: The PostgreSQL database was recreated and the preflop strategy seed data is gone. The strategies page shows "0 spots found" because the strategy lookup returns `Strategy not found` for all queries. Re-run the existing seed script at `apps/api/prisma/seed_preflop_strategies.py` (docs in AGENTS.md Seed Data section) and verify strategy data is available.
- **Success criteria**: `curl "http://localhost:8000/api/v1/strategy/lookup?board=preflop&stack_depth=100&position=UTG"` returns 200 with strategy data (not "Strategy not found"). The `/strategies` page shows available strategies instead of "0 spots found".
- **Coach checks**: Run the seed script, verify the strategy lookup returns real data. Check the strategies page renders data.

### Task: add-push-fold-charts-page
- **Description**: Create a push/fold Nash equilibrium charts page at `/push-fold` that displays standard tournament push/fold ranges by position and stack depth. Use the existing equity calculation infrastructure. Include a table showing push ranges for positions (UTG through SB) at common stack depths (5-20bb). The page should let users select stack depth and position and see the recommended push/fold range.
- **Success criteria**: `curl http://localhost:3000/push-fold` returns 200 with a rendered page showing push/fold chart UI. Navigation has a link to the new page.
- **Coach checks**: Load `/push-fold` page, check for console errors. Verify push/fold ranges are shown for at least 3 stack depths (5bb, 10bb, 15bb).

### Task: add-range-explorer-page
- **Description**: The `RangeGrid.tsx` component exists at `apps/web/src/components/equity/RangeGrid.tsx` but there's no route that uses it. Create a `/range-explorer` page that renders the range matrix with frequency overlay and allows users to explore GTO ranges by position, stack depth, and board texture. Use the existing RangeGrid component and wire it to the strategy-lookup API.
- **Success criteria**: `curl http://localhost:3000/range-explorer` returns 200. The page renders the range grid with frequency colors for at least one position-stack combination.
|- **Coach checks**: Load `/range-explorer` page, verify the range grid renders with frequency coloring. Check for console errors. Verify position selector works.
|
|### Task: auto-seed-strategy-on-db-restart
|- **Description**: The PostgreSQL database loses preflop strategy data when recreated (`docker compose down` + `up`), requiring a manual `make seed-preflop` to restore it. Add a docker-compose init container or a systemd Oneshot service that runs the seed script automatically after PostgreSQL starts. The existing seed script at `apps/api/prisma/seed_preflop_strategies.py` is already idempotent and works — just needs automated invocation.
|- **Success criteria**: After `docker compose down && docker compose up -d`, `curl "http://localhost:8000/api/v1/strategy/lookup?board=preflop&stack_depth=100&position=UTG"` returns strategy data (200) without any manual seeding step.
|- **Coach checks**: Run `docker compose down && docker compose up -d`, then immediately curl the strategy-lookup endpoint and confirm data is populated. Verify the solution doesn't block PostgreSQL startup if the seed fails.
|
|### Task: add-e2e-tests-for-new-pages
|- **Description**: The `/push-fold` and `/range-explorer` pages have no e2e smoke tests. Add Playwright tests in `apps/web/e2e/` following the existing test pattern — at minimum verify each page returns 200 and has no console errors. Name the test files `push-fold.spec.ts` and `range-explorer.spec.ts`.
|- **Success criteria**: `cd apps/web && npx playwright test` includes passing tests for both `/push-fold` and `/range-explorer`. Tests verify pages load with no console errors.
|- **Coach checks**: Run the e2e tests. Verify the new tests pass. Check that the tests follow the existing pattern (matching selector conventions, wait strategies).
|
|### Task: fix-strategy-key-bet-size-parsing
|- **Description**: The `GET /api/v1/strategy/{key}` endpoint in `apps/api/routers/strategy.py` fails with `invalid literal for int() with base 10: '0.5'` when the bet_size component in the strategy key is a float (e.g., `nlh:2:preflop:utg:0.5:100`). The `parse_strategy_key()` function at line 117 naively calls `int(x)` on bet size components. Fix to handle float bet sizes by using `float()` instead of `int()` where appropriate, or by changing the key format to store bet_size as an integer (e.g., 50 for 0.5 = 50% pot).
|- **Success criteria**: `curl http://localhost:8000/api/v1/strategy/nlh:2:preflop:utg:0.5:100` returns strategy data (or appropriate 404) instead of HTTP 500 or "invalid literal for int()". Both integer bet sizes (e.g., 100) and float sizes (0.5) work.
|- **Coach checks**: Test with `/strategy/nlh:2:preflop:utg:0.5:100` and `/strategy/nlh:2:preflop:utg:100:` — both should parse without error. Verify `/api/v1/strategy/lookup` still works (no regression).

### Task: seed-all-stack-depths
- **Description**: The `_auto_seed_strategies()` background task in `apps/api/main.py` only seeds 100bb preflop data. The `seed_preflop_strategies.py` script supports a `stack_depth` argument but isn't called for 50bb, 150bb, or 200bb. Update the auto-seed logic (or add a separate startup task) to seed all common stack depths (50, 100, 150, 200) so the strategy lookup works at multiple stack depths without manual intervention.
- **Success criteria**:
  - After API restart, `curl 'http://localhost:8000/api/v1/strategy-lookup?board=preflop&stack_depth=50&position=UTG'` returns strategy data
  - Same for stack_depth=150 and stack_depth=200
- **Coach checks**:
  - Verify curl returns data for each stack depth after restart
  - Verify the seed is idempotent (safe to re-run on every startup)
  - Check the API startup log for seed confirmation at each depth

### Task: seed-flop-strategies
- **Description**: The strategy lookup endpoint only returns preflop data. Seed GTO strategies for common flop boards (monotone, paired, rainbow, wet, dry) at 100bb. Use the solver engine or hardcoded GTO ranges stored in `apps/api/data/`. The seed script `apps/api/prisma/seed_preflop_strategies.py` should be extended or a new flop seed script created.
- **Success criteria**:
  - `curl 'http://localhost:8000/api/v1/strategy-lookup?board=Kd7h2c&stack_depth=100&position=BTN'` returns strategy data for at least 3 distinct flop boards
- **Coach checks**:
  - Verify the seed script exists and runs without error
  - Verify curl returns actual range data (not 404) for each seeded board
  - Verify the lookup endpoint handles postflop board hashing correctly

### Task: add-missing-stack-depth-to-frontend-position-buttons
- **Description**: The `/study` page position buttons currently show only the effective stack for 100bb (UTG shows "100", SB shows "99.5" for posted blind). The strategy lookup backend now supports 50bb and 150bb. Add a stack depth selector to the study page toolbar so users can switch between common stack depths (50, 100, 150, 200) without needing an API key or URL parameter. Use the existing `GET /api/v1/strategy-lookup/stack-depths` endpoint to list available depths.
- **Success criteria**:
  - The study page has a visible stack depth selector (dropdown or button group) in the toolbar area
  - Selecting 50bb reloads the strategy heatmap with 50bb data
- **Coach checks**:
  - Load the study page and verify the stack depth selector is visible
  - Switch to 50bb and verify the position buttons update their stack labels
  - Check browser console for errors

### Task: seed-flop-strategies-all-depths
- **Description**: The flop strategy seed script (`apps/api/prisma/seed_flop_strategies.py`) only seeds at 100bb. The frontend now has a stack depth selector that lets users pick 50, 100, 150, 200bb, but flop data only exists for 100bb (the strategy lookup returns 100bb data as the closest match when other depths are requested). Extend the seed script to seed flop strategies at 50, 150, and 200bb stack depths as well. Follow the same pattern as the preflop seed script which seeds all depths.
- **Success criteria**:
  - `curl 'http://localhost:8000/api/v1/strategy-lookup?board=Kd7h2c&stack_depth=50&position=BTN'` returns strategy data with `"stack_depth":50`
  - Same for stack_depth=150 and stack_depth=200
- **Coach checks**:
  - Verify the seed is idempotent (safe to re-run)
  - Verify curl returns strategy data with the correct stack_depth for each depth
  - Verify the existing 100bb data isn't duplicated or corrupted

### Task: fix-postflop-street-progression
- **Description**: The postflop training component (`apps/web/src/components/study/PostflopTraining.tsx`) has street navigation (flop→turn→river) but the solver API returns `"Invalid board/street"` when asked to solve for turn with only a 3-card flop board. The component needs to pass the correct board state (4 cards for turn, 5 for river) when advancing streets. Either auto-generate a random next card or let the user select which card comes on the next street.
- **Success criteria**:
  - Postflop training can advance from flop to turn and get solver output for the turn street
  - Postflop training can advance from turn to river and get solver output for the river street
- **Coach checks**:
  - POST `/api/v1/solver/postflop-strategy` with a 4-card board and `street=turn` returns valid actions
  - POST with a 5-card board and `street=river` returns valid actions
  - The UI shows the new board card when advancing streets

### Task: seed-flop-boards-expanded
- **Description**: Only 7 flop boards are currently seeded. Add 10 more flop boards covering a wider variety of textures (high-card, low-card, connected, wet monotone, dry paired, flush draw boards) to give users more training variety. Follow the existing pattern in `apps/api/prisma/seed_flop_strategies.py` — add new board strings to the `FLOP_BOARDS` list and re-run the seed. The solver or hardcoded GTO ranges will generate data for each new board.
- **Success criteria**:
  - `curl 'http://localhost:8000/api/v1/strategy-lookup?board=Ah8h3h&stack_depth=100&position=BTN'` (or any new board) returns strategy data with `"status":"found"`
  - At least 17 total flop boards are seeded (7 original + 10 new)
- **Coach checks**:
  - Verify the seed script runs without error after adding new boards
  - Verify curl returns data for at least 3 of the new boards
  - Verify existing boards still return data (no regression)

### Task: study-page-postflop-e2e-test
- **Description**: After the postflop street progression is fixed, add a Playwright e2e test that validates the full postflop training workflow: load /study page, toggle to postflop mode, configure a spot (board KsKc3s, BTN vs BB, 100bb), solve the spot, verify action buttons render with GTO frequencies, then advance to the turn and verify the board updates. Follow the existing test pattern in `apps/web/e2e/`.
- **Success criteria**:
  - `cd apps/web && npx playwright test` includes a passing postflop study test
  - The test validates: spot configuration, solve response rendering, action button visibility, street advancement
- **Coach checks**:
  - Run the e2e tests and verify the new postflop test passes
  - Check that the test doesn't depend on external solver availability (uses cached strategy data)
  - Verify no console errors appear during the test

### Task: study-page-console-error-audit
- **Description**: The study page loads but may have JavaScript console errors that degrade the user experience. Open the /study page in a headless browser (via Playwright or Puppeteer), capture all console messages (errors, warnings, uncaught exceptions), and fix any that appear. Common issues: missing React keys, undefined API response fields, CSS class mismatches after Tailwind v4 upgrade, deprecated lifecycle method warnings.
- **Success criteria**:
  - Loading `/study` in a headless browser produces 0 console errors
  - 0 uncaught promise rejections
  - Fixes are minimal (no architecture changes)
- **Coach checks**:
  - Run the audit script after fix and verify 0 console errors
  - Check that the preflop/postflop toggle, position buttons, and action buttons all render without errors

---

## Next Batch — Generated by Coach (2026-06-18)

### Task: study-preflop-action-feedback-flow
- **Description**: The preflop study mode has an ActionSelector but the "Check vs GTO" flow is incomplete — after selecting an action and clicking "Check vs GTO", the feedback should show not just correct/incorrect but also the full GTO frequency breakdown (what % of the time GTO takes each action). Add a feedback panel below the action buttons that shows: (1) whether the user's pick matches the GTO action, (2) the full GTO frequency distribution across all actions for reference, and (3) a "Try Again" button that resets the selection.
- **Success criteria**:
  - After selecting an action and clicking "Check vs GTO", a feedback panel appears showing correct/incorrect + full GTO frequency breakdown
  - "Try Again" button resets the selection
  - GTO frequencies are displayed as percentage bars or chips, not just raw numbers
- **Coach checks**:
  - Open /study, click a hand (e.g., AA), select "raise", click "Check vs GTO" → verify feedback shows correct with GTO frequency bars
  - Select "fold" for AA → verify feedback shows incorrect
  - "Try Again" resets to initial state

### Task: study-postflop-gto-comparison-overlay
- **Description**: The postflop training mode's GTO comparison is minimal — after clicking an action, the strategy response should be visually compared side-by-side with the user's choice. Add an overlay or panel that shows: (1) the user's selected action highlighted, (2) the GTO-recommended action with its frequency %, (3) EV difference between user's choice and GTO, (4) color-coding (green = correct, red = suboptimal). This matches the reference image at `docs/reference-study-interface.png` which shows GTO frequencies as micro-chips alongside action buttons.
- **Success criteria**:
  - After selecting a postflop action, a GTO comparison panel appears showing the user's pick vs GTO recommendation
  - GTO frequencies displayed as percentage chips next to each action
  - Visual color coding (green = matches GTO, red = doesn't match)
  - EV difference shown
- **Coach checks**:
  - Navigate to /study → Postflop Training → click "Get GTO Strategy" → select an action → verify GTO comparison renders
  - Verify the GTO comparison panel matches the layout in `docs/reference-study-interface.png`

### Task: study-page-hotkeys
- **Description**: Add keyboard shortcuts for common actions on the study page to speed up training: (1) number keys 1-9 for selecting actions, (2) Space/Enter to check vs GTO, (3) Escape to reset/try again, (4) Arrow keys to navigate the hand matrix. Display a small "Press ? for hotkeys" hint that shows a shortcut overlay when clicked.
- **Success criteria**:
  - Pressing number keys triggers action selection in both preflop and postflop modes
  - Space/Enter triggers "Check vs GTO"
  - Escape resets the current selection
  - Arrow keys move the selected cell in the preflop matrix
  - Hotkey overlay shows all shortcuts
- **Coach checks**:
  - Test each hotkey in preflop mode
  - Test each hotkey in postflop mode
  - Verify the overlay appears on "?" press

### Task: study-session-spot-generator
- **Description**: Add a "Random Spot" button to the study page that generates a random poker scenario for training: (1) random board cards (for postflop), (2) random hero hand, (3) random position, (4) random pot/stack configuration. This lets users do endless training without manually configuring each spot. The generated spot should be solvable by the existing API (either from cached data or the solver).
- **Success criteria**:
  - "Random Spot" button visible in the study toolbar
  - Clicking it generates and loads a random solvable spot
  - The board, hero cards, position, and pot/stack are all populated
  - Action buttons remain functional for the generated spot
- **Coach checks**:
  - Click "Random Spot" → verify a new hand loads with cards, position, and action buttons
  - Click "Random Spot" again → verify a different hand loads
  - Select an action and verify GTO comparison works for the random spot

### Task: study-progress-tracking
- **Description**: Track user performance during study sessions: (1) correct vs incorrect answers, (2) accuracy % per position, (3) accuracy % per action type (bet, call, fold, raise), (4) streak counter, (5) session summary at the end. Store progress in localStorage (no backend needed). Display a small stats panel in the study page toolbar: "15/20 correct (75%) • Streak: 5".
- **Success criteria**:
  - Stats panel visible in the study toolbar showing accuracy and streak
  - Correct/incorrect answers increment the stats
  - Stats persist across page reloads (localStorage)
  - Stats reset when starting a new session (button or after 30min inactivity)
  - Breakdown by position and action type accessible via a "Stats" tab
- **Coach checks**:
  - Answer 5 hands correctly → verify "5/5 correct (100%) • Streak: 5"
  - Answer 1 incorrectly → verify "6/6 correct (83%) • Streak: 0"
  - Reload page → verify stats persist
  - Click "New Session" → verify stats reset to 0

---

## Visual Comparison Tasks (do these FIRST — they unblock everything)

### Task: visual-study-preflop-match-reference
- **Description**: Load `docs/reference-study.png` via `vision_analyze` to understand the target preflop study interface. Then load `https://wiz.codeovertcp.com/study` via `browser_navigate` and take a screenshot with `browser_vision`. Compare the two and fix ALL visual gaps. Key elements the reference likely includes:
  1. **Styled card suits** — hearts/diamonds in red, spades/clubs in white/black on dark background
  2. **Proper hand matrix** — 13×13 grid with clear color coding, proper font sizes, hover states
  3. **Position buttons — large, clear labels**, active position with green border/highlight
  4. **Stack depth selector — pill buttons** with active state
  5. **Right panel — "Your Action" section** with large FOLD/CALL/RAISE/ALL IN buttons
  6. **Action buttons should show GTO frequency micro-chips** (small colored badges with %)
  7. **Hand combo grid** showing individual card combos with styled suits
  8. **Check vs GTO flow** working end-to-end
  9. **Overall spacing and typography** matching the reference density
  
  Make as many commits as needed — each visual fix should be a separate commit.
- **Success criteria**:
  - Live `/study` page visually matches `docs/reference-study.png` for the preflop mode
  - All interactive elements (buttons, matrix, action selector) work correctly
  - No elements are cut off or below the fold
- **Coach checks**:
  - `vision_analyze` the reference screenshot and the live page side by side
  - Verify color coding, spacing, button sizes, card rendering all match
  - Test the full interaction flow: click hand → select action → check vs GTO → feedback

### Task: visual-study-postflop-match-reference
- **Description**: Load `docs/reference-study-interface.png` via `vision_analyze`. Switch `/study` to "Postflop Training" mode via browser. Compare and fix ALL visual gaps. Key elements:
  1. **Board cards** — styled playing cards with rank + suit, proper colors
  2. **Street breadcrumb** — PREFLOP → FLOP → TURN → RIVER with active street highlighted
  3. **Action buttons** — CHECK, BET 33%/50%/75%/125%, FOLD, CALL, RAISE 50%/100%, ALL IN
  4. **Each button shows** chip amount + pot % + GTO frequency
  5. **Position column** with active player green highlight
  6. **GTO comparison overlay** after selecting an action
  7. **Configure Spot panel** for custom scenarios
- **Success criteria**:
  - Live `/study` postflop mode visually matches `docs/reference-study-interface.png`
  - All action buttons render with correct labels and GTO frequencies
  - Board cards render as styled playing cards
- **Coach checks**:
  - `vision_analyze` reference vs live page
  - Test full postflop flow: configure spot → get GTO → select action → compare

---

## Next Batch — Generated by Coach (2026-06-19)

### Task: solutions-frontend-page
- **Description**: Create a `/solutions` frontend page at `apps/web/src/app/solutions/page.tsx`. The reference image at `docs/reference-solutions.png` shows the target layout. The Solutions page should provide a browsable library of pre-computed GTO solutions organized by game type (NLH, PLO, etc.), position, and board texture. Use the existing strategy API (`GET /api/v1/strategy/lookup`) to list available solutions. Include: (1) a search/filter bar, (2) a grid or list of solution cards showing board, position, stack depth, and key actions, (3) click-to-expand for full strategy details.
- **Success criteria**:
  - `curl http://localhost:3000/solutions` returns 200 with rendered HTML
  - Page renders a solutions browser UI with search/filter controls
  - Solution cards display board, position, and stack depth
  - No console errors
- **Coach checks**:
  - Load `/solutions` page, verify it returns 200
  - Check for console errors
  - Verify the page matches the general layout of `docs/reference-solutions.png`
  - Verify search/filter controls render

### Task: equity-variant-2-7td-page
- **Description**: Replace the stub at `apps/web/src/app/equity/2-7td/page.tsx` with a functional Deuce-to-Seven Triple Draw equity calculator. The stub currently shows "under development" via the `VariantStubPage` component. Build a proper calculator that: (1) accepts two 2-7 TD hand inputs (5 cards each, comma-separated), (2) calls the backend equity API or uses client-side calculation, (3) displays equity % for each hand, (4) shows hand rankings. Reference the existing `/equity` page for the general calculator layout pattern.
- **Success criteria**:
  - `curl http://localhost:3000/equity/2-7td` returns 200 with a functional calculator UI
  - Users can input two hands and see equity results
  - No "under development" stub text
- **Coach checks**:
  - Load `/equity/2-7td`, input two hands, verify equity calculation works
  - Check for console errors
  - Verify the page follows the same design pattern as other equity pages

### Task: equity-variant-2-7sd-page
- **Description**: Replace the stub at `apps/web/src/app/equity/2-7sd/page.tsx` with a functional Deuce-to-Seven Single Draw equity calculator. Same pattern as 2-7td but for single draw variant. Build a proper calculator with hand inputs, equity display, and hand rankings.
- **Success criteria**:
  - `curl http://localhost:3000/equity/2-7sd` returns 200 with a functional calculator UI
  - Users can input two hands and see equity results
  - No "under development" stub text
- **Coach checks**:
  - Load `/equity/2-7sd`, input two hands, verify equity calculation works
  - Check for console errors

### Task: equity-variant-plo5-page
- **Description**: Replace the stub at `apps/web/src/app/equity/plo5/page.tsx` with a functional 5-card PLO equity calculator. The existing `/equity/omaha/page.tsx` can serve as a reference for the general Omaha calculator layout. Build a proper calculator that accepts two PLO5 hands (5 cards each) and a board, and displays equity % for each hand.
- **Success criteria**:
  - `curl http://localhost:3000/equity/plo5` returns 200 with a functional calculator UI
  - Users can input two PLO5 hands and see equity results
  - No "under development" stub text
- **Coach checks**:
  - Load `/equity/plo5`, input two hands, verify equity calculation works
  - Check for console errors
  - Verify the page follows the same design pattern as other equity pages

### Task: analyze-viewer-functional-page
- **Description**: The `/analyze/viewer` page at `apps/web/src/app/analyze/viewer/page.tsx` is a 39-line stub with no real functionality. Build a functional hand history viewer that: (1) accepts hand history text input (paste or file upload), (2) parses the hand history to extract key details (players, actions, board, pot), (3) displays the hand in a structured format with street-by-street breakdown, (4) integrates with the existing analyze API endpoints if available. Reference the existing `/analyze/hands/page.tsx` for the general analyze page design pattern.
- **Success criteria**:
  - `curl http://localhost:3000/analyze/viewer` returns 200 with a functional hand viewer UI
  - Users can paste a hand history and see it parsed into a structured display
  - Street-by-street breakdown shows actions, pot sizes, and board cards
  - No "No hand selected" placeholder as the only content
- **Coach checks**:
  - Load `/analyze/viewer`, paste a sample hand history, verify it parses and displays
  - Check for console errors
  - Verify the page design matches the analyze section style
