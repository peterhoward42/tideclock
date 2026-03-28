#!/usr/bin/env bash
# Fast preview after diagram generation: runs `gen.mjs` and opens scenegen’s `preview.html`.
set -euo pipefail
DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$DIR"
node gen.mjs
open "${DIR}/../scenegen/generated/preview.html"
