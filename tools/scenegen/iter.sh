#!/usr/bin/env bash
# Fast preview for scenegen: regenerates scene + HTML preview and opens it. See `gen.mjs`.
set -euo pipefail
DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$DIR"
node gen.mjs
open "${DIR}/generated/preview.html"
