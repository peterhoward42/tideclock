# Home route: strategies for narrative-shaped `Home.svelte`

## Purpose

Recommend **concrete refactor strategies** that move `src/ui/routes/Home.svelte` toward the mission in [`home-route-narrative-shape.md`](./home-route-narrative-shape.md), and define a **reliable order** in which to apply them across multiple sessions.

**Companion:** session-by-session execution and notes live in [`home-route-narrative-shape-progress.md`](./home-route-narrative-shape-progress.md). Update that file when work lands so the next session starts from an honest checkpoint.

## Ordering principle

Prefer changes that:

1. **Reduce cognitive load early** with **low behavioural risk** (pure logic, colocated tests, few call sites).
2. **Avoid fighting Svelte’s reactivity model** until the file’s “outline” is clearer (runes, `$effect`, bindings are easier to move safely once boundaries are obvious).
3. **Keep the route file as the orchestration hub** until late phases; do not hide the wiring story in a premature “god module” elsewhere.

The phases below follow that order.

---

## Phase 1 — Extract **pure** and **policy** logic to TypeScript modules

**What:** Move functions and constants that do not need Svelte runes or DOM nodes into `.ts` files (colocated under `src/ui/` or `src/application/` depending on whether the logic is UI-policy or domain/diagram). Prefer **one seam per module** with **unit tests** where behaviour is easy to get wrong.

**Why first:** No component boundary, minimal prop-drilling risk, diffs stay reviewable, CI gives fast feedback. This already matches patterns in the repo (for example `src/ui/homeLandscapeHint.ts`).

**Examples of good Phase-1 candidates (illustrative, not exhaustive):**

- URL / query parsing and normalisation used only for dev previews or debug flags.
- Pure formatters or “banner line” builders already delegating to application code—ensure **call sites** in `Home.svelte` shrink to a single named import each.
- Predicates and thresholds that are stable enough to test without mounting Svelte.

**Verification:** Existing tests plus new unit tests for extracted modules; no intentional UI change.

**Risk if skipped:** Later component splits duplicate the same predicates in props and children.

---

## Phase 2 — **Script** narrative: group, name, and trim the top of the file

**What:** Inside `Home.svelte`, reorder and lightly group the `<script>` so it reads as **inputs → collaborators → derived state → effects → handlers**, with **short file-level or section-level orientation** only where it helps skim-reading (avoid narrating what the code already says).

**Why second:** Zero runtime change when done carefully; clarifies **what to extract next** and which `$effect` blocks belong together.

**Verification:** Manual skim + existing tests; optional screenshot pass if reorder touched initialisation order (it should not).

---

## Phase 3 — **Presentational** child components (thin templates, explicit props)

**What:** Split the template into **named regions** implemented as child `.svelte` components: dev-only banners, loading / error shells, diagram stage chrome, menus, footer nav—whatever matches **visual** and **product** seams in the current markup.

**Why third:** Large line-count wins with a **clear contract** (props in, events out). Keeps orchestration in `Home.svelte` while the tree becomes readable.

**Guidelines:**

- Children should be **mostly markup + small local state**; avoid re-embedding the full diagram pipeline in a child unless that child is explicitly “the diagram region” and the parent only passes inputs and callbacks.
- Prefer **explicit props** over deep context unless the repo already standardises otherwise.

**Verification:** Component tests if the repo already uses them for UI; otherwise manual smoke and existing integration/e2e if present.

**Risk:** Prop drilling. Mitigate by grouping props into small readonly types or a single “stage model” object **only** when repetition becomes noisy—not preemptively.

---

## Phase 4 — **Orchestration-heavy** regions: effects and collaborators behind seams

**What:** Where a region combines **subscriptions**, **DOM refs**, and **collaborator calls** (for example minute cadence, SVG inject/patch, measurement for layout hints), consider:

- A small **TypeScript factory** or class that owns imperative logic, called from `$effect` / `onMount` in one place, **or**
- A dedicated child component that **owns** the DOM subtree and local state, with the parent passing only serialisable inputs.

**Why later:** Highest chance of subtle regressions if moved carelessly; easier once Phases 1–3 have reduced file size and clarified boundaries.

**Verification:** Targeted manual testing of time rollover, resize, dev preview toggles, and any behaviour tied to `bind:this` or layout measurement. Add tests where the collaborator surface is stable enough.

---

## Phase 5 — Optional **thin route shell** (only if the hub is still too large)

**What:** If `Home.svelte` remains long **after** Phases 1–4, introduce a thin shell that **only** composes children and wires stores/props—moving the remaining script into `homeRouteState.ts` / `useHomeDiagram.ts`-style modules **only** where it improves reading without scattering orchestration.

**Why last:** Easy to create a second “kitchen sink” file; do this only when the **story** of the shell is obvious from Phases 2–3.

**Verification:** Same as Phase 4; insist on a **single obvious entry** still named or routed as `Home.svelte` for grep and onboarding.

---

## Cross-cutting practices (every phase)

- **Small PRs / commits:** one seam or one child per session when possible.
- **No drive-by renames** unrelated to the extraction.
- **Update** [`home-route-narrative-shape-progress.md`](./home-route-narrative-shape-progress.md) after each mergeable chunk.
- When behaviour must change, **link** the product spec or planning doc for that change explicitly so narrative refactors stay honest.

## Non-strategies (deprioritise)

- “Split every 200 lines” without a seam name.
- Moving Svelte-specific runes into `.ts` files in ways that fight the compiler (prefer keeping runes at the component that owns the reactive graph unless the repo has an established pattern).
- Introducing global stores solely to avoid props unless the data truly is app-wide.
