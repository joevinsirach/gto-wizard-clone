# GTO Wizard Clone

**Open-source GTO poker training platform** — equity calculator, CFR solver, training modes, hand history analysis, and ICM calculator.

## Mission

Build a full-featured poker training platform that rivals commercial tools like GTO Wizard, PokerSnowie, and PioSolver — completely open source, self-hostable, and extensible.

## Feature Overview

### 🎯 Core Features

| Feature | Status | Description |
|---------|--------|-------------|
| **Equity Calculator** | 🔬 Planning | Hand vs range, range vs range equity with Monte Carlo + exact enumeration |
| **GTO Solver** | 🔬 Planning | CFR-based Nash equilibrium solver for No-Limit Hold'em |
| **Training Quizzes** | 🔬 Planning | Flop/turn/river quizzes with GTO answer comparison |
| **Hand History Analyzer** | 🔬 Planning | Parse, store, and analyze HH files vs GTO baseline |
| **ICM Calculator** | 🔬 Planning | Tournament ICM + push/fold charts |
| **Range Builder** | 🔬 Planning | Visual range selector with equity visualization |
| **Content Library** | 🔬 Planning | Pre-built courses and community spots |

### 🏗️ Architecture

```
gto-wizard-clone/
├── apps/
│   ├── web/            # Next.js 15 + TypeScript frontend
│   ├── api/            # FastAPI + WebSocket backend
│   └── solver/         # Python CFR engine (gRPC service)
├── packages/
│   ├── poker-core/     # Shared: hand evaluation, equity calc (TS + Python)
│   ├── ui-components/  # Shared component library
│   └── types/          # Shared TypeScript types
├── infra/docker/       # Docker + docker-compose
└── scripts/            # HH parsing + data tools
```

### 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 15, React 19, TypeScript, Tailwind CSS, Shadcn UI |
| Backend | FastAPI (Python 3.12+), Pydantic v2, WebSockets |
| Solver Engine | Python 3.12, NumPy, Numba JIT, MCCFR algorithm |
| Database | PostgreSQL (Neon serverless) |
| Cache | Redis |
| Container | Docker, Docker Compose |

## Open-Source Libraries Used

### Poker Engine
- [zekyll/OMPEval](https://github.com/zekyll/OMPEval) — Fast C++ hand evaluator
- [siavashg87/poker-odds-calc](https://github.com/siavashg87/poker-odds-calc) — Fast Node equity calc
- [thotbreakerr/Texas-Holdem-AI](https://github.com/thotbreakerr/Texas-Holdem-AI) — MCCFR + GTO + ICM reference

### ICM & Training
- [apcode/poker-mtt-icm](https://github.com/apcode/poker-mtt-icm) — Python ICM calculator
- [battermann/equiweb](https://github.com/battermann/equiweb) — In-browser range equity

### Hand History
- [aneopsy/PokerStats](https://github.com/aneopsy/PokerStats) — PokerStars HH parser (Python)

## Development Phases

### Phase 1: Foundation (Weeks 1-2)
- [ ] Repo setup (monorepo, Docker, CI/CD)
- [ ] Poker core library (deck, hand evaluation, equity)
- [ ] Basic API + WebSocket infrastructure
- [ ] Basic UI (Next.js + Tailwind)

### Phase 2: Equity Calculator (Weeks 3-4)
- [ ] Monte Carlo equity engine
- [ ] Range input UI (grid selector)
- [ ] Equity visualization (charts, heatmaps)
- [ ] Redis caching layer

### Phase 3: GTO Solver (Weeks 5-8)
- [ ] MCCFR implementation
- [ ] Pre-flop strategy tables
- [ ] Flop/river solve jobs (background)
- [ ] Strategy storage + retrieval
- [ ] WebSocket progress streaming

### Phase 4: Training Mode (Weeks 9-10)
- [ ] Quiz engine
- [ ] Spot randomization
- [ ] GTO answer comparison
- [ ] Progress tracking + leaderboards

### Phase 5: Hand History (Weeks 11-12)
- [ ] HH file upload + parsing (PokerStars, GGPoker, Winamax)
- [ ] HH database
- [ ] Leak analysis vs GTO
- [ ] HH playback viewer

### Phase 6: ICM + Advanced (Weeks 13-14)
- [ ] ICM calculator
- [ ] Push/fold charts
- [ ] Tournament scenarios
- [ ] Content library

## License

MIT