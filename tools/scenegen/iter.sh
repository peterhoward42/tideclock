#!/usr/bin/env bash
set -euo pipefail
DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$DIR"
node gen.mjs
open "${DIR}/generated/preview.html"
