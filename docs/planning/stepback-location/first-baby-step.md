# First baby step: county + single-prefix guided picker

## Goal

Trial a simpler and more reliable location-selection flow that keeps the curated baked dataset, reduces search fragility, and gives users clear next actions.

This first step intentionally avoids heavyweight alias inference, ranking complexity, and profile overfitting.

## Core interaction

Offer one initial screen with two controls:

- **County** (optional)
- **Place prefix** (single search term; user types start of place name)

Then use a simple result-profile bucket to decide what to show next.

## Why this is a good first experiment

- County is the only reliable grouping field currently populated in dataset.
- Prefix search is predictable and easy to explain to users.
- The app can guide the user based on count profile without complex matching logic.
- Selection is infrequent in this product, so deterministic clarity beats cleverness.

## Query semantics (v1)

1. Normalize prefix input (trim, lowercase, collapse spaces).
2. If county is selected, first filter rows by exact county match.
3. Match where normalized town `name` starts with normalized prefix.
4. Always show selectable rows when rows are shown (no preview-only lock state).

Notes:

- Keep prefix logic on canonical place name only, not the composite search line.
- Keep minimum prefix length to 2 characters before running list guidance.

## Result-profile guidance

Use deterministic buckets:

- **0 matches**
  - If county is selected: suggest trying a nearby/other county, keep typed prefix.
  - If county is not selected: suggest choosing county or extending/changing prefix.
- **1 match**
  - Offer direct confirmation: "Use `<place>`?"
- **2 to 12 matches**
  - Show selectable list immediately.
- **13 to 80 matches**
  - Ask for one more narrowing step:
    - choose county (if not already chosen), or
    - add 1 to 2 more letters to prefix.
- **more than 80 matches**
  - Strongly guide county selection first.

Thresholds are initial defaults and can be tuned after hands-on usage.

## Proposed UI copy style (draft)

- County label: "County (optional)"
- Prefix label: "Start of place name"
- Prefix placeholder: "e.g. sea"
- Empty guidance: "Choose a county or type the start of the place name."
- Narrowing guidance: "Too many matches. Choose county or type a bit more."
- No results guidance: "No matches yet. Try a different start, or change county."

## Handling duplicate names

Duplicate town names remain expected. For list display, show a qualified label:

- `<name> — <county>`
- add one more qualifier only when needed (for example local type)

Keep this rule deterministic and minimal to avoid reintroducing ambiguity logic.

## Out of scope for this baby step

- Inferred alias graphs
- Region/postcodeDistrict-based routing (fields currently blank in dataset)
- Geospatial clustering / zone generation
- Advanced ranking / fuzzy match heuristics

## Success criteria (qualitative)

- Users can reliably complete location selection with obvious next actions.
- UI states are simpler than current free-fragment flow.
- Implementation remains maintainable and easy to reason about.
