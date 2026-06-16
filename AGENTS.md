# AGENTS.md — GTO Wizard Clone

## About
Open-source GTO poker training platform. Equity calculator, CFR solver, training modes, hand history analysis, ICM calculator, push/fold charts, and training courses. Live at `wiz.codeovertcp.com`.

**Status:** Active development — core features exist, polish needed.

**Reference target:** See `docs/reference-study-interface.png` for the exact interactive training interface the study page should replicate.

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
- **Run**: `cd /home/sc/repos/gto-wizard-clone && PYTHONPATH=apps/api .venv/bin/python apps/api/prisma/seed_preflop_strategies.py`
- **Note**: Idempotent — safe to run multiple times. Seeds 7 preflop GTO strategies (6 positions + default) at 100bb. Requires the venv (`.venv`) with asyncpg installed (run `uv sync --group runtime` first if needed).
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
- **Coach checks**: Load `/range-explorer` page, verify the range grid renders with frequency coloring. Check for console errors. Verify position selector works.
