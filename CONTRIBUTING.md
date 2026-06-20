# Contributing to GTO Wizard Clone

## Getting Started (sans Docker)

### Prérequis

- **Node.js** 18+
- **Python** 3.12+
- **uv** ou **Python 3.12+** avec venv
- **PostgreSQL** 16+ installé localement
- **Redis** — optionnel (fakeredis utilisé si `REDIS_URL` est vide)

### Installation

```bash
git clone https://github.com/ChonSong/gto-wizard-clone.git
cd gto-wizard-clone
cp .env.example .env
# Éditez .env : PGUSER, PGPASSWORD, DATABASE_URL

make install       # npm + uv + poker-core
make setup-db      # crée la base gto_wizard (isolée de vos autres projets)
make seed-all      # peuple les stratégies GTO
make dev           # démarre API (:8000) + frontend (:3000)
```

Ouvrir **http://localhost:3000** — l'API est sur **http://localhost:8000**.

### Terminaux séparés (alternative)

```bash
# Terminal 1 — API
make api

# Terminal 2 — Frontend
make web
```

### Solver gRPC (optionnel)

Pour le solving live postflop :

```bash
cd apps/solver && uv run python server.py
```

## Development

### Running Tests

```bash
# Tests Python
uv run pytest packages/poker-core/tests/ apps/api/tests/ -v

# E2E Playwright (API + web doivent tourner)
cd apps/web && npx playwright test
```

## Code Style

### Python
- Follow PEP 8
- Use type hints
- Use `uv` for dependency management

### TypeScript/React
- Functional components with hooks
- Tailwind CSS for styling

## Pull Request Process

1. Fork the repository
2. Create a feature branch
3. Write tests for your changes
4. Commit with conventional commits (`feat:`, `fix:`, `docs:`, etc.)
5. Push and open a PR

## Docker (optionnel)

Des fichiers `docker-compose.yml` existent pour ceux qui préfèrent les conteneurs, mais ne sont **pas requis** pour le développement local.
