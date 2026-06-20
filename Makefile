# GTO Wizard Clone — Developer Makefile
# Développement 100 % local (sans Docker).

.PHONY: help install setup-db seed-preflop seed-all dev api web health-check

help:           ## Afficher l'aide
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | \
		awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

install:        ## Installer les dépendances Node + Python
	npm install
	bash scripts/install-python.sh

setup-db:       ## Créer la base gto_wizard sur PostgreSQL local
	bash scripts/setup-local-postgres.sh

seed-preflop:   ## Peupler les stratégies preflop (idempotent)
	PYTHONPATH=apps/api bash -c '\
		if command -v uv >/dev/null 2>&1; then uv run python apps/api/prisma/seed_preflop_strategies.py; \
		else .venv/bin/python apps/api/prisma/seed_preflop_strategies.py; fi'

seed-all:       ## Peupler toutes les stratégies preflop + flop (idempotent)
	PYTHONPATH=apps/api bash -c '\
		if command -v uv >/dev/null 2>&1; then uv run python apps/api/prisma/seed_all_strategies.py; \
		else .venv/bin/python apps/api/prisma/seed_all_strategies.py; fi'

dev:            ## Démarrer API + frontend (sans Docker)
	bash scripts/dev-local.sh

api:            ## Démarrer l'API seulement
	bash scripts/dev-local.sh api

web:            ## Démarrer le frontend seulement
	bash scripts/dev-local.sh web

health-check:   ## Vérifier que l'API et le frontend répondent
	bash scripts/deploy-health-check.sh
