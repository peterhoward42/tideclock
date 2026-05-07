# Step-back: location choice UX with baked coastal dataset

## Why this note exists

The current free-text matching flow is powerful but operationally fragile.  
This document proposes simpler interaction models that still use the curated baked-in towns dataset as source of truth, while better matching the real use case:

- location selection is infrequent (often one-time setup)
- users want confidence and clarity more than speed
- spatial precision can be approximate (roughly within 3 miles is fine)

## Data we can lean on right now

From `townSchema.ts`, each town already carries enough structure for guided selection:

- identity: `id`, `name`
- position: `lat`, `lon`
- grouping hints: `county`, `region`, `country`, `postcodeDistrict`
- settlement metadata: `localType`

This means we can pivot away from fragile text-first disambiguation and toward stable grouped browsing, with optional lightweight search.

## Candidate interaction patterns

### Option A — County-first drilldown (predictable, low-risk)

Flow:

1. pick county
2. pick place within county
3. confirm and save

Why it fits:

- simple mental model for most UK users
- almost zero algorithmic complexity
- robust to alias/search brittleness

Tradeoffs:

- weaker for tourists who do not know county
- counties are not equally meaningful in all areas

Implementation shape:

- precompute `county -> towns[]` at build/load time
- sort counties by number of coastal places or alphabetically
- town label can include small context suffix when needed (for duplicates)

---

### Option B — Region -> county -> place (best for unfamiliar users)

Flow:

1. pick broad region (e.g. South West / Scotland / Wales / NI / etc.)
2. optional county step
3. pick place

Why it fits:

- better onboarding for visitors unfamiliar with county names
- keeps each list shorter and calmer

Tradeoffs:

- one extra click for users who already know county
- region naming must feel intuitive

Implementation shape:

- use `region` directly from data
- optionally show "popular in this region" as quick picks
- keep county optional when region list is already small

---

### Option C — Nearby coastal zones (spatial buckets, not admin areas)

Flow:

1. pick a coarse coastal zone (or map-like zone card)
2. pick place from that zone

Why it fits:

- aligns with "near enough" accuracy requirement
- avoids dependence on administrative geography knowledge
- can simplify duplicate names by spatial grouping

Tradeoffs:

- requires generating zone metadata from lat/lon
- needs careful naming so zones are understandable

Implementation shape:

- cluster towns offline by lat/lon into stable buckets
- each bucket gets a human label (e.g. "North Devon coast")
- output includes `zoneId` per town in baked data

Notes:

- this can be done without exact geodesic precision; stable practical grouping is enough

---

### Option D — Hybrid picker: guided browsing + forgiving quick search

Flow:

- default UI is grouped browsing (county/region/zone)
- optional search box narrows only within current group or across all as fallback

Why it fits:

- combines reliability of drilldown with speed for confident typers
- removes pressure on search to solve all disambiguation

Tradeoffs:

- slightly more UI complexity than pure drilldown
- requires clear UX wording for "search in this list" vs global search

Implementation shape:

- simplify search to plain substring token matching over a compact alias line
- always allow selection from visible results (no "sample-only locked list")
- when ambiguous, show extra context in row label (county/region)

## Recommendation (order to explore)

1. **Start with Option D using county-first grouping as the backbone.**  
   This delivers immediate stability with minimal data-pipeline changes.
2. **Add region entry points** if county-only feels awkward in user testing.
3. **Evaluate zone clustering later** if we want less admin-geography dependence.

This path keeps the curated dataset intact and removes the need for brittle high-cleverness search logic.

## Practical simplifications to adopt regardless of option

- make selection always possible from shown rows (avoid interaction dead-ends)
- treat aliases as recognition aids, not ranking magic
- design for calm setup: fewer states, clearer labels, obvious next step
- optimise for maintainability over theoretical perfect match quality

## Open questions for next pass

- Should "county" include a friendlier label set in the UI (display name vs canonical value)?
- Do we want a tiny "recently chosen / popular" section for speed?
- Is first-run geolocation worth using only to suggest a starting group, not auto-select?
- Which duplicate-name contexts are most confusing today, and what minimal suffix solves them?
