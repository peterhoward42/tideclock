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
- All diagram content is mandatory across devices; this work cannot rely on content suppression to recover legibility.
- For the `ReferenceArc` feature, sizing and spacing are parametric and coupled through interpretation/spec + preset inputs.

## Planning objective

Get the diagram to look fit for purpose on `mobile + landscape` first (must-have), while preserving instrument character and full content.

## Constraint corrections (important)

The first draft assumed we could optionally reduce detail on constrained profiles and tune text size somewhat independently.  
Those assumptions are incorrect for current `ReferenceArc` generation and should be replaced with these constraints:

1. **No optional content**: all semantically defined diagram content must render on all supported devices/form factors.
2. **Parametric coupling**: text scale, spacing, and geometry are currently coupled by upstream spec interpretation and preset values.
3. **Practical implication**: increasing label legibility usually means coordinated geometry changes, not isolated typography tweaks.

## Scope of tuning (this phase)

Primary levers:

- color/contrast policy (foreground emphasis and de-emphasis)
- typography policy by semantic role (within coupled geometry constraints)
- line/stroke thickness policy
- spacing and scale factors for dense regions (via parametric inputs)

Out of scope for now:

- major geometry redesign
- replacing the existing display profile module
- introducing per-device optional-content variants

## Simplified strategy (v1)

1. **Primary target:** tune for `mobile + landscape` until it is clearly fit for purpose.
2. **Tuning approach:** use global, coupled parameter updates for `ReferenceArc` (text/spacing/geometry together).
3. **Secondary checks:** after each iteration, quickly eyeball:
   - `mobile + portrait`
   - `tablet/desktop + landscape`
4. **Decision rule:** only introduce profile-specific behavior if those checks show persistent, meaningful failures.

## Implementation direction

Because rendering is programmatic and already uses style indirection in the diagram generation pipeline, this work should be implemented as parametric policy tuning first, with explicit awareness that `ReferenceArc` typography and geometry move together.

Near-term default:

- Prefer globally consistent adjustments that preserve geometry/text harmony across all profiles.
- Optimize those global adjustments for `mobile + landscape` first.
- Treat other profiles as regression checks during iteration, not co-equal optimization targets.

Longer-term option (viable but costly):

- Introduce device/form-factor awareness earlier in the generation pipeline so geometry decisions can branch intentionally by profile.
- Treat this as a separate investment due to complexity, implementation time, and regression surface.

## V1 profile matrix (draft)

Use this as an orientation table while tuning for `mobile + landscape` first.

| Policy area | `mobile + portrait` | `mobile + landscape` | `tablet/desktop + landscape` |
| --- | --- | --- | --- |
| Text size (base) | Prefer shared/global scale changes; profile-only increase only if geometry remains coherent | Prefer shared/global scale changes; minor profile adjustment only if proven safe | Baseline reference for global tuning |
| Text weight/contrast | Use stronger contrast for key labels; keep secondary labels subdued | Similar to portrait but with slightly more secondary detail retained | Full detail range with current hierarchy |
| Stroke thickness | Increase fine strokes (roughly +12-20%) to prevent visual drop-out | Small increase (roughly +6-10%) | Keep baseline |
| Dense-region spacing | Increase via coupled parametric geometry controls (no content removal) | Minor coupled spacing increases where collisions occur | Keep as baseline unless global retune changes all profiles |
| Detail density/content | Keep full content; rely on hierarchy and geometry tuning only | Keep full content; rely on hierarchy and geometry tuning only | Keep full content |
| Motion prominence (1 Hz cues) | Keep visible but avoid dominating small text and markers | Keep visible; tune to avoid crowding | Keep baseline |

Notes:

- Percentages are starting points for first pass tuning, not final targets.
- Keep semantic hierarchy stable across profiles; only adjust intensity/scale.
- Do not trade legibility gains for content suppression; all semantics must remain present.
- For `ReferenceArc`, treat text/spacing/geometry as a coupled system during tuning.
- Prefer global harmonized parameter updates first; add profile-aware branching only with clear evidence from manual review.

## V1 validation checklist

Run this checklist during each tuning cycle:

- `mobile + landscape` is the pass/fail gate: core labels are readable at normal phone viewing distance.
- Primary time-now cues remain obvious during live 1 Hz updates.
- No meaningful overlaps or collisions in dense diagram regions.
- Visual hierarchy still feels instrument-like (not flattened into uniform emphasis).
- Quick manual regression check on `mobile + portrait` and `tablet/desktop + landscape`.

Testing note:

- During this iteration phase, rely on manual visual review rather than automated visual regression tests.
- Add regression automation later, after tuning direction stabilizes.

## Suggested implementation order (highest impact first)

1. Tune coupled `ReferenceArc` parameters for `mobile + landscape` until visually acceptable.
2. Refine contrast/stroke hierarchy to improve small-screen readability without content removal.
3. Perform quick manual checks on `mobile + portrait` and `tablet/desktop + landscape` each cycle.
4. If repeated failures remain on non-primary profiles, scope a separate device-aware geometry branching effort.