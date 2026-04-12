#!/usr/bin/env bash
# Run coastal batch smoke checks (structure + light format heuristics).
# Same repo-root discovery as run-coastal-agent-loop.sh.

set -euo pipefail

REPO_ROOT="${TIDECLOCK_REPO_ROOT:-}"
if [[ -z "$REPO_ROOT" ]]; then
  REPO_ROOT="$(git -C "$(dirname "${BASH_SOURCE[0]}")/../../.." rev-parse --show-toplevel 2>/dev/null || true)"
fi
if [[ -z "$REPO_ROOT" || ! -d "$REPO_ROOT" ]]; then
  echo "smoke-check-coastal-data: set TIDECLOCK_REPO_ROOT to the repository root, or run from inside the git work tree." >&2
  exit 1
fi

exec python3 "$REPO_ROOT/tools/towns2/scripts/smoke-check-coastal-data.py" --repo-root "$REPO_ROOT" "$@"
