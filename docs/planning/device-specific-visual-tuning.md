# Device-specific visual tuning

## Why this matters

The aspirational use case is an ambient, instrument-like display (for example wall-mounted), while the most common first encounter is likely a phone.  
Read the broader product framing in `docs/specs/elevator-pitch.md`.

The home screen's core job is to render a live, instrument-style diagram on a black background. Its visual language uses fine lines, arcs, and labels, and is denser than a normal clock face. That means legibility and "apparent boldness" are in direct tension with information density, especially on small screens.

Current visual baseline: `docs/images/example-snapshot.png`.

## Existing foundation in code

Device awareness already exists and should be treated as the source of truth:

- `src/ui/displayOptimisation.ts` derives `deviceClass` (`mobile`/`tablet`/`desktop`) from viewport width.
- The same module derives `aspectClass` (`portrait`/`square`/`landscape`) and `aspectRatio`.
- It exposes a live `displayOptimisation` store, updated on resize/orientation changes.
- This behavior is already covered with focused tests in `src/ui/displayOptimisation.test.ts`.

So this planning step is not about introducing new device-detection logic. It is about defining how visual style should respond to the already-available display profile.

## Display characteristics that constrain tuning

- The display updates continuously, including 1 Hz motion cues that communicate "alive" and "time-now".
- The diagram's geometry naturally favors landscape composition.
- On mobile portrait, space is constrained and fine details can become visually fragile.

## Planning objective

Define a style policy that improves readability and perceived quality across device/aspect contexts while preserving the instrument character of the diagram.

## Scope of tuning (this phase)

Primary levers:

- color/contrast policy (foreground emphasis and de-emphasis)
- font sizing and weight by semantic role
- line/stroke thickness policy
- spacing and scale factors for dense regions

Out of scope for now:

- major geometry redesign
- replacing the existing display profile module

## Proposed planning outputs

1. A compact matrix of style tokens/policies keyed by display profile (`deviceClass` + `aspectClass`).
2. A first-pass default profile set:
   - `mobile + portrait`
   - `mobile + landscape`
   - `tablet/desktop + landscape` (baseline ambient/instrument target)
3. A short validation checklist for each profile (quick manual visual QA + snapshot comparison).
4. A prioritized implementation order (highest legibility impact first).

## Implementation direction

Because rendering is programmatic and already uses style indirection in the diagram generation pipeline, this work should be implemented mainly as style-policy refinement and profile-aware style bindings, not a rewrite of the rendering architecture.

## V1 profile matrix (draft)

Use this as the initial policy table for style bindings keyed by `deviceClass` + `aspectClass`.

| Policy area | `mobile + portrait` | `mobile + landscape` | `tablet/desktop + landscape` |
| --- | --- | --- | --- |
| Text size (base) | Increase from current baseline (roughly +10-15%) | Slight increase (roughly +5-8%) | Keep baseline |
| Text weight/contrast | Use stronger contrast for key labels; keep secondary labels subdued | Similar to portrait but with slightly more secondary detail retained | Full detail range with current hierarchy |
| Stroke thickness | Increase fine strokes (roughly +12-20%) to prevent visual drop-out | Small increase (roughly +6-10%) | Keep baseline |
| Dense-region spacing | Slightly increase spacing and/or reduce low-priority annotations | Minor spacing increase only where collisions occur | Keep baseline geometry and spacing |
| Detail density | Suppress or de-emphasize least important decorative detail first | Keep most detail; suppress only if overlap appears | Preserve full instrument detail |
| Motion prominence (1 Hz cues) | Keep visible but avoid dominating small text and markers | Keep visible; tune to avoid crowding | Keep baseline |

Notes:

- Percentages are starting points for first pass tuning, not final targets.
- Keep semantic hierarchy stable across profiles; only adjust intensity/scale.
- Prefer profile-level token changes over one-off element overrides.

## V1 validation checklist

Run this checklist for each profile after tuning:

- Core labels are readable at normal viewing distance for that context.
- Primary time-now cues remain obvious during live 1 Hz updates.
- No meaningful overlaps or collisions in dense diagram regions.
- Visual hierarchy still feels instrument-like (not flattened into uniform emphasis).
- Snapshot diffs show intended changes without accidental regressions in unrelated elements.

## Suggested implementation order (highest impact first)

1. Typography scale and contrast hierarchy by profile.
2. Stroke-thickness adjustments for fine lines/arcs.
3. Dense-region spacing and selective detail suppression.
4. Final pass on motion cue prominence after static readability is stable.