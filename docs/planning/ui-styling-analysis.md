# UI styling analysis — continuity anchor

This document captures **why** the home screen looks the way it does in relation to product mission, **what** the main visual/conceptual pieces are, and **which design dimensions** we intend to tune deliberately (colour, stroke, type, motion, hierarchy). It is meant to survive **multiple sessions** on styling and visual design: extend it with dated notes or subsections rather than replacing the spine.

**Related sources**

- Mission and positioning: [`docs/specs/elevator-pitch.md`](../specs/elevator-pitch.md)
- Diagram structure and named elements: [`docs/specs/tide-diagram.md`](../specs/tide-diagram.md)
- Default style bindings (placeholders): `src/diagram-generation/presets/staticStyleModel.mjs`
- Home shell (header, location): `src/ui/App.svelte`

---

## 1. Mission spine (what styling must serve)

The app is for **people who live in or visit UK coastal areas**. It must remain **practically useful** (today’s tide times and heights) while feeling like an **instrument or wall appliance**, not a generic tide table. Differentiation is **presentation and emphasis**, not secret data.

**Primary narrative** (non-negotiable for hierarchy decisions):

- The **relationship between the current time** and the **next** tidal event (high or low).
- That upcoming moment should be **highlighted** while the **full set** of times and heights for the day remains visible.

**Time spine and borrowed readings**

- **Geometry (precise):** the day axis is a **segment of a circular arc**—the **RefArc**—with a **swept angle slightly under 180°** (see [`tide-diagram.md`](../specs/tide-diagram.md) and diagram defaults). Informal “smile-like” language in the elevator pitch suggests the same shape in plain words; for styling and layout decisions, treat the spine as **arc geometry**, not a loose metaphor.
- **Near the clock, but not a 12-hour face:** the circle segment **cuddles up to the clock-face idea** enough that users bring **dial** expectations. It **steps away** from a conventional **12-hour analogue** reading, which would invite the wrong mental model: this instrument maps **one full civil day (24 hours)** onto the arc, not half a day or a repeating 12-hour cycle.
- **Radial lines — wholesale clock intuition:** **rays from the centre** (now pointer, next pointer, tick geometry, and related radial structure) borrow the **“hands from a hub”** interpretation **wholesale**, like an analogue clock, so position along the day is read **angularly** along that spine.
- **Along the arc:** **markers** for highs and lows; **wait arc** and other elements complete the story of **now**, **next**, and **interval**.

**Presentation**

- **Visual and graphical** first; typography supports the dial and readouts.

Any styling pass should be checkable against: *Does this make “now → next → wait” obvious at a glance without hiding the rest of the day? Does it still feel like one coherent instrument?*

---

## 2. Two layers: chrome vs diagram

The user-facing home experience is **not** only the tide diagram. Treat these as **siblings** that must read as **one object** (especially on a wall).

### 2.1 Header chrome — location, change, menu

**Location** (the geographical town name) is **first-class for meaning**: it anchors *these* tides to *this* place. **Changing location** is part of the core loop, not an obscure setting.

- **Place naming** and the change affordance live in the **header** (`App.svelte`), not in the tide diagram scene graph.

**Design implication:** header and diagram should be **decided together**—shared palette, shared rules for what is “dominant” vs “secondary,” and type roles—so the screen does not feel like two apps stitched together.

### 2.2 Tide diagram — instrument face

The diagram implements the arc, ticks, tide catalogue, now/next/wait emphasis, centre readout, and civil clock readout per the spec and `buildDiagram` pipeline. Styling is bound to **named leaves** (exact names in `staticStyleModel.mjs` and the spec).

---

## 3. Diagram components mapped to mission

Ordered from **structural backbone** toward **narrative emphasis**. Names align with [`tide-diagram.md`](../specs/tide-diagram.md) and diagram-generation output.

### 3.1 Day backbone and scale

| Component | Role | Mission fit |
|-----------|------|----------------|
| **RefArc** | Circular arc segment (sweep just under 180°): 00:00→24:00 along θ | Primary **day spine**; evokes a **dial** without implying a **12-hour** cycle. Weight, colour, and material read set **instrument vs chart vs playful** tone. |
| **TickMark**, **TickLabel** | Hour scale | **Context** for “where in the day.” Should support quick scanning **without** competing with now/next emphasis. |

### 3.2 Full-day tide catalogue

| Component | Role | Mission fit |
|-----------|------|----------------|
| **TideMarks** (per event: **HeightLabel**, **TimeLabel**, **TimePointer**) | All highs/lows for the day | Delivers “full set of times and heights.” Treat as **reference data**: even, legible; avoid one row accidentally looking like *the* answer unless hierarchy is intentional. |

**Typical count and spacing (layout bounds).** For a normal civil day at a typical UK coastal station, the extremes pattern means there are **nearly always four** tide events on the diagram—high and low alternating—and they fall **roughly equispaced** around the day arc (about six hours apart, modulo the exact harmonic). **Design bounds:** assume **four markers** as the **default density** when tuning label size, pointer length, collisions with ticks, and colour weight; the layout should look **balanced** in that regime. **Exceptions** (fewer markers in the slice, or uneven spacing when astronomy skews times) still occur; styling must stay legible there without assuming four as a hard-coded visual trick—only as the **norm** the happy path is tuned for.

