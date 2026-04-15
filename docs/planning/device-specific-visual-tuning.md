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