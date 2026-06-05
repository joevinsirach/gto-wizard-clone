#!/bin/bash
# GTO Wizard Clone — Production Start Script
# Starts both API and Frontend
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PID_FILE="/tmp/gto-wizard.pid"

echo "Starting GTO Wizard Clone..."

# Kill existing if present
if [ -f "$PID_FILE" ]; then
    kill $(cat "$PID_FILE") 2>/dev/null || true
    rm -f "$PID_FILE"
fi

# 1. Start API backend
echo "Starting API on :8000..."
cd "$SCRIPT_DIR"
PYTHONPATH="$SCRIPT_DIR/apps/api:$SCRIPT_DIR" \
    /app/venv/bin/uvicorn apps.api.main:app \
    --host 0.0.0.0 --port 8000 \
    --log-level info &
API_PID=$!
echo $API_PID >> "$PID_FILE"

# Wait for API
sleep 2
for i in $(seq 1 10); do
    if curl -sf http://localhost:8000/api/v1/health > /dev/null 2>&1; then
        echo "API ready!"
        break
    fi
    sleep 1
done

# 2. Start Frontend
echo "Starting Frontend on :3002..."
cd "$SCRIPT_DIR/apps/web"
NODE_PATH="$SCRIPT_DIR/node_modules" \
    /home/hermeswebui/.hermes/home/.local/bin/node \
    "$SCRIPT_DIR/node_modules/next/dist/bin/next" start -p 3002 &
WEB_PID=$!
echo $WEB_PID >> "$PID_FILE"

sleep 3
echo "Frontend ready at http://localhost:3002"
echo "API ready at http://localhost:8000"
echo "API docs at http://localhost:8000/docs"
echo ""
echo "PIDs: $(cat $PID_FILE | tr '\n' ' ')"
