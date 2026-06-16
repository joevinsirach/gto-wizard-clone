# GTO Wizard Clone — Developer Makefile
# Targets for common development and ops tasks.

.PHONY: help seed-preflop

help:           ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | \
		awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

seed-preflop:   ## Seed preflop GTO strategies into PostgreSQL (idempotent)
	PYTHONPATH=apps/api .venv/bin/python apps/api/prisma/seed_preflop_strategies.py
