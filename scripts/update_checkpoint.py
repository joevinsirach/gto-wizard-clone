#!/usr/bin/env python3
"""Update checkpoint files after a successful run."""

import json
import subprocess

# Update project checkpoint
with open("/home/sc/repos/gto-wizard-clone/.checkpoint.json", "r") as f:
    cp = json.load(f)

# Add completed items that were missing from previous checkpoint updates
new_completed = [
    "fix-omaha-api-url",
    "fix-bomb-pot-api-url",
    "fix-double-board-api-url",
    "fix-strategies-api-url-prefix",
    "fix-strategy-route-order",
    "add-strategies-page-e2e-test",
    "add-deploy-health-monitoring",
    "start-solver-docker-service",
    "add-e2e-tests-for-new-pages",
    "fix-strategy-key-bet-size-parsing",
    "seed-all-stack-depths",
    "seed-flop-strategies",
    "add-missing-stack-depth-to-frontend-position-buttons",
    "seed-flop-strategies-all-depths",
    "fix-postflop-street-progression",
    "seed-flop-boards-expanded",
    "study-page-postflop-e2e-test",
    "study-page-console-error-audit",
    "auto-seed-strategy-on-db-restart",
]

for item in new_completed:
    if item not in cp["completed"]:
        cp["completed"].append(item)

cp["current"] = "start-solver-docker-service"
cp["next"] = "visual-study-preflop-match-reference"
cp["health"] = "solver_running_study_200"
cp["blocker"] = None

sha = subprocess.check_output(["git", "rev-parse", "HEAD"]).decode().strip()
cp["last_sha"] = sha

with open("/home/sc/repos/gto-wizard-clone/.checkpoint.json", "w") as f:
    json.dump(cp, f, indent=2)

print("Project checkpoint updated")
print(f"Completed: {len(cp['completed'])} items")
print(f"Current: {cp['current']}")
print(f"Next: {cp['next']}")