### 3.3 Primary narrative: now ↔ next ↔ wait

| Component | Role | Mission fit |
|-----------|------|----------------|
| **NowPointer** (**NowRadialLine**, **NowTriangle**, **NowLabel**) | Current time on the dial | “Where am I on today’s rhythm?” Stroke choices (e.g. dashed vs solid) can suggest **live / transient** vs **fixed structure**. |
| **NextPointer** | Radial emphasis + marker at **next** tide time | Directly implements the **current time vs next event** story. Strong candidate for **primary focal** weight after the RefArc. |
| **WaitArc** | Arc from now to next | Makes the **interval** spatial; pairs with verbal countdown. Stroke/dash/colour negotiate **urgency vs calm**. |
| **TimeDelta** (**EventKind**, **DeltaGlue**, **DeltaInterval**) | e.g. “low water in 4h 27m” | **Explicit** next-event sentence. Type weight/size should reinforce that this is the **main verbal readout** of the face. |

### 3.4 Centre cluster and civil clock

| Component | Role | Mission fit |
|-----------|------|----------------|
| **CentreClusterFrame** | Inner arc / frame | **Bezel** or readout window; usually **quieter** than RefArc and next-event emphasis. |
| **TimeNowLabel** | Canonical time (e.g. to seconds) | **Civil time anchor** for a wall display. Legibility vs tide-story prominence is a product choice (lobby clock vs tide-first). |

### 3.5 Edge / honesty states

| Component | Role | Mission fit |
|-----------|------|----------------|
| **NoMoreTidesToday** | Copy when no next tide remains on the civil day | **Trust**: no false “next.” Styling should read **informative**, not like a panic error, unless we deliberately want alarm semantics. |

### 3.6 Hierarchy rule of thumb

Reserve **at most one or two dominant channels** (e.g. hue + strongest stroke weight) for the **now → next → wait** story. Everything else supports **instrument identity**, **full-day reference**, and **glanceable clock**.

---

## 4. Cross-cutting design goals (beyond the pitch)

These sit alongside mission fit; they are where multi-session debate will cluster.

### 4.1 Aesthetic culture (spectrum)

We have not fixed a single aesthetic. A useful axis:

- **Playful / holiday / soft** — approachable, tourism-forward.
- **Serious instrument / technical / austere** — harbour office, gauge, dashboard.

**Hybrids are valid** (e.g. strict dial + slightly warmer header), if chosen explicitly. The **current placeholders** lean **serious instrument**: dark field, thin gold/yellow structure, grey secondaries, monospace numbers, minimal decoration—aligned with the pitch’s appliance metaphor.

### 4.2 First-glance appeal (opt-in product)

Users **choose** to open the app; the home screen should reward that quickly. Focal path matters more than ornament:

1. **Place** — header answers “for where?”
2. **Arc + centre line** — what’s happening next and how long
3. **Next marker** on the arc — when

Contrast rhythm (what is accent vs neutral), spacing, and a **single dominant curve** support “I’m glad I opened this” without clutter.

### 4.3 Aliveness (not static wallpaper)

The product is suited to **always-on** contexts; it should feel **current**, not like a screenshot.

- **Today:** **second-resolution** updates on **TimeNowLabel** are the main **heartbeat**—proof of live system time without requiring refresh.
- **Later:** optional subtle motion (e.g. pointer or arc) is easy to overdo; any motion should reinforce “live data,” not decoration.

If the header does not carry other live cues, the **clock readout carries the full burden** of aliveness.

---

## 5. Placeholder implementation snapshot

Default diagram styles are centralised in **`src/diagram-generation/presets/staticStyleModel.mjs`**: named bindings (e.g. **RefArc**, **NextPointer**, **WaitArc**, **TimeNowLabel**, tide mark leaves, now-pointer sub-leaves). Colours and line styles there are **engineering placeholders**, not a finished brand system.

**Observed direction** (including reference screenshots of the home screen): yellow/gold for **dominant** structural and next-event cues; **darkgrey** strokes and grey writing for secondary mechanics and labels; **dashed** now radial line vs **solid** next line; monospace for numeric/time text. This matches the **serious instrument** pole described above.

---

## 6. Session continuity

When this topic comes back:

1. **Re-read §1–2** before debating tokens—mission and chrome/diagram split are the guardrails.
2. **Record decisions** as short dated bullets or a “Decisions log” subsection (what we chose, what we rejected, and why).
3. **Split work** where it belongs: header/CSS in UI shell vs diagram bindings in `staticStyleModel.mjs` / renderer (keep naming contract with [`tide-diagram.md`](../specs/tide-diagram.md)).

---

## 7. Decisions log

*(Append here as styling choices firm up.)*

- *— none recorded yet —*
