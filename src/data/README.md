# Location data (`src/data/`)

Baked coastal place corpus and step-back picker query. No persistence, no proxy calls.

| Module | Role |
|--------|------|
| `townSchema.ts` | `Town` shape and compact JSON hydration. |
| `towns2.compact.json` | Generated corpus (`node tools/towns2/buildCompact.mjs`). |
| `bakedTowns2.ts` | In-memory towns, county list, prefix query, default location (Looe, Cornwall). |
| `townPickerDisplay.ts` | Step-back labels and display normalisation for the location route. |

## Attribution and licensing

The generated corpus (`towns2.compact.json`) is compiled from curated sources and geocoding passes,
including OpenStreetMap via Nominatim for many entries. © OpenStreetMap contributors; OpenStreetMap
data is licensed under the Open Data Commons Open Database License (ODbL). See
[`openstreetmap.org/copyright`](https://www.openstreetmap.org/copyright).

## Persistence boundary

Selected town read/write: `data-pipelines/townPick.ts` + `townPickSerde.ts` (`current-location` in `localStorage`). The shell (`ui/App.svelte`) is the single orchestrator for `setCurrentLocation` → store → tide reload.

## UI

`ui/routes/LocationRoute.svelte` — county + prefix step-back chooser. Routing and landscape gate are documented in the UI slice.

Contributor tooling for extending the corpus: [`tools/towns2/README.md`](../../tools/towns2/README.md).
