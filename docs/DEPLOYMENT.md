# GTO Wizard Clone — Deployment Guide

Complete deployment guide for GTO Wizard Clone.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Quick Start](#quick-start)
3. [Local Development](#local-development)
4. [Docker Deployment](#docker-deployment)
5. [Cloud Deployment](#cloud-deployment)
6. [Environment Variables](#environment-variables)
7. [Database Setup](#database-setup)
8. [Monitoring & Logging](#monitoring--logging)
9. [Troubleshooting](#troubleshooting)

---

## Prerequisites

- Docker 20.10+ and Docker Compose v2
- PostgreSQL 16+ (or Neon PostgreSQL for cloud)
- Redis 7+
- Node.js 18+ (for local development)
- Python 3.12+ (for solver service)

---

## Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/ChonSong/gto-wizard-clone.git
cd gto-wizard-clone
```

### 2. Start with Docker Compose

```bash
docker compose up
```

This starts all services:
- **Web UI**: http://localhost:3000
- **API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs
- **Redis**: localhost:6379
- **PostgreSQL**: localhost:5432

### 3. Access the Application

Open http://localhost:3000 in your browser.

---

## Local Development

### Prerequisites (Non-Docker)

- Node.js 18+
- Python 3.12+
- PostgreSQL 16+
- Redis 7+

### 1. Install Dependencies

```bash
# Install Node.js dependencies
npm install

# Install Python dependencies (using uv)
uv sync
```

### 2. Set Up Environment Variables

```bash
cp .env.example .env
# Edit .env with your settings
```

### 3. Start Services

```bash
# Start Redis and PostgreSQL
docker compose up redis postgres -d

# Start the API
cd apps/api && uvicorn main:app --reload --port 8000

# Start the Web UI (in another terminal)
cd apps/web && npm run dev
```

### 4. Run Migrations

```bash
cd apps/api
alembic upgrade head
```

---

## Docker Deployment

### Full Stack with Docker Compose

```bash
# Build and start all services
docker compose up -d

# View logs
docker compose logs -f

# Scale the API (if needed)
docker compose up -d --scale api=3
```

### Individual Services

```bash
# Start only PostgreSQL and Redis
docker compose up -d redis postgres

# Start only the API
docker compose up -d api

# Start only the Web UI
docker compose up -d web

# Start the solver service
docker compose up -d solver

# Start the worker (Celery)
docker compose up -d worker
```

### Docker Images

| Service | Image | Ports |
|---------|-------|-------|
| web | gto-wizard-web | 3000 |
| api | gto-wizard-api | 8000 |
| solver | gto-wizard-solver | 50051 (gRPC) |
| worker | gto-wizard-worker | - |
| postgres | postgres:16-alpine | 5432 |
| redis | redis:7-alpine | 6379 |

### Building Custom Images

```bash
# Build all images
docker compose build

# Build specific service
docker compose build api

# Build with no cache
docker compose build --no-cache
```

---

## Cloud Deployment

### Railway

1. Create a new Railway project
2. Add PostgreSQL and Redis from marketplace
3. Connect your GitHub repository
4. Set environment variables
5. Deploy

**Environment Variables for Railway:**
```
DATABASE_URL=postgresql://user:pass@host:5432/db
REDIS_URL=redis://host:6379
NODE_ENV=production
NEXT_PUBLIC_API_URL=https://your-app.railway.app
```

### Render

1. Create a new Web Service
2. Connect your GitHub repository
3. Set build command: `npm run build`
4. Set start command: `npm start`
5. Add PostgreSQL and Redis as connected services

### AWS (ECS/EKS)

```yaml
# docker-compose.yml for AWS
version: '3.8'
services:
  web:
    image: gto-wizard-clone/web:latest
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
    deploy:
      replicas: 2

  api:
    image: gto-wizard-clone/api:latest
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - REDIS_URL=${REDIS_URL}
    deploy:
      replicas: 3

  postgres:
    image: postgres:16-alpine
    volumes:
      - pgdata:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    volumes:
      - redisdata:/data
```

### Google Cloud Platform

1. Enable Cloud SQL for PostgreSQL
2. Enable Memorystore for Redis
3. Deploy using Cloud Run or GKE
4. Use Cloud Build for CI/CD

---

## Environment Variables

### Required

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host:5432/db` |
| `REDIS_URL` | Redis connection string | `redis://host:6379` |

### Optional

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `development` |
| `NEXT_PUBLIC_API_URL` | API URL for frontend | `http://localhost:8000` |
| `NEXT_PUBLIC_GRPC_URL` | gRPC URL for solver | `grpc://localhost:50051` |
| `SECRET_KEY` | Flask/FastAPI secret key | `change-me-in-production` |
| `LOG_LEVEL` | Logging level | `INFO` |
| `CELERY_BROKER_URL` | Celery broker URL | Same as REDIS_URL |
| `CELERY_RESULT_BACKEND` | Celery result backend | Same as REDIS_URL |

---

## Database Setup

### Local PostgreSQL

```bash
# Create database
createdb gto_wizard

# Create user
createuser --pwprompt gto_wizard_user

# Grant privileges
psql -c "GRANT ALL PRIVILEGES ON DATABASE gto_wizard TO gto_wizard_user;"
```

### Neon PostgreSQL (Cloud)

1. Create a Neon project
2. Get the connection string
3. Set as `DATABASE_URL` environment variable

### Run Migrations

```bash
# Apply all migrations
cd apps/api
alembic upgrade head

# Create a new migration
alembic revision --autogenerate -m "Description"

# Rollback
alembic downgrade -1
```

### Seed Data

```bash
# Seed courses and initial data
cd apps/api
python -m prisma.seed
python -m prisma.seed_course_data
```

---

## Monitoring & Logging

### Container Logs

```bash
# All services
docker compose logs -f

# Specific service
docker compose logs -f api

# Last 100 lines
docker compose logs --tail=100 web
```

### Health Checks

```bash
# API health
curl http://localhost:8000/health

# Web health
curl http://localhost:3000/api/health
```

### Metrics

| Endpoint | Description |
|----------|-------------|
| `GET /metrics` | Prometheus metrics |
| `GET /health` | Health check |
| `GET /ready` | Readiness check |

---

## Troubleshooting

### Common Issues

**1. Port Already in Use**

```bash
# Find and kill process using the port
lsof -i :3000
kill -9 <PID>
```

**2. Database Connection Failed**

```bash
# Check PostgreSQL is running
docker compose ps postgres

# Check connection
psql $DATABASE_URL -c "SELECT 1"
```

**3. Redis Connection Failed**

```bash
# Check Redis is running
docker compose ps redis

# Test Redis
redis-cli ping
```

**4. Build Failures**

```bash
# Clean Docker build cache
docker compose build --no-cache

# Remove unused images
docker image prune -f
```

**5. Migration Issues**

```bash
# Reset migrations
cd apps/api
alembic downgrade base
alembic upgrade head
```

### Debug Mode

```bash
# Enable debug logging
export LOG_LEVEL=DEBUG

# Run API with verbose output
cd apps/api
uvicorn main:app --reload --log-level debug
```

### Reset Everything

```bash
# Stop and remove all containers
docker compose down

# Remove volumes (DATA LOSS)
docker compose down -v

# Rebuild from scratch
docker compose up -d --build
```

---

## Production Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Use strong `SECRET_KEY`
- [ ] Configure `DATABASE_URL` with SSL
- [ ] Enable Redis AUTH
- [ ] Set up TLS/HTTPS
- [ ] Configure backup for PostgreSQL
- [ ] Set up monitoring/alerting
- [ ] Limit memory usage per container
- [ ] Enable rate limiting
- [ ] Configure CORS properly

---

## Scaling

### Horizontal Scaling

```bash
# Scale API to 3 replicas
docker compose up -d --scale api=3

# Scale workers to 4
docker compose up -d --scale worker=4
```

### Database Connection Pooling

Configure in `apps/api/database.py`:
```python
engine = create_engine(
    DATABASE_URL,
    pool_size=20,
    max_overflow=10,
    pool_pre_ping=True,
)
```

---

## Backup & Restore

### PostgreSQL Backup

```bash
# Backup
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql

# Restore
psql $DATABASE_URL < backup_20240101.sql
```

### Redis Backup

```bash
# Save to file
docker compose exec redis redis-cli SAVE

# Copy backup
docker compose cp redis:/data/dump.rdb ./dump.rdb
```

---

*Last updated: 2026-05-27*