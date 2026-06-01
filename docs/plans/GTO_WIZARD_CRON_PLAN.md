# GTO Wizard Clone — Autonomous Development Plan (Cron-Driven)

**Domain:** wiz.codeovertcp.com  
**Repo:** /tmp/gto-wizard-clone (ChonSong/gto-wizard-clone)  
**Phase:** 3+ (Core complete, polish + solver integration needed)  
**Updated:** 2026-05-29

---

## Current State Audit

### ✅ Complete (Phases 1-2d)
| Layer | Status | Details |
|-------|--------|---------|
| Poker Core | ✅ 14 modules, 13 test files | NLH, PLO4, PLO5, Omaha Hi/Lo, Shortdeck, Double Board, Bomb Pot |
| API Routers | ✅ 17 routers | Equity, solver (thin), quiz, quiz_ws, hh, icm, strategy, spots, analyze_leaks, auth (thin), variants |
| Frontend Pages | ✅ 15 pages | All major routes exist with real content |
| Docker | ⚠️ Partial | docker-compose.yml exists, not fully wired |

### 🚧 Critical Gaps (vs real GTO Wizard)
| Gap | Severity | Why It Matters |
|-----|----------|--------------|
| **Solver engine integration** | 🔴 High | Real GTO Wizard runs CFR solver; we have ~139 line stub |
| **Auth / user accounts** | 🔴 High | Cannot track progress, leaderboard, personal stats |
| **Database persistence** | 🔴 High | Quiz spots, HH, user stats need PostgreSQL |
| **Line Review mode** | 🟡 Medium | Post-solve review of individual lines |
| **Range Explorer matrix** | 🟡 Medium | Visual range grid with frequencies |
| **Docker production build** | 🟡 Medium | Needs verified compose for deployment |
| **Landing page polish** | 🟢 Low | Current landing is 63 lines, needs feature showcase |

---

## Cron Phase Plan

### Phase A: Database & Auth Foundation (2-3 days)
**Goal:** PostgreSQL models, migrations, JWT auth, user registration/login

**Skills to load:**
- `better-auth-create-auth` — Better Auth setup with FastAPI
- `better-auth-emailAndPassword` — Email/password login
- `supabase-postgres-best-practices` — PostgreSQL schema design

**Files:**
- `apps/api/models/` — User, QuizSpot, QuizSubmission, HandHistory, Course, UserProgress
- `apps/api/routers/auth.py` — JWT login/register/me endpoints
- `apps/api/db.py` — SQLAlchemy async engine + session
- `apps/api/prisma/seed.py` — 50+ quiz spots seed data

**Cron cadence:** Every 6 hours until complete

---

### Phase B: Solver Engine Integration (3-4 days)
**Goal:** Wire existing CFR engine into API + frontend

**Skills to load:**
- `repo-transmute` — Code migration patterns
- `test-driven-development` — Solver accuracy verification

**Files:**
- `apps/solver/cfr/engine.py` — Verify MCCFR implementation
- `apps/api/routers/solver.py` — /solve, /status, /results endpoints
- `apps/web/src/app/solve/page.tsx` — Solver configuration UI
- `apps/web/src/app/solve/review/page.tsx` — Line review mode
- `apps/web/src/components/SolverProgress.tsx` — Real-time solve progress

**Cron cadence:** Every 8 hours until complete

---

### Phase C: Range Explorer & Line Review (2-3 days)
**Goal:** Visual range matrix + post-solve line review

**Skills to load:**
- `Leonxlnx-taste-skill` — Frontend design polish
- `design-an-interface` — Generate range explorer UI

**Files:**
- `apps/web/src/components/equity/RangeGrid.tsx` — Range matrix with frequencies
- `apps/web/src/components/equity/RangeExplorer.tsx` — Interactive range builder
- `apps/web/src/app/solve/review/page.tsx` — Line-by-line review with EV comparison
- `apps/web/src/components/train/LineReviewCard.tsx` — Individual line review card

**Cron cadence:** Every 12 hours until complete

---

### Phase D: Docker Production & Deployment (1-2 days)
**Goal:** Verified docker-compose build, env config, health checks

**Skills to load:**
- `docker-patterns` — Docker best practices
- `deployment-patterns` — CI/CD deployment

**Files:**
- `docker-compose.yml` — Verified postgres + redis + api + web + solver
- `apps/api/Dockerfile` — Multi-stage Python build
- `apps/web/Dockerfile` — Multi-stage Node build
- `apps/solver/Dockerfile` — Solver worker container
- `.env.example` — Production environment template

**Cron cadence:** Once per day until verified

---

### Phase E: Frontend Polish & PWA (2 days)
**Goal:** Landing page, PWA manifest, theme consistency

**Skills to load:**
- `creative` — Visual design assets
- `addyosmani-web-quality-audit` — Performance/accessibility audit

**Files:**
- `apps/web/src/app/page.tsx` — Full landing with feature showcase
- `apps/web/public/manifest.json` — PWA manifest
- `apps/web/public/icons/` — 192x192 + 512x512 icons
- `apps/web/src/app/globals.css` — Theme consistency pass

**Cron cadence:** Once per day until complete

---

## Skill Leverage Strategy

| Workstream | Primary Skill | Secondary | Purpose |
|------------|--------------|-----------|---------|
| Auth/DB | `better-auth-create-auth` | `supabase-postgres-best-practices` | Fast auth + schema |
| Solver | `repo-transmute` | `test-driven-development` | Integrate CFR engine |
| Frontend UI | `design-an-interface` | `Leonxlnx-taste-skill` | Visual polish |
| Docker | `docker-patterns` | `deployment-patterns` | Production build |
| General | `blueprint` | `subagent-driven-development` | Planning + delegation |

---

## Verification Gates

After each cron phase completes:
1. **Build gate:** `docker compose build` exits 0
2. **Test gate:** `pytest packages/poker-core/tests/` passes
3. **API gate:** `curl /health` returns 200 with correct service name
4. **Frontend gate:** `npm run build` in apps/web exits 0
5. **Integration gate:** Frontend can call all API endpoints

---

## Target: GTO Wizard Feature Parity

| Feature | GTO Wizard | Our Status | Gap |
|---------|-----------|------------|-----|
| Equity Calculator | ✅ Full | ✅ All variants | None |
| GTO Solver | ✅ CFR | ⚠️ Stub | Needs integration |
| Training / Quiz | ✅ Full | 🟡 Models + API | Needs DB + auth |
| Hand History | ✅ Import + Leaks | ✅ Parser + UI | Minor polish |
| ICM Calculator | ✅ Full | ✅ Working | None |
| Range Explorer | ✅ Matrix view | ❌ Missing | Phase C |
| Line Review | ✅ Post-solve | ❌ Missing | Phase B/C |
| Push/Fold Charts | ✅ Nash | 🟡 Partial | Phase B |
| User Accounts | ✅ Full | ❌ Missing | Phase A |
| Leaderboard | ✅ Full | 🟡 API exists | Needs auth |
| PWA | ✅ Installable | ❌ Missing | Phase E |
