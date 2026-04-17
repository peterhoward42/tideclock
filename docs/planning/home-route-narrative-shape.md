# Home route: narrative shape of `Home.svelte`

## Purpose

Persist **mission and rationale** for how the primary home route module (`src/ui/routes/Home.svelte`) should read to a **skimming** code reader. This document is the **reference intent** for incremental refactors across multiple sessions: when we split, extract, or rename, we do so in service of this shape—not ad hoc line-count shaving.

Related product and layout direction for the same route lives elsewhere (for example `docs/planning/landscape-nudge.md`, `docs/planning/home-landscape-header-space.md`). This doc is **only** about **code narrative and orchestration clarity**.

**Companion documents:** phased tactics and ordering — [`home-route-narrative-shape-strategies.md`](./home-route-narrative-shape-strategies.md); session checklist and log — [`home-route-narrative-shape-progress.md`](./home-route-narrative-shape-progress.md).

## Mission

`Home.svelte` should **tell the story** of the home screen at the level of **composition and app-level orchestration**: what major conceptual pieces exist, how they are wired together, and what big-picture initialisation or branching the route owns.

A reader who spends **a short time** in the file should leave with a **mental map**. Everything that is **detail**—deep markup, specialised handlers, policy-heavy predicates, layout micro-structure—should be **reachable by choice** in other modules or child components, not mandatory reading to understand the strands the route is juggling.

## Rationale

- **Skim-first reading:** Large `.svelte` files interleave imports, derived state, subscriptions, lifecycle, a wide template, and local handlers. When all of that stays in one scroll, the **architecture story** is easy to lose; the file stops answering “what is this responsible for?” before the reader has finished the first pass.
- **Progressive disclosure:** Treat the route module like an **outline**: names and boundaries first, implementation depth on demand. That matches how maintainers actually work: orient, then drill.
- **Sustained refactors:** Without a written mission, multi-session extractions tend to **drift** (extract for size only, duplicate orchestration, or scatter related logic). This doc gives a **stable bar** for “good enough” and for tradeoffs when locality and narrative conflict.

## What “good” looks like (qualitative)

- The **`<script>`** section reads as a **table of contents**: key inputs, stores or services used, named regions of behaviour (possibly grouped with light comments only where they aid orientation), and clear hand-off to helpers or child components—**not** every policy inlined at top level.
- The **template** presents **major regions** through named components or small, obviously named blocks; deep structure lives in children or focused partials rather than a single long tree.
- **Orchestration** (who runs when, what gates what) remains **discoverable** at the route; **mechanics** (how a band is measured, how copy is chosen, how a diagram slot is computed) live **next to** tests or UI modules where a specialist reader expects them.

Exact line counts are not the goal; **narrative density** is. A shorter file that obscures orchestration would still miss the mission.

## Principles and guardrails

1. **Preserve honest behaviour** when restructuring: refactors in service of this doc are **readability moves** unless a linked task explicitly changes product behaviour.
2. **Prefer extraction along conceptual seams** (diagram stage, location chrome, hints, dev-only affordances) over arbitrary chunking by line count.
3. **Locality is allowed** where splitting would fragment a single coherent interaction; the mission is **not** “everything must be one hop away in another file.” The bar is: the **default read path** stays narrative; **depth** is optional.
4. **Reuse existing constructs** before adding parallel abstractions (see repository habits and any active dedupe guidance).

## Non-goals

- Replacing Svelte with another UI model, or mandating a specific file/folder layout beyond “route as narrative, detail elsewhere.”
- Rewriting the home product experience; this is a **code shape** mission unless explicitly paired with a UX spec.
- Chasing a fixed maximum line count as success on its own.

## Repo anchor

- **Primary implementation today:** `src/ui/routes/Home.svelte`

When this file shrinks or gains siblings, update this section if the **entry point** for the home route changes (for example a thin `Home.svelte` that only re-exports or composes a `HomeRoute` module).
