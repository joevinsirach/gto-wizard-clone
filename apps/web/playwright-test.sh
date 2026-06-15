#!/usr/bin/env bash
# Wrapper script: runs playwright test from the e2e subdirectory
# to avoid npm workspace hoisting conflicts with Next.js.
DIR="$(cd "$(dirname "$0")" && pwd)"
exec "$DIR/e2e/node_modules/.bin/playwright" test --config="$DIR/e2e/playwright.config.ts" "$@"
