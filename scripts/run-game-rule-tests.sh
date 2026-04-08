#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR/backend"

mvn -Dtest=GameRuleAutomationTest test

printf '\nGame rule test log: %s\n' "$ROOT_DIR/backend/target/game-rule-test-log.md"
