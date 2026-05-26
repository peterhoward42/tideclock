# Town location data (build tooling)

This directory is **not** part of the runtime app. It holds source lists, geocoded TSVs, and scripts used to regenerate the baked town list shipped in the client build.

**Output:** `npm run build-towns2-data` (runs `buildCompact.mjs`) writes `src/data/towns2.compact.json`, which Vite bundles into the static app.

**Layout:**

- `coastal/` — raw place-name lists (one file per county stem)
- `coastal-geocoded/` — lat/lon TSVs merged from geocoding passes
- `buildCompact.mjs` — aggregates geocoded TSVs into compact JSON
- `scripts/` — smoke checks and optional agent-loop helpers for extending coverage
- `prompt-colateral/` — contributor prompts for batch geocoding workflows

Normal app development (`npm run dev`, `npm test`, `npm run build`) uses the committed JSON under `src/data/` and does not require re-running this tooling unless you are adding or correcting locations.
