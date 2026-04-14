# Location picker UX (towns2)

## Context

- Read **`docs/specs/elevator-pitch.md`** for product framing.
- **Current implementation:** **`src/ui/routes/LocationTowns2.svelte`** — location search and selection. Data comes from **`src/data/bakedTowns2.ts`** (built from the towns2 pipeline; see **`tools/towns2/pipeline-source-of-truth.md`**).
- **Routing:** the app uses route id **`location2`** (hash **`#/location2`**). **`#/location`** may still normalize to the same screen for bookmark compatibility — see **`src/infrastructure/router.js`**.

## Dataset and search

- Curated coastal place lists and geocoded TSVs live under **`tools/towns2/coastal/`** and **`tools/towns2/coastal-geocoded/`**. Example row shape: **`tools/towns2/coastal-geocoded/cheshire.tsv`** (with sibling files covering the full corpus).
- **Fragment search** (e.g. typing several space-separated pieces of the place name) is implemented via **`src/location-services`** and wired from the location route.

## Future / follow-ups

- If the type-ahead list feels heavy on first keystrokes, **`src/location-services`** may need performance tuning — measure with real device profiles before changing algorithms.

## Original design brief (historical)

This file began as a pre-implementation UX design note. The cases below still describe the intended behaviour for early vs late typing; compare with the live **`LocationTowns2`** UI when iterating.

- In the early stages of typing there may be many matches — the UI should make it obvious how to add fragments to narrow results.
- The user will often end up with a small set of matches that are all reasonable; multiple similar names reinforce that several real places exist in the area.
