#!/usr/bin/env bash
# Coastal batch: loop until queue_exhausted is true in coastal_queue_state.yaml, or stop on
# first non-zero exit from the Cursor agent command. Run from repo root or set TIDECLOCK_REPO_ROOT.
# Do not run unattended without reviewing Cursor headless docs and auth (e.g. CURSOR_API_KEY).

set -euo pipefail

REPO_ROOT="${TIDECLOCK_REPO_ROOT:-}"
if [[ -z "$REPO_ROOT" ]]; then
  REPO_ROOT="$(git -C "$(dirname "${BASH_SOURCE[0]}")/../../.." rev-parse --show-toplevel 2>/dev/null || true)"
fi
if [[ -z "$REPO_ROOT" || ! -d "$REPO_ROOT" ]]; then
  echo "run-coastal-agent-loop: set TIDECLOCK_REPO_ROOT to the repository root, or run from inside the git work tree." >&2
  exit 1
fi

STATE_FILE="$REPO_ROOT/tools/towns2/state/coastal_queue_state.yaml"
UNIVERSAL_REL="tools/towns2/prompt-colateral/coastal_universal_prompt.md"

if [[ ! -f "$STATE_FILE" ]]; then
  echo "run-coastal-agent-loop: missing state file: $STATE_FILE" >&2
  exit 1
fi

# Top-level queue_exhausted: true|false (see coastal_batch_automation_spec.md).
queue_exhausted() {
  local line val
  line="$(grep -E '^queue_exhausted:' "$STATE_FILE" 2>/dev/null | head -n 1 || true)"
  [[ -n "$line" ]] || return 1
  val="${line#queue_exhausted:}"
  val="$(printf '%s' "$val" | sed 's/^[[:space:]]*//;s/#.*//;s/[[:space:]]*$//')"
  [[ "$val" == "true" ]]
}

# Short CLI text avoids shell-quoting the full universal prompt; the agent reads the markdown file.
SHORT_PROMPT="$(cat <<'EOF'
Follow tools/towns2/prompt-colateral/coastal_universal_prompt.md exactly. Repository root is the current working directory; use paths relative to it. Perform exactly one headless iteration: either process one next county (per that file) or, if there is no next county, set queue_exhausted in tools/towns2/state/coastal_queue_state.yaml and make no spurious edits.
EOF
)"

cd "$REPO_ROOT"

if [[ ! -f "$REPO_ROOT/$UNIVERSAL_REL" ]]; then
  echo "run-coastal-agent-loop: missing $REPO_ROOT/$UNIVERSAL_REL" >&2
  exit 1
fi

while true; do
  if queue_exhausted; then
    echo "run-coastal-agent-loop: queue exhausted (queue_exhausted: true in coastal_queue_state.yaml). Exit 0."
    exit 0
  fi

  if [[ -n "${COASTAL_AGENT_CMD:-}" ]]; then
    # Word-split on IFS; use default branch if you need spaces inside a single argument.
    # shellcheck disable=SC2086
    $COASTAL_AGENT_CMD -- "$SHORT_PROMPT" || exit $?
  elif command -v cursor >/dev/null 2>&1; then
    # Editor-installed CLI: Shell Command "Install 'cursor' command in PATH".
    cursor agent -p --force -- "$SHORT_PROMPT" || exit $?
  elif command -v agent >/dev/null 2>&1; then
    # Standalone agent binary (e.g. ~/.local/bin/agent from Cursor CLI install).
    agent -p --force -- "$SHORT_PROMPT" || exit $?
  else
    echo "run-coastal-agent-loop: neither 'cursor' nor 'agent' on PATH. Install Cursor CLI, add the shell command from the app, or set COASTAL_AGENT_CMD." >&2
    exit 127
  fi
done
