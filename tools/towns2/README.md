# Town location data (build tooling)

This directory is **not** part of the runtime app. It holds source lists, geocoded TSVs, and scripts used to regenerate the baked town list shipped in the client build.

**Output:** `npm run build-towns2-data` (runs `buildCompact.mjs`) writes `src/data/towns2.compact.json`, which Vite bundles into the static app.

## Attribution and licensing

Many of the geocoding “hits” in `coastal-geocoded/` come from **OpenStreetMap via Nominatim**.
© OpenStreetMap contributors; OpenStreetMap data is licensed under the **Open Data Commons Open
Database License (ODbL)**. See
[`openstreetmap.org/copyright`](https://www.openstreetmap.org/copyright).

**Layout:**

- `coastal/` — raw place-name lists (one file per county stem)
- `coastal-geocoded/` — lat/lon TSVs merged from geocoding passes
- `buildCompact.mjs` — aggregates geocoded TSVs into compact JSON
- `scripts/` — smoke checks and optional agent-loop helpers for extending coverage
- `prompt-colateral/` — contributor prompts for batch geocoding workflows

Normal app development (`npm run dev`, `npm test`, `npm run build`) uses the committed JSON under `src/data/` and does not require re-running this tooling unless you are adding or correcting locations.
