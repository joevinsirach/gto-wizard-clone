# GTO Wizard Clone — Architecture Specification

Open-source GTO poker training platform with equity calculator, CFR solver, training modes, hand history analysis, and ICM calculator. Supports **NLH, PLO4, PLO5, Omaha Hi/Lo, Shortdeck, Double Board PLO, and Bomb Pot**.

**Created:** 2026-05-25 | **Updated:** 2026-05-26

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         CLIENT (Browser)                            │
│  Next.js 15 + React 19 + TypeScript + Tailwind v4 + Shadcn UI       │
│  WebSocket (Socket.io) ←→ Solver progress streaming                 │
└────────────────────────┬────────────────────────────────────────────┘
                         │ REST + WebSocket
┌────────────────────────▼────────────────────────────────────────────┐
│                      FASTAPI API GATEWAY                             │
│  /api/v1/*  — REST endpoints                                        │
│  /ws/*      — WebSocket for real-time (solve progress, quiz events) │
└─────┬──────────────────────┬───────────────────────────────────────┘
      │                      │
┌─────▼──────┐    ┌──────────▼──────────┐
│   Redis    │    │   PostgreSQL (Neon) │
│   Cache    │    │   Strategies, HH    │
└────────────┘    └─────────────────────┘
```

---

## Supported Game Variants

| Variant | Code | Phase | Evaluator | Notes |
|---------|------|-------|-----------|-------|
| No-Limit Hold'em | `nlh` | ✅ Ready | OMPEval (C++) | Standard |
| Pot-Limit Omaha 4 | `plo4` | Phase 2b | **PokerHandEvaluator** (C++/Python) | 4 hole cards |
| PLO5 (5-card Omaha) | `plo5` | Phase 2c | 4-card from 5 eval | 5 hole cards |
| Omaha Hi/Lo (8-or-better) | `plo_hi_lo` | Phase 2c | PokerHandEvaluator (native) | Split pot + 8-qualifier required |
| Shortdeck (6+ Hold'em) | `shortdeck` | Phase 2c | Modified rankings | A-6 only, flush > full house |
| **Double Board PLO** | `double_board_plo` | Phase 2d | **Novel** — two boards | Scoop/chop scoring |
| **Bomb Pot** | `bomb_pot` | Phase 2d | **Novel** — action-first | Straddle/junk blinds |

---

## Application Structure

### `apps/web` — Frontend (Next.js 15)
Key pages: `/`, `/equity`, `/plo`, `/train`, `/analyze`, `/icm`, `/ranges`, `/double-board`, `/bomb-pot`

### `apps/api` — Backend (FastAPI)
Key routers: `equity.py`, `solver.py`, `quiz.py`, `hh.py`, `plo.py`, `double_board.py`, `bomb_pot.py`, `icm.py`

### `apps/solver` — GTO Solver (Python MCCFR)

### `packages/poker-core` — Shared Poker Logic
`deck.py`, `hand.py`, `equity.py`, `range.py`, `plo4.py`, `omaha_hi_lo.py`, `shortdeck.py`, `double_board.py`, `bomb_pot.py`

---

## External Libraries

| Library | Stars | Use |
|---------|-------|-----|
| [HenryRLee/PokerHandEvaluator](https://github.com/HenryRLee/PokerHandEvaluator) | 501 | PLO4/PLO5/Hi-Lo hand evaluation |
| [zekyll/OMPEval](https://github.com/zekyll/OMPEval) | 224 | NLH hand evaluator (C++) |
| [siavashg87/poker-odds-calc](https://github.com/siavashg87/poker-odds-calc) | 99 | Multi-variant equity |
| [ksoeze/OmahaRangeExplorer](https://github.com/ksoeze/OmahaRangeExplorer) | 4 | Python PLO4 range builder |
| [apcode/poker-mtt-icm](https://github.com/apcode/poker-mtt-icm) | 12 | Tournament ICM |

---

## PLO4 Implementation

PLO4 uses 4 hole cards per player. Best 2-card combination from 4 + best 3-card combination from 5 board = 5-card poker hand.

**Key library:** `PokerHandEvaluator` — 501 stars, C++/Python, native PLO4/PLO5/Hi-Lo with wheel/broadway/four-straight detection.

```python
# PLO4 hand evaluation flow
from poker_hand_evaluator import evaluate

hand = ["Ah", "Kd", "Tc", "9s"]   # 4 hole cards
board = ["Js", "8d", "2h"]        # 3 board cards

# Best hand = best 2-of-4 + board 3-of-5
result = evaluate(hand, board)  # returns hand_rank (lower = better)
```

### Backend Routers

```
plo4_equity.py      — PLO4 equity endpoints (/api/v1/plo4/equity, /api/v1/plo4/range-equity)
plo4_ranges.py     — PLO4 range builder + push/fold charts
```

---

## Double Board PLO (Phase 2d — Novel)

Two independent boards per showdown. Player scoops if they win **both** boards; chops if they win one; wins nothing if they lose both.

**Scoring formula:**
```
adjusted_equity = (scoop_wins × 1.0 + chop_wins × 0.5) / total_sims
```

**Frontend page:** `/double-board` — board selector for both boards, hand input, scoop/chop equity display.

**Key challenge:** Standard hand evaluators are built for single-board. Double board requires two independent evaluations and a scoop accumulator.

### Double Board PLO Architecture

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

**Core logic:**
- For each simulation: evaluate player hand on board1 AND board2 independently
- Player 1 scoops: wins 1.0 (both boards better)
- Player 1 chops: wins 0.5 (one board better, one worse — tie)
- Neither scoops nor chops: 0.0

**API Endpoints:**
- `POST /api/v1/double-board/equity` — calculate double board equity
- `POST /api/v1/double-board/hand-rank` — evaluate hand on both boards

---

## Bomb Pot (Phase 2d — Novel)

**Rules twist:** Actions happen BEFORE the board is dealt. In a bomb pot, players post straddle/junk blinds that are larger than normal, and betting proceeds pre-flop with no option to fold (until post-flop action). The board is then dealt and regular post-flop betting continues.

**Key properties:**
- No pre-flop "fold" option exists for players who posted straddle
- All players see the flop/turn/river regardless of pre-flop action
- Often played as a "action game" variant

**Frontend page:** `/bomb-pot` — player count, straddle map (which positions straddle and how much), junk blind amounts.

**Key challenge:** Game theory for bomb pots is non-standard — theInfoset model changes because the initial state includes a straddle-round rather than a fold-round.

### Bomb Pot Architecture

```
bomb_pot.py
├── BombPotGameState
│   ├── straddle_map: Dict[Position, int]  # which positions straddle and amounts
│   ├── junk_blinds: List[int]              # extra blinds from bomb pot rules
│   ├── betting_order: List[Position]       # who acts next
│   └── phase: Phase (STRADDLE_ROUND, FLOP, TURN, RIVER)
├── BombPotAction
│   ├── action_type: ActionType (STRADDLE, CALL, RAISE, CHECK)
│   ├── amount: int (for raises)
│   └── player: Position
├── BombPotGameModel
│   ├── create_straddle_map(positions, amounts) -> Dict
│   ├── next_bettor(state) -> Position
│   ├── resolve_preflop(state) -> (pot, betting_complete)
│   └── is_betting_complete(state) -> bool
```

**Game model properties:**
- `straddle_map`: Maps position -> straddle amount. E.g., `{1: 20, 3: 40}` means UTG+1 straddle $20, CO straddle $40
- `junk_blinds`: Additional dead money from bomb pot rules (ante, straddle adds to pot)
- `betting_order`: Order of players who act in straddle round

**Key difference from standard poker:**
- Round 0 = straddle round (no fold option)
- Players who straddle are automatically in the hand
- Straddle is a raise option, not mandatory (unless "mandatory straddle" rule)

**API Endpoints:**
- `POST /api/v1/bomb-pot/game-state` — create new bomb pot game state
- `POST /api/v1/bomb-pot/action` — submit an action
- `GET /api/v1/bomb-pot/equity` — calculate bomb pot equity given state

---

## Phase 5: Hand History Analyzer (Week 11-12)

Hand history analysis with multi-site support (PokerStars, GGPoker, Winamax), leak identification vs GTO baseline, and HH playback viewer.

### Hand History Parsers

```python
# packages/poker-core/src/gto_poker/hand_history.py
detect_format(text)           # -> "pokerstars" | "ggpoker" | "winamax" | None
parse_hand(text)              # auto-detect + parse
parse_pokerstars_hh(text)     # PokerStars format
parse_ggpoker_hh(text)        # GGPoker format (uses ***HOLECARDS*** no spaces)
parse_winamax_hh(text)        # Winamax format
```

### Database Models

```python
# apps/api/models/hh_models.py
HandHistory     # id, user_id, site, raw_text, parsed_data(JSONB), pot, board(JSONB), hero_name
HandTag         # id, hand_id(FK), user_id, tag
HandAction      # id, hand_id(FK), player, action_type, street, position, ev_loss, gto_action
SpotCategory    # preflop_call, preflop_3bet, flop_cbet, turn_cbet, river_shove, etc.
BoardTexture    # rainbow, two_suited, monotone, paired, connected, gapped

classify_board_texture(board: List[str]) -> BoardTexture
categorize_spot(actions, hero_name, street) -> SpotCategory
```

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/hh/import` | Batch import multiple hands |
| POST | `/api/v1/hh/batch-upload` | Multipart file upload |
| GET | `/api/v1/hh/hands` | Query with filters (date, board_texture, pot, position, spot_category) |
| GET | `/api/v1/hh/hands/{hand_id}` | Get single hand details |
| PATCH | `/api/v1/hh/hands/{hand_id}/tags` | Add/update tags |
| GET | `/api/v1/hh/export` | CSV export with filters |
| GET | `/api/v1/hh/stats` | Aggregated stats (total hands, EV loss by spot) |
| POST | `/api/v1/hh/analyze-leaks` | Leak identification vs GTO baseline |
| GET | `/api/v1/hh/board-texture/{texture}` | Filter by board texture |
| GET | `/api/v1/hh/spot-category/{category}` | Filter by spot category |

### Frontend Components

```typescript
// apps/web/src/components/hh/
FileUpload.tsx    # Drag-and-drop, progress, format detection, 50MB max
BatchImport.tsx   # 10k+ hand batch imports with progress tracking
HandViewer.tsx    # Step-through playback with GTO comparison
HandTable.tsx     # Paginated hand list with filters
BoardDisplay.tsx  # Board cards + texture labels (paired, suited, rainbow)
LeakChart.tsx     # EV loss bar chart visualization
TagInput.tsx      # HH tagging with autocomplete
csvExport.ts      # Browser CSV download

// apps/web/src/app/analyze/
page.tsx          # HH upload page
hands/page.tsx   # Paginated hand list + CSV export
leaks/page.tsx   # EV loss report by spot category
```

### Spot Categories for Leak Analysis

`preflop_call`, `preflop_3bet`, `preflop_4bet`, `preflop_squeeze`,
`flop_cbet`, `flop_checkraise`, `flop_checkcall`,
`turn_cbet`, `turn_check`, `turn_checkraise`,
`river_shove`, `river_donk`, `river_call`

---

## Phase 6: ICM Calculator & Polish (Week 13-14)

ICM calculator, push/fold charts, training courses, community spots, and PWA polish.

### ICM Calculator (`/icm`)

ICM (Independent Chip Model) calculator for tournament equity calculations. Uses the [`apcode/poker-mtt-icm`](https://github.com/apcode/poker-mtt-icm) library for tournament equity computations.

#### Frontend Components

```typescript
// apps/web/src/app/icm/page.tsx
PrizePoolPanel    # Prize distribution editing (% and amounts)
ChipStackPanel    # Player chips with add/remove functionality
TournamentSettings # Buy-in and total chips inputs
ICMResults        # Equity calculations display
AboutICM         # Educational section about ICM concepts
```

#### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/icm/calculate` | Calculate ICM equity for a tournament state |
| POST | `/api/v1/icm/prize-pool` | Update prize pool distribution |

---

### Push/Fold Charts (`/strategies`)

Pre-generated Nash push/fold charts for common tournament stack sizes. Charts are filtered by stack depth and position.

#### Frontend Components

```typescript
// apps/web/src/app/strategies/page.tsx
PushFoldChart    # Filterable chart display
PositionFilter   # Filter by position (BTN, SB, BB, CO, etc.)
StackFilter      # Filter by stack depth (BBs)
ChartTypeToggle  # Open push vs call charts
ExportButton     # Export chart as image/PDF
```

---

### Training Courses (`/courses`)

Structured learning paths with lessons, quizzes, and progress tracking.

#### Frontend Components

```typescript
// apps/web/src/app/courses/page.tsx
CourseCard        # Course preview with progress bar
CourseDetail      # Course detail view with lessons
QuickStats        # Dashboard with courses started, lessons completed, time spent
DifficultyFilter # Filter courses by difficulty
CategoryFilter   # Filter by category (preflop, postflop, icm, gto_fundamentals)
ProgressBar       # Visual progress indicator (bg-poker-gold)
```

#### Database Models

```python
# apps/api/models/course_models.py
Course        # id, title, description, category, difficulty, lessons_count
Lesson        # id, course_id, title, content, order, type (video/text/quiz)
UserProgress  # id, user_id, lesson_id, completed, score
```

#### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/courses` | List all courses (filterable) |
| GET | `/api/v1/courses/{course_id}` | Get course with lessons |
| POST | `/api/v1/courses/{course_id}/progress` | Update user progress |
| GET | `/api/v1/courses/stats` | Get user's course statistics |

---

### Community Spots (`/spots`)

Share and discover community strategy spots. Users can submit spots with board and ranges.

#### Frontend Components

```typescript
// apps/web/src/app/spots/page.tsx
SpotsList         # Paginated list of community spots
SpotCard          # Spot preview with position badges
SpotDetail        # Full spot view with strategy heatmap
PositionFilter    # Filter by position (BTN, SB, BB, CO)
BoardTypeFilter   # Filter by board type (dry, wet, paired, rainbow)
SearchInput       # Search spots by title/description
SortDropdown      # Sort by recent or popular
ShareSpotButton   # Open spot submission modal
StrategyHeatmap   # Visual representation of GTO strategy
LikeButton        # Toggle like on spot
PracticeButton    # Navigate to train with this spot
```

#### Database Models

```python
# apps/api/models/spots_models.py
Spot              # id, user_id, title, description, position, board_type, hero_range, villain_range, board_cards, likes_count
SpotComment       # id, spot_id, user_id, comment, created_at
SpotLike          # id, spot_id, user_id (unique constraint)
```

#### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/spots` | Listspots (filterable by position, board_type) |
| GET | `/api/v1/spots/{spot_id}` | Get spot details |
| POST | `/api/v1/spots` | Create new spot |
| POST | `/api/v1/spots/{spot_id}/like` | Toggle like |
| GET | `/api/v1/spots/stats` | Get community stats |

---

### PWA Installation

Progressive Web App support for desktop and mobile installation.

#### Manifest Requirements

```json
{
  "name": "GTO Wizard Clone",
  "short_name": "GTO Wizard",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#000000",
  "theme_color": "#16a34a",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ],
  "shortcuts": [
    { "name": "ICM Calculator", "url": "/icm" },
    { "name": "Courses", "url": "/courses" },
    { "name": "Community Spots", "url": "/spots" }
  ]
}
```

#### Key Features

- Service worker for offline caching
- 192x192 and 512x512 icons
- App shortcuts for quick navigation
- Standalone display mode
- Theme-aware status bar styling

---

## Phase 2b/2c/2d Skills

Each sub-phase uses targeted skills:

| Phase | Primary Skill | Secondary Skill | Description |
|-------|--------------|-----------------|-------------|
| 2b PLO4 | `repo-transmute` | `test-driven-development` | Adapt PokerHandEvaluator bindings, test equity |
| 2c Omaha+Shortdeck | `docker-patterns` | `test-driven-development` | Dockerize PHE library, add variant eval |
| 2d Double Board | `blueprint` | `test-driven-development` | Plan novel architecture, scoop/chop logic |
| 2d Bomb Pot | `blueprint` | `test-driven-development` | Plan action-first game model, no-fold preflop |

---

*Last updated: 2026-05-26*