# GTO Wizard Clone — API Documentation

Complete API reference for GTO Wizard Clone backend.

**Base URL:** `http://localhost:8000`  
**API Docs:** `http://localhost:8000/docs` (Swagger UI)  
**ReDoc:** `http://localhost:8000/redoc`

---

## Table of Contents

1. [ICM Calculator](#icm-calculator)
2. [Strategy (Push/Fold Charts)](#strategy)
3. [Courses](#courses)
4. [Community Spots](#community-spots)
5. [Equity Calculator](#equity-calculator)
6. [PLO4/Omaha](#plo4omaha)
7. [GTO Solver](#gto-solver)
8. [Hand History](#hand-history)
9. [Quiz/Training](#quiztraining)
10. [Double Board PLO](#double-board-plo)
11. [Bomb Pot](#bomb-pot)
12. [Authentication](#authentication)

---

## ICM Calculator

ICM (Independent Chip Model) tournament equity calculations.

**Base Path:** `/icm`

### Calculate ICM Equity

```
POST /api/v1/icm/calculate
```

Calculate ICM equity for a tournament scenario using Monte Carlo simulation.

**Request Body:**
```json
{
  "stacks": [5000, 3000, 2000],
  "prizes": [1000, 600, 400],
  "players": ["Alice", "Bob", "Charlie"],
  "n_simulations": 100000,
  "seed": 42
}
```

**Response:**
```json
{
  "results": [
    {
      "player": "Alice",
      "equity": 0.45,
      "chip_equity": 0.5,
      "bubble_factor": 1.05,
      "ev": 900.0
    }
  ],
  "total_prize_pool": 2000,
  "total_chips": 10000
}
```

### Calculate Bubble Factor

```
POST /api/v1/icm/bubble-factor
```

Calculate how valuable each chip is compared to raw chip equity.

**Query Parameters:**
- `stacks` (list[float]) — List of chip stacks
- `prizes` (list[float]) — Prize amounts per place
- `player_idx` (int) — Index of player to calculate
- `n_simulations` (int, default=100000) — Monte Carlo simulations

**Response:**
```json
{
  "bubble_factor": 1.23
}
```

### Tournament Scenarios

```
GET /api/v1/icm/scenarios
```

List all stored tournament scenarios.

**Query Parameters:**
- `limit` (int, default=50) — Max results
- `offset` (int, default=0) — Results offset

```
POST /api/v1/icm/scenarios
```

Create a new tournament scenario.

**Request Body:**
```json
{
  "name": "Final Table",
  "players": ["Alice", "Bob", "Charlie", "David", "Eve"],
  "stacks": [5000, 3000, 2500, 2000, 1500],
  "prizes": [5000, 3000, 2000],
  "street": "bubble"
}
```

```
GET /api/v1/icm/scenarios/{scenario_id}
```

Get a specific scenario.

```
PUT /api/v1/icm/scenarios/{scenario_id}
```

Update an existing scenario.

```
DELETE /api/v1/icm/scenarios/{scenario_id}
```

Delete a scenario.

---

## Strategy

GTO strategy storage and retrieval for push/fold charts.

**Base Path:** `/api/v1/strategy`

### Store Strategy

```
POST /api/v1/strategy
```

Store a GTO strategy in Redis.

**Request Body:**
```json
{
  "game_type": "nlh",
  "players": 2,
  "board": "preflop",
  "stack_depth": 100,
  "bet_sizes": [],
  "pot_size": 100,
  "strategy_data": [
    {"hand": "AA", "action": "push", "frequency": 1.0, "ev": 2.5},
    {"hand": "KK", "action": "push", "frequency": 0.95, "ev": 2.3}
  ]
}
```

**Response:**
```json
{
  "key": "nlh:2:preflop::100",
  "message": "Strategy stored successfully with 2 actions"
}
```

### Retrieve Strategy

```
GET /api/v1/strategy/{key}
```

Retrieve a stored strategy by key.

**Key Format:** `{game_type}:{players}:{board}:{bet_sizes}:{stack_depth}`  
**Example:** `nlh:2:preflop::100`

### Lookup Strategy

```
GET /api/v1/strategy/lookup
```

Look up a strategy by parameters.

**Query Parameters:**
- `game_type` (str, default="nlh") — Game type
- `players` (int, default=2) — Number of players
- `board` (str, default="preflop") — Board cards or 'preflop'
- `stack_depth` (int, default=100) — Stack depth in big blinds
- `bet_sizes` (str) — Comma-separated bet sizes

### List Strategies

```
GET /api/v1/strategy
```

List available strategies for given parameters.

**Query Parameters:**
- `game_type` (str, default="nlh")
- `players` (int, default=2)
- `board` (str, default="preflop")
- `limit` (int, default=10)

### Delete Strategy

```
DELETE /api/v1/strategy/{key}
```

Delete a stored strategy.

---

## Courses

Training courses with lessons and progress tracking.

**Base Path:** `/api/v1/courses`

### List Courses

```
GET /api/v1/courses
```

List all courses with optional filters.

**Query Parameters:**
- `game_type` (str) — Filter by game type (nlh, plo4, etc.)
- `difficulty` (str) — Filter by difficulty (beginner, intermediate, advanced)
- `category` (str) — Filter by category (preflop, postflop, icm, gto_fundamentals)
- `is_published` (bool) — Filter by published status
- `is_featured` (bool) — Filter by featured
- `tags` (str) — Comma-separated tags
- `limit` (int, default=50) — Max results
- `offset` (int, default=0) — Results offset

**Response:**
```json
{
  "courses": [
    {
      "id": "uuid",
      "title": "Beginner Preflop",
      "description": "Learn preflop fundamentals",
      "game_type": "nlh",
      "difficulty": "beginner",
      "category": "preflop",
      "lesson_count": 10,
      "is_published": true,
      "is_featured": true
    }
  ],
  "total": 25,
  "offset": 0,
  "limit": 50
}
```

### Get Featured Courses

```
GET /api/v1/courses/featured
```

List featured courses.

### Get Course Categories

```
GET /api/v1/courses/categories
```

Get available categories, difficulties, and game types.

**Response:**
```json
{
  "categories": ["preflop", "postflop", "icm", "gto_fundamentals", "mental_game"],
  "difficulties": ["beginner", "intermediate", "advanced"],
  "game_types": ["nlh", "plo4", "plo6", "omaha"]
}
```

### Get Course

```
GET /api/v1/courses/{course_id}
```

Get a course with all its lessons.

### Create Course

```
POST /api/v1/courses
```

Create a new course.

**Request Body:**
```json
{
  "title": "Intermediate C-Betting",
  "description": "Master continuation betting",
  "short_description": "C-betting strategies",
  "game_type": "nlh",
  "difficulty": "intermediate",
  "category": "postflop",
  "duration_minutes": 120,
  "is_published": true,
  "is_featured": false,
  "prerequisites": ["beginner-preflop"],
  "tags": ["c-bet", "postflop", "strategy"],
  "author": "GTO Wizard"
}
```

### Update Course

```
PUT /api/v1/courses/{course_id}
```

Update an existing course.

### Delete Course

```
DELETE /api/v1/courses/{course_id}
```

Delete a course and all its lessons.

---

### Lessons

```
POST /api/v1/courses/lessons
```

Create a lesson within a course.

**Request Body:**
```json
{
  "course_id": "uuid",
  "title": "Introduction to C-Betting",
  "content": "C-betting is...",
  "content_type": "text",
  "order_index": 0,
  "duration_minutes": 15,
  "is_preview": true
}
```

```
GET /api/v1/courses/lessons/{lesson_id}
```

Get a lesson.

```
PUT /api/v1/courses/lessons/{lesson_id}
```

Update a lesson.

```
DELETE /api/v1/courses/lessons/{lesson_id}
```

Delete a lesson.

---

### User Progress

```
GET /api/v1/courses/user/{user_id}/progress
```

Get all course progress for a user.

**Response:**
```json
[
  {
    "course_id": "uuid",
    "course_title": "Beginner Preflop",
    "overall_progress": 45.5,
    "lessons_completed": 5,
    "total_lessons": 11,
    "lessons": [
      {
        "id": "uuid",
        "status": "completed",
        "progress_percent": 100.0,
        "quiz_score": 85.0
      }
    ]
  }
]
```

---

## Community Spots

Share and discover community strategy spots.

**Base Path:** `/api/v1/spots`

### List Spots

```
GET /api/v1/spots
```

List community spots with optional filters.

**Query Parameters:**
- `board_type` (str) — Filter by board type (flop, turn, river)
- `position` (str) — Filter by position (btn, sb, bb, utg, etc.)
- `author` (str) — Filter by author
- `tags` (str) — Comma-separated tags
- `stack_depth_min` (int) — Minimum stack depth
- `sort_by` (str, default="recent") — Sort by: recent, popular
- `limit` (int, default=50) — Max results
- `offset` (int, default=0) — Results offset

### Create Spot

```
POST /api/v1/spots
```

Create a new community spot.

**Request Body:**
```json
{
  "title": "AKs on K-high flop",
  "description": "How to play AKs when an Ace hits the flop",
  "board": "Kd-7h-2c",
  "board_type": "flop",
  "position": "btn",
  "pot_size": 100.0,
  "stack_depth": 100,
  "author": "ProPlayer",
  "tags": ["top-pair", "AK", "continuation-bet"],
  "strategy_json": {
    "actions": [
      {"hand": "AKs", "action": "bet", "frequency": 0.85, "size": 0.5}
    ]
  }
}
```

### Get Spot

```
GET /api/v1/spots/{spot_id}
```

Get a single spot by ID.

### Update Spot

```
PUT /api/v1/spots/{spot_id}
```

Update an existing spot.

### Delete Spot

```
DELETE /api/v1/spots/{spot_id}
```

Delete a spot.

---

### Likes

```
POST /api/v1/spots/{spot_id}/like
```

Like a spot.

**Query Parameters:**
- `user_id` (str, default="anonymous") — User ID

```
DELETE /api/v1/spots/{spot_id}/like
```

Unlike a spot.

```
GET /api/v1/spots/{spot_id}/likes
```

Get all likes for a spot.

---

### Fork

```
POST /api/v1/spots/{spot_id}/fork
```

Fork a spot to your account.

**Query Parameters:**
- `author` (str, default="anonymous") — Author for forked spot

---

### Comments

```
POST /api/v1/spots/{spot_id}/comments
```

Add a comment to a spot.

**Request Body:**
```json
{
  "author": "PlayerName",
  "content": "Great spot explanation!"
}
```

```
GET /api/v1/spots/{spot_id}/comments
```

Get all comments for a spot.

```
DELETE /api/v1/spots/{spot_id}/comments/{comment_id}
```

Delete a comment.

---

## Equity Calculator

NLH and multi-variant equity calculations.

**Base Path:** `/api/v1/equity`

### Calculate Hand Equity

```
POST /api/v1/equity/calculate
```

Calculate equity between hands or ranges.

**Request Body:**
```json
{
  "hands": ["AsAh", "KdKh"],
  "board": "Qs-Js-2c",
  "iterations": 10000,
  "dead_cards": []
}
```

**Response:**
```json
{
  "equity": [0.72, 0.28],
  "hands": ["AsAh", "KdKh"],
  "board": "Qs-Js-2c",
  "iterations": 10000
}
```

### Range vs Range Equity

```
POST /api/v1/equity/range-vs-range
```

Calculate equity between ranges.

**Request Body:**
```json
{
  "hero_range": "AA-TT,AKs-AQs,AKo-AQo",
  "villain_range": "77-55,98s,87s",
  "board": "Kh-7c-2d",
  "iterations": 50000
}
```

---

## PLO4/Omaha

Pot-Limit Omaha 4 equity and range calculations.

**Base Path:** `/api/v1/plo4`

### Calculate PLO4 Equity

```
POST /api/v1/plo4/equity
```

Calculate PLO4 hand equity.

**Request Body:**
```json
{
  "hands": [["Ah", "Kd", "Tc", "9s"], ["As", "Ks", "Ts", "9s"]],
  "board": ["Js", "8d", "2h"],
  "iterations": 10000
}
```

### Calculate PLO4 Range Equity

```
POST /api/v1/plo4/range-equity
```

Calculate equity between PLO4 ranges.

**Request Body:**
```json
{
  "hero_range": "AAKK,AAQT",
  "villain_range": "7766,8855",
  "board": ["Js", "8d", "2h"],
  "iterations": 50000
}
```

---

## GTO Solver

MCCFR-based GTO solving for river, turn, and flop spots.

**Base Path:** `/api/v1/solver`

### Submit Solving Job

```
POST /api/v1/solver/solve
```

Submit a new solving job.

**Request Body:**
```json
{
  "game_type": "nlh",
  "players": 2,
  "p0_cards": ["As", "Ah"],
  "p1_cards": ["Kd", "Kh"],
  "board": ["Qs", "Js", "2c"],
  "pot": 100,
  "stacks": [1000, 1000],
  "street": "river",
  "max_iterations": 1000000,
  "target_exploitability": 0.01
}
```

### Get Solving Status

```
GET /api/v1/solver/status/{job_id}
```

Get the status of a solving job.

### Get Solving Results

```
GET /api/v1/solver/results/{job_id}
```

Get solving results when complete.

### Stream Solving Progress

```
WebSocket /ws/solver/{job_id}
```

Stream solving progress in real-time.

---

## Hand History

Hand history import, parsing, and analysis.

**Base Path:** `/api/v1/hh`

### Import Hands

```
POST /api/v1/hh/import
```

Batch import multiple hands.

**Request Body:**
```json
{
  "hands": [
    {"site": "pokerstars", "text": "..."},
    {"site": "ggpoker", "text": "..."}
  ]
}
```

### Upload Hand History File

```
POST /api/v1/hh/batch-upload
```

Multipart file upload for hand histories (up to 50MB).

### Query Hands

```
GET /api/v1/hh/hands
```

Query hands with filters.

**Query Parameters:**
- `date_from` (str) — Start date
- `date_to` (str) — End date
- `board_texture` (str) — rainbow, two_suited, monotone, paired
- `pot_min` (int) — Minimum pot size
- `position` (str) — Hero position
- `spot_category` (str) — Spot type

### Get Single Hand

```
GET /api/v1/hh/hands/{hand_id}
```

Get a single hand with full details.

### Update Hand Tags

```
PATCH /api/v1/hh/hands/{hand_id}/tags
```

Add/update tags on a hand.

### Export Hands

```
GET /api/v1/hh/export
```

CSV export of hands with filters.

### Get Hand Statistics

```
GET /api/v1/hh/stats
```

Aggregated statistics (total hands, EV loss by spot).

### Analyze Leaks

```
POST /api/v1/hh/analyze-leaks
```

Leak identification vs GTO baseline.

---

## Quiz/Training

Quiz-based GTO training with real-time feedback.

**Base Path:** `/api/v1/quiz`

### Get Random Spot

```
GET /api/v1/quiz/random
```

Get a random quiz spot.

**Query Parameters:**
- `category` (str) — Spot category
- `difficulty` (str) — beginner, intermediate, advanced
- `street` (str) — preflop, flop, turn, river

### Submit Answer

```
POST /api/v1/quiz/submit
```

Submit an answer to a spot.

**Request Body:**
```json
{
  "spot_id": "uuid",
  "selected_action": "bet",
  "user_id": "user-uuid"
}
```

### Get Spot Details

```
GET /api/v1/quiz/spot/{spot_id}
```

Get specific quiz spot details.

### Get User Stats

```
GET /api/v1/quiz/stats/{user_id}
```

Get user accuracy, streak, level, and weak spots.

### Get Leaderboard

```
GET /api/v1/quiz/leaderboard
```

Top users by accuracy (minimum 10 solves).

### Get Categories

```
GET /api/v1/quiz/categories
```

All categories and difficulties.

### Get Missed Spots

```
GET /api/v1/quiz/missed/{user_id}
```

User's missed spots for review.

### Mark for Review

```
POST /api/v1/quiz/review/{spot_id}
```

Mark spot for review + mastered status.

### Get Review Spots

```
GET /api/v1/quiz/review/{user_id}
```

Get user's review spots.

### WebSocket Events

**Endpoint:** `/ws/quiz`

| Event | Direction | Description |
|-------|-----------|-------------|
| `join_quiz_session` | Client→Server | Join a quiz session room |
| `leave_quiz_session` | Client→Server | Leave current session |
| `quiz_answer` | Client→Server | Submit answer (broadcast) |
| `request_leaderboard` | Client→Server | Get current leaderboard |
| `quiz:user_answered` | Server→All | Real-time answer broadcast |
| `quiz:user_joined` | Server→All | User joined notification |
| `quiz:user_left` | Server→All | User left notification |
| `leaderboard` | Server→Client | Current rankings |

---

## Double Board PLO

Novel double board PLO with scoop/chop scoring.

**Base Path:** `/api/v1/double-board`

### Calculate Double Board Equity

```
POST /api/v1/double-board/equity
```

Calculate equity for two boards.

**Request Body:**
```json
{
  "hands": [["Ah", "Kd", "Tc", "9s"], ["As", "Ks", "Ts", "9s"]],
  "board1": ["Js", "8d", "2h"],
  "board2": ["Jh", "7c", "3d"],
  "pot": 100,
  "iterations": 10000
}
```

**Response:**
```json
{
  "equity": [0.65, 0.35],
  "scoop_wins": 6500,
  "chop_wins": 0,
  "total_sims": 10000
}
```

### Evaluate Hand on Both Boards

```
POST /api/v1/double-board/hand-rank
```

Evaluate a hand's rank on both boards.

---

## Bomb Pot

Novel bomb pot with action-first betting.

**Base Path:** `/api/v1/bomb-pot`

### Create Game State

```
POST /api/v1/bomb-pot/game-state
```

Create a new bomb pot game state.

**Request Body:**
```json
{
  "players": ["Alice", "Bob", "Charlie", "David"],
  "straddle_map": {"btn": 20, "co": 40},
  "junk_blinds": [5, 5, 5, 5]
}
```

### Submit Action

```
POST /api/v1/bomb-pot/action
```

Submit an action in the bomb pot.

### Calculate Equity

```
GET /api/v1/bomb-pot/equity
```

Calculate bomb pot equity given current state.

---

## Authentication

User authentication and management.

**Base Path:** `/api/v1/auth`

### Register

```
POST /api/v1/auth/register
```

Register a new user.

### Login

```
POST /api/v1/auth/login
```

Login and get access token.

### Get Profile

```
GET /api/v1/auth/me
```

Get current user profile.

---

## Error Responses

All endpoints return appropriate HTTP status codes:

| Code | Description |
|------|-------------|
| 400 | Bad Request — Invalid input parameters |
| 404 | Not Found — Resource doesn't exist |
| 500 | Internal Server Error — Server-side error |

**Error Response Format:**
```json
{
  "detail": "Error message describing the issue"
}
```

---

## Rate Limits

- Default: 100 requests per minute per IP
- Solving endpoints: 10 requests per minute
- File upload: 5 requests per minute

---

*Last updated: 2026-05-27*