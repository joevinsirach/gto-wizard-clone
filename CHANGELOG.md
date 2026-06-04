# Changelog

## [v1.0.0] — 2026-06-04

### Features

**Game Variants (7 total)**
- No-Limit Hold'em (NLH) — full equity + solver support
- Pot-Limit Omaha 4 (PLO4) — PokerHandEvaluator integration
- PLO5 (5-card Omaha) — 4-card from 5 evaluation
- Omaha Hi/Lo (8-or-better) — split pot, 8-qualifier
- Shortdeck (6+ Hold'em) — modified rankings (flush > full house)
- Double Board PLO — novel, scoop/chop scoring
- Bomb Pot — novel, action-first betting

**GTO Solver**
- MCCFR engine with chance sampling
- Flop/Turn/River street progression
- gRPC service for solver communication
- Strategy storage in PostgreSQL + Redis

**Training Mode**
- Quiz-based GTO training with real-time feedback
- WebSocket events for live sessions
- EV loss tracking per spot category
- Leaderboard with scoring system
- Review mode for missed spots

**Hand History Analyzer**
- Multi-site support (PokerStars, GGPoker, Winamax)
- Board texture classification
- Spot categorization for leak analysis
- CSV export
- Hand playback viewer

**ICM Calculator**
- Monte Carlo tournament equity simulation
- Bubble factor calculation
- Prize pool configuration

**Push/Fold Charts**
- Nash equilibrium charts by stack depth and position
- ICM-adjusted recommendations
- Export functionality

**Training Courses**
- Structured learning paths with lessons
- Progress tracking
- Difficulty levels (Beginner, Intermediate, Advanced)
- Categories: Preflop, Postflop, ICM, GTO Fundamentals

**Community Spots**
- Share and discover strategy spots
- Like, comment, fork functionality
- Position and board type filters
- Strategy heatmap visualization

**PWA Support**
- Offline service worker
- App shortcuts
- Standalone display mode
- Theme-aware status bar

### Tech Stack
- Frontend: Next.js 15, React 19, TypeScript, Tailwind v4
- Backend: FastAPI, Pydantic v2, WebSockets, Celery
- Solver: Python 3.12, NumPy, Numba, MCCFR
- Database: PostgreSQL (Neon serverless)
- Cache: Redis
- Deployment: Docker Compose

### Tests
- 368 poker-core unit tests
- 212 solver tests
- 9 API tests
- 74 Playwright E2E tests
- Total: 663+ tests

### External Libraries
- HenryRLee/PokerHandEvaluator (501⭐) — PLO4/PLO5/Hi-Lo
- zekyll/OMPEval (224⭐) — NLH evaluation
- siavashg87/poker-odds-calc (99⭐) — multi-variant equity
- apcode/poker-mtt-icm (12⭐) — tournament ICM
