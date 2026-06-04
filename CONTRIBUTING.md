# Contributing to GTO Wizard Clone

## Getting Started

```bash
git clone https://github.com/ChonSong/gto-wizard-clone.git
cd gto-wizard-clone
cp .env.example .env
docker compose up
```

## Development

### Prerequisites
- Node.js 18+
- Python 3.12+
- Docker + Docker Compose
- PostgreSQL 16+ (or use Docker)
- Redis 7+ (or use Docker)

### Local Setup

```bash
# Install Node dependencies
npm install

# Install Python dependencies
uv sync

# Start infrastructure services
docker compose up -d redis postgres

# Run API (terminal 1)
cd apps/api && uvicorn main:app --reload --port 8000

# Run Web UI (terminal 2)
cd apps/web && npm run dev

# Run solver (terminal 3)
cd apps/solver && python server.py
```

### Running Tests

```bash
# All Python tests
PYTHONPATH=/tmp/gto-wizard-clone /app/venv/bin/pytest packages/poker-core/tests/ apps/solver/tests/ apps/api/tests/ -v

# Specific module
/app/venv/bin/pytest packages/poker-core/tests/test_plo4.py -v

# E2E tests (requires running app)
npx playwright test apps/web/e2e/
```

## Code Style

### Python
- Follow PEP 8
- Use type hints
- Write tests before implementation (TDD)
- Use `uv` for dependency management

### TypeScript/React
- Use functional components with hooks
- Prefer TypeScript strict mode
- Use Tailwind CSS for styling
- Follow existing component patterns

## Pull Request Process

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Write tests for your changes
4. Ensure all tests pass
5. Update documentation if needed
6. Commit with conventional commits (`feat:`, `fix:`, `docs:`, etc.)
7. Push and open a PR

## Project Structure

```
apps/web/        Next.js 15 frontend
apps/api/        FastAPI backend
apps/solver/     Python MCCFR engine (gRPC)
packages/
  poker-core/    Shared poker math
  types/         Shared TypeScript types
  ui-components/ React component library
```

## License

MIT
