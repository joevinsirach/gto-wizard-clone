#!/bin/bash
# GTO Wizard Clone — auto-deploy script
# Called by systemd timer to pull latest, build, test, and restart

set -e
REPO="/home/sc/repos/gto-wizard-clone"
LOG="/home/sc/.hermes/logs/gto-wizard-deploy.log"

echo "[$(date)] Checking for updates..." >> "$LOG"

cd "$REPO"

# Fetch latest
git fetch origin main 2>&1 >> "$LOG"

# Check if we're behind
HEAD_HASH=$(git rev-parse HEAD)
REMOTE_HASH=$(git rev-parse origin/main)

if [ "$HEAD_HASH" = "$REMOTE_HASH" ]; then
    echo "[$(date)] Already up to date." >> "$LOG"
    exit 0
fi

echo "[$(date)] New commit detected: $REMOTE_HASH" >> "$LOG"

# Pull, install, build
git pull origin main 2>&1 >> "$LOG"
npm install 2>&1 >> "$LOG"
npm run build 2>&1 >> "$LOG"

# Run E2E tests
PLAYWRIGHT_BROWSERS_PATH=/tmp/pw-browsers npx playwright test --config=apps/web/playwright.config.ts 2>&1 >> "$LOG" || {
    echo "[$(date)] ⚠ E2E tests failed, rolling back..." >> "$LOG"
    git reset --hard "$HEAD_HASH" 2>&1 >> "$LOG"
    exit 1
}

# Restart services
systemctl --user restart gto-wizard-web.service 2>&1 >> "$LOG"

echo "[$(date)] ✅ Deploy complete: $(git rev-parse --short HEAD)" >> "$LOG"
