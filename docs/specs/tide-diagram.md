# Specification for a tide diagram

## Role

To specify a specific diagram in terms of a scene graph and input parameters.

### Host responsibilities

The **diagram generator** does **not** define paint order, z-height ordering, or
layers. Those topics are handled **outside** the generator. **Named elements**
(see **Diagram elements**) exist so that an **external** host can bind layering
and related presentation properties to each entity by name; the mechanics of
that binding are **not in scope** yet.

Where this specification mentions text or numeric inputs “from outside” or
“from the host,” supply and policy for those values are host responsibilities.
How the final rendered bounds map into a canvas, viewport, or layout is also
**not** fixed here.

## Strict diagram input (generator)

The generator **throws** when required host fields are missing or the wrong type;
it does **not** substitute silent numeric defaults for layout keys (`buildDiagram.mjs`
and layout submodules).

- `**canvas`** — object with finite `**width**` and `**height**` (px).
- `**title**` — string (diagram meta).
- `**refRadius**`, `**sweepRad**`, `**tickLen**`, `**tickLabelSize**`, `**tickLabelClearance**` — finite numbers (**k·R** or px as documented per key).
- `**tickLabelHours`** — array; each entry must be an integer in **0..24** (inclusive). An empty array is valid.
- `**waitArc`** — object with finite `**radius**` (**k·R**). If **max(0, radius)·RefRadius** is **0**, the wait arc is omitted without evaluating next-tide logic. Otherwise `**arrow`** is required: finite `**lengthK**`, `**widthK**`, `**insetK**`; `**style**` is `**filled**` or `**open**`; `**scaleWithStroke**` is a **boolean**.
- `**tideMarks`** — if absent, or `**markers**` missing or empty, there are no tide marks. If `**markers**` is non-empty, these finite numbers are required on `**tideMarks**`: `**tideHeightLabelRadius**`, `**tideTimeLabelRadius**`, `**tideHeightLabelSize**`, `**tideTimeLabelSize**`, `**tideMarkArrowDivergence**`, `**tideMarkArrowLineLen**`. At least one marker row must yield a usable time after parsing (otherwise generation throws).
- `**nowPointer**` / `**nextPointer**` — if present, use nested objects with the finite fields described under **NowPointer** and **NextPointer** (no legacy flat key fallbacks): **now** — `**radialLine**`, `**label**`, `**triangle**`; **next** — `**radialLine**` only. On `**nowPointer.triangle**`, `**subtendedAngleRad**` is **required**: a **literal** angle in **radians** (not a **k·R** length); see **§NowPointer**. **R_frame** from `**centreFrame.frameArcRadius**` supplies the Now radial **inner** radius; the Next filled-circle radius is **σ·R_frame** for fixed **σ** in **§NextPointer** (see **CentreFrame**, **NowPointer**, **NextPointer**).
- `**timeDelta`** — **required** plain object; finite `**leftOfOrigin**`, `**belowOrigin**`, and `**fontHeight**` (**k·R** per **§Sizing**), plus string `**town**` and enum `**tidePhasePair ∈ {"out-low","in-high"}`. `**leftOfOrigin**` is the distance from **X = 0** toward **−X** for the line's left anchor; `**belowOrigin**` is the distance from **Y = 0** toward **−Y** for the shared baseline. Supplies **TimeDelta** layout/copy inputs only (see **TimeDelta**).
- `**centreFrame`** — **required** plain object; finite `**frameArcRadius**` (**k·R**). Defines **R_frame** = **k·R** for the **CentreFrame** arc and the **NowPointer** radial inner endpoint (**§CentreFrame**). Uses top-level `**refRadius**` and `**sweepRad**` (required above).
- `**annularBand**` — if **absent**, **AnnularBand** is omitted from the scene. If **present**, `**annularBandWidth**` is **required**: a finite number interpreted per **§Sizing** as **k·R**, i.e. **AnnularBandWidth·RefRadius**, the **radial thickness** of the band (see **AnnularBand**). If **AnnularBandWidth ≤ 0**, **AnnularBand** is omitted without error.

## Diagram elements

- The diagram has named elements:
  - TickMarks
  - TickLabels
  - TideMarks
  - NowPointer
  - NextPointer
  - WaitArc
  - TimeNowLabel (group; style-bound leaves are **TimeNowLabelHms**, **TimeNowLabelSecondsColon**, and **TimeNowLabelSeconds**)
  - TimeDelta
  - NoMoreTidesToday
  - CentreFrame
  - AnnularBand

When there is **no** tide marker at or after `timeNow` on the same civil day
(same “next marker” notion as **WaitArc**), **NextPointer** and **WaitArc** are
**omitted**. **TimeDelta** then carries a **single** replacement **TextElement**
(see **TimeDelta**, empty-day case) under the stable leaf name **NoMoreTidesToday**
instead of **EventKind**, **DeltaGlue**, and **DeltaInterval**. **TimeDelta** and
**CentreFrame** are independent named elements (no grouping or parent/child link
between them in the logical model).

### Style binding names (exact-match contract)

- Style bindings are keyed by **exact** leaf element names.
- Name matching is **case-sensitive** and has **no aliasing** or fallback.
- A style binding name must match the emitted leaf element name byte-for-byte.
- This specification allocates leaf names **where the corresponding leaf is
mandated**; it does not maintain a separate exhaustive registry section.

## Conventions

Cross-references use the § labels below.

### §Origin — diagram model space

- **O** denotes the centre of the **RefArc**, at **(0, 0)** in **diagram model
space**.
- Unless stated otherwise, Cartesian coordinates and polar angles are relative
to **O** (see **§Axes** and **§Polar**).

### §Sizing — linear inputs

- **RefRadius** is a diagram input: the radius of the **RefArc** (see **§Polar**).
- **k·R** means **k × RefRadius** for a dimensionless proportion **k** from a
diagram input.
- Unless an element explicitly states otherwise, every **linear** sizing input is
interpreted as **k·R** (e.g. **0.15** → **0.15·R**).

### §Axes

- **X** increases to the **right** of the scene; **Y** increases **upward**.
- **Left** / **right** mean decreasing / increasing **X**. **Top** / **bottom**
mean increasing / decreasing **Y**. **Above** / **below** mean toward **top** /
**bottom** along **Y** (see **§Origin**).

### §Polar — reference arc geometry

- The **RefArc** is a contiguous **circular arc** of radius **RefRadius** centred
at **O**; it is the primary geometric reference for the diagram.
- The RefArc’s **subtended angle** (**swept angle**) and **RefRadius** are diagram inputs.
- The **omitted** portion of the full circle is centred on the **positive Y**
axis; the RefArc spans **symmetrically about the negative Y** axis.
- The **leftmost** endpoint of the RefArc lies toward **negative X**; the
**rightmost** toward **positive X**.
- Angles increase **counterclockwise (CCW)**.
- Let **θ_left** and **θ_right** be the polar angles of the leftmost and
rightmost endpoints of the RefArc. The remainder of the diagram geometry is a
function of the RefArc.

### §Time and θ(t)

- The RefArc represents one **24 h** span from **00:00** to **24:00**.
- **00:00** is the **leftmost** endpoint; **24:00** the **rightmost**.
- All host-provided times use one strict canonical string format:
  - `**HH:MM:SS`** (exactly 2 digits per field, colon-delimited).
  - Valid normal range: `**00:00:00`** through `**23:59:59`**.
  - `**24:00:00**` is a reserved sentinel for the RefArc right endpoint only.
- Define canonical-to-scalar conversion:
  - For parsed components **H, M, S**, define **t = H + M/60 + S/3600**.
  - This yields **0 ≤ t < 24** for normal canonical times and **t = 24** only
  for `**24:00:00`**.
- Increasing time maps **monotonically and linearly** to distance along the
RefArc from left to right (CCW along the arc).
- For **t** in hours with **0 ≤ t ≤ 24**:
**θ(t) = θ_left + (t / 24) × (θ_right − θ_left)**
This **θ(t)** is the polar angle for time **t** on the RefArc. It is
invertible. Any element that “uses time **t**” uses **θ(t)** unless stated
otherwise.

### §Global “time now” input

- The diagram model uses **one** global canonical input:
  - `**timeNow`** is a host-provided canonical string in `**HH:MM:SS`**.
  - `**timeNow = "24:00:00"` is invalid** and must fail diagram generation.
- Define:
  - Parse `**timeNow`** per **§Time and θ(t)**.
  - **t_now = H + M/60 + S/3600**
  - **θ_now = θ(t_now)** per **§Time and θ(t)**.
- Any element that is “tied to the current time now” is defined **in terms of
`t_now` and `θ_now`**; the specification does **not** introduce a second,
independent notion of “now.”

## Radial lines and radial segments

- A **radial line** (infinite) passes through **O** at a given polar angle
(**§Polar**, **§Origin**).
- A **radial segment** is the **line segment** on that ray between two polar
radii **r_inner** and **r_outer** (in model units). It has no inherent “direction
of travel.”
- Tick marks are defined as radial segments (**Tick marks**).

## Scene graph primitives (current scope)

- The scene graph at this stage consists of:
  - Arc segments (for **RefArc** and for **CentreFrame**)
  - Line segments (for radial segments and tick marks)
  - Text elements
  - Filled closed paths for the Now **triangle** (annular wedge: two straight segments and a minor arc on the annulus outer circle; **NowPointer**); **fill** and **stroke** use **NowTriangle** leaf styles (product default: **stroke**/**fill** colour aligned with **TideMarks.TimePointer** outline colour)
  - Filled circles (**NextPointer**)
  - **Line** segments and **arc** segments for **TideMarks.TimePointer** (two equal sides of the pointer triangle as strokes, head as a circular arc; **fill** is **none**)
  - One **closed annular sector** path (**fill** and **stroke** on the composite
  boundary) introduced by **AnnularBand** (see **AnnularBand**)

### Independent stroked curves

- **Line** and **arc** primitives are **one-dimensional** curves in the logical
model. They are **stroked** along the curve and, for now, **never** treated as
**filled** regions. **Fill** of areas bounded by curves is **out of scope** for
those primitives **except** for the dedicated **AnnularBand** closed region
(**AnnularBand**).
- Where multiple curve primitives are **independent**, they are **topologically**
independent: **not** joined into one path, **not** merged into one composite
path, and **do not** form a closed region by composition in the logical scene
graph—even if a viewer perceives closure optically. Distinct primitives may
**coincide** at a point (e.g. at **O**) without becoming one logical path.
- Subgroups that emit several curves (e.g. **TimePointer**) satisfy **Independent
stroked curves** unless a subsection adds detail.
- **AnnularBand** is **not** covered by **Independent stroked curves**: it is one
closed region with unified **fill** and **stroke** on its boundary (**AnnularBand**).
- The **NowPointer** Now **triangle** wedge is **not** covered by **Independent stroked curves** for fill semantics: it is one closed path with unified **fill** and **stroke** (see **NowTriangle** vs **TimePointer** under **Scene graph primitives**).

## Text Element

A **TextElement** is one line of text parameterised by:

- **Text**
- **FontHeight** (always **k·R** per **§Sizing**; synonym: any legacy mention of
“font size” for this quantity means **FontHeight**)
- **Horizontal justification** ∈ {left, right, centre}
- **Baseline polar angle**
- Anchor **(x, y)** in diagram model space (**§Origin**)

**Font:** monospace is assumed so hosts can use simple width estimates for layout.

### TextElement defaults

Unless a subsection **overrides** these:

- **Baseline polar angle** = **0** (baseline horizontal in diagram space per
**§Axes**).

Subsections may set justification, **FontHeight** **k** values, anchors, and
non-default baselines (e.g. tide labels).

### Text anchor Y (global)

Elements that delegate to **TextElement** place the anchor **(x, y)** in diagram
model space. **Y** follows the same convention as **TickLabel** anchors
(vertical association for rendering in the host). This specification does not
model em-boxes or similar font metrics.

*(Additional primitives may be introduced as required by later elements.)*

## NowPointer

**NowPointer** is a top-level named element tied to the current time now.

### Logical structure

**NowPointer** comprises three direct parts:

- **Now radial line** — one radial segment on the time-now ray.
- **Now label** — one **TextElement** with constant text `now`.
- **Now triangle** — one **filled** closed wedge (**fill** and **stroke** on the composite boundary), geometrically as follows: **vertex** on the **RefArc** at **θ_now**; the wedge **opens outward** along the time-now ray (**away from O**, into **AnnularBand**). Two **equal** straight sides diverge from that outward bisector by **±½·subtendedAngleRad** and meet the **outer** circle of **AnnularBand**; the third boundary is the **minor circular arc** on that outer circle between the two outer endpoints (same centre **O** as the RefArc). Paint uses **NowTriangle** leaf styles (product default: **fill** and **stroke** colour matched to **TideMarks.TimePointer** outline colour for visual consistency).

### Time association

- **NowPointer** is defined relative to the **global** current time:
  - It uses **t_now** derived from canonical `**timeNow`** and **θ_now = θ(t_now)** from
  **§Global “time now” input**.
- All **NowPointer** geometry is defined relative to **θ_now**.

### Geometry (first pass, pending final constants)

Because exact distances and angles are not yet specified, this section defines
the structure and leaves sizing inputs explicit.

#### Inputs and shared derived quantities

- **R_frame** — from `**centreFrame.frameArcRadius**` as **k·R** (**§Sizing**); same value as **§CentreFrame** (**R_frame**).
- **NowPointerLineOuterRadius** — line **outer** radius as **k·R** per **§Sizing**.
- **NowPointerLabelSize** — label **FontHeight** multiplier **k** as **k·R**
(**§Sizing**).
- **NowPointerLabelNormalOffset** — signed diagram input **k** as **k·R**
(**§Sizing**).
- Let **û_rad = (cos θ_now, sin θ_now)** — unit vector along the time-now ray from
**O** outward (**§Axes**, **§Polar**).
- Let **û_n = (−sin θ_now, cos θ_now)** — unit vector perpendicular to **û_rad**,
from rotating **û_rad** by **+π/2** CCW (**§Polar**).
- Let **r_inner = R_frame**, **r_outer = NowPointerLineOuterRadius·R**.
- Let **P** be the midpoint of the **Now radial line** segment between
**r_inner** and **r_outer** along **û_rad**.
- Define a **side sign** for label placement:
  - **side_sign = +1** when **t_now ≤ 12** (midnight through noon inclusive).
  - **side_sign = −1** when **t_now > 12** (afternoon through midnight).

#### Now radial line

- A radial segment at **θ_now** with:
  - **r_inner = R_frame** (from `**centreFrame.frameArcRadius**`, not on `**nowPointer.radialLine`**),
  - **r_outer = NowPointerLineOuterRadius·R**.
- The **outer** radius multiplier is a **required** host diagram input (nested under `**nowPointer.radialLine.outerRadius`**) interpreted by **§Sizing** when **NowPointer** is included.

#### Now label

- One **TextElement** with:
  - **Text** = constant `now` (not host text).
  - **Horizontal justification** = **centre**.
  - **Baseline polar angle** = **θ_now + π** (overrides **TextElement defaults**).
  - **FontHeight** = **NowPointerLabelSize·R** (diagram input, **§Sizing**).
- **Anchor** — **P + side_sign × (k·R)·û_n**, where **k** is
**NowPointerLabelNormalOffset**:
  - Positive **k** with **side_sign = +1** places the label on the **left**
  (CCW) side of the outward radial direction.
  - For the same **k**, **side_sign = −1** moves it to the **opposite** side.

**Now triangle (filled)**

- **Now triangle (filled)** is still named “triangle” in the input and scene grouping, but its geometry is the **annular wedge** above.
  - It is tied to **θ_now** and emitted as a **single closed path** with **fill** and **stroke** (see **Scene graph primitives**; **NowTriangle** vs **TimePointer**).
  - **Required** diagram input on `**nowPointer.triangle**`:
    - `**subtendedAngleRad**` — **literal** angle in **radians** between the two straight sides at the vertex (**not** a **k·R** value). Must satisfy **0 < subtendedAngleRad < π**.
  - **Radii** (model units):
    - **r_ref = RefRadius** — vertex **V = polar(r_ref, θ_now)** lies on the RefArc.
    - **r_ann_outer = RefRadius + AnnularBandWidth·RefRadius** with **AnnularBandWidth** from `**annularBand.annularBandWidth**` (**§AnnularBand**, **§Sizing**). The straight sides end where they meet the circle of radius **r_ann_outer** about **O**.
  - **Construction**:
    - Let **û_rad** be the unit vector from **O** **through V** (**outward** along the time-now ray; same **û_rad** as **§NowPointer** shared quantities). The wedge bisector from **V** into the band follows **û_rad**. The two rays from **V** that bound the wedge are **û_rad** rotated by **±½·subtendedAngleRad** in the diagram plane (CCW positive, **§Polar**), i.e. directions at polar angles **θ_now ± ½·subtendedAngleRad**.
    - Let **P_a** and **P_b** be the first forward intersections of those rays with the circle **|P − O| = r_ann_outer**.
    - The closed path is **V → P_a → (minor arc along that circle from P_a to P_b) → V**, with **fill** and **stroke** applied to that path in scene terms (same fill/stroke resolution as filled **TrianglePrimitive** leaves).
  - **AnnularBand** must be present with **annularBandWidth > 0** whenever **NowPointer** is used, so **r_ann_outer > r_ref** holds (same rule as **§Strict diagram input** for **annularBand**).

## NextPointer

**NextPointer** is a top-level named element tied to the **next** tide marker at or after `timeNow` on the same civil day (see **TimeDelta** and **TideMarks**).

### Logical structure

**NextPointer** comprises two direct parts, both on the ray of the next-tide time:

- **Next radial line** — one radial segment.
- **Next circle** — one filled circle at the outer end of that radial segment.

### Time association

- Let the **next tide marker** be the same event used by **TimeDelta** (next marker at or after `timeNow`, ignoring any marker at `24:00:00`).
- Let its time be **t_next** in hours, with **θ_next = θ(t_next)** per **§Time and θ(t)**.
- All **NextPointer** geometry is defined relative to **θ_next**.
- If no such next marker exists on the same civil day, **NextPointer** is
omitted from the scene (no radial segment or circle emitted), consistent with
**WaitArc**.

### Geometry

Inputs and derived quantities:

- **NextPointerLineOuterRadius** — line **outer** radius as **k·R** per **§Sizing**.
- **R_frame** — from `**centreFrame.frameArcRadius**` as **k·R** (**§Sizing**); same as **§CentreFrame** and **NowPointer** inner radius.
- **σ** — fixed dimensionless constant **1/35** (not a host input). Scales the Next filled-circle radius relative to **R_frame**.
- Let:
  - **r_inner = R_frame**,
  - **r_outer = NextPointerLineOuterRadius·R**,
  - **r_circle = σ·R_frame**.

#### Next radial line

- A radial segment at **θ_next** with:
  - **inner radius** **r_inner** = **R_frame** (same as **NowPointer**),
  - **outer radius** **r_outer** from **NextPointerLineOuterRadius** (required host input under `**nextPointer.radialLine`**).
- If **r_outer ≤ r_inner**, **NextPointer** is omitted from the scene (no radial segment or circle emitted).

#### Next circle

- The **Next circle** is a filled circle at the **outer** endpoint of the Next radial line:
  - **Centre** — the point at radius **r_outer** on the ray at **θ_next**.
  - **Radius** — **r_circle** = **σ·R_frame** (**σ** = **1/35**; **R_frame** from `**centreFrame.frameArcRadius**`; no host field on `**nextPointer`**).

## WaitArc

**WaitArc** is a top-level named element representing the waiting interval from
`timeNow` to the next tide marker on the same civil day.

### Logical structure

- **WaitArc** contributes one arc segment concentric with **RefArc**.- Arrowhead rendering is **not** synthesized by diagram generation; generation
carries an explicit metadata intent that an arrow exists at arc end. The
downstream renderer is responsible for visual arrowhead geometry.

### Time association

- Use the same **next tide marker** definition as **NextPointer** and
**TimeDelta**.
- Let **θ_now** be from `timeNow` and **θ_next** from the next marker time.
- **WaitArc** starts at **θ_now** and sweeps CCW to **θ_next**.

### Geometry

- Define input **WaitArcRadius** as **k·R** per **§Sizing**.
- Radius is **R_wait = WaitArcRadius·R**.
- Arc centre is **O**, with start angle **θ_now** and sweep
**max(0, θ_next − θ_now)**.
- If no next marker exists on the same civil day, **WaitArc** is omitted.

### Arrow metadata

- **WaitArc** carries arrow metadata only; generator does not synthesize
arrowhead geometry.
- Arrow metadata fields:
  - **at** — currently fixed to `end` for **WaitArc**.
  - **lengthK** — arrowhead length multiplier (recommended in stroke-width
  units for renderer mapping).
  - **widthK** — arrowhead width multiplier (same unit convention as
  **lengthK**).
  - **insetK** — signed tip offset along the tangent at the target endpoint.
  - **style** — one of `filled` or `open`.
  - **scaleWithStroke** — boolean; when true, renderer scales marker with
  stroke width.

## TimeNowLabel

**TimeNowLabel** is a **top-level** named element (see **Diagram elements**). It
shows the current civil clock time derived from global `**timeNow`**.

### Input

- Diagram input object `**timeNowLabel**` (when **absent**, **TimeNowLabel** is
**omitted** from the scene). When **present**, all of the following are **required**
(finite numbers as **k·R** multiples); the host supplies layout (e.g. product baseline
in `**buildDiagramGenerationSpec`**):
  - `**fontHeight**` — proportion **k** as **k·R** (**§Sizing**).
  - `**x`** — proportion **k** as **k·R** for anchor **X** (typically toward **+X** in the content region).
  - `**y`** — proportion **k** as **k·R** (**§Sizing**): a **positive** host value is interpreted as **k·R** **subtracted** from **Y = 0** (**§Origin**) to place the shared text **baseline** at **Y = 0 − k·R** (toward **−Y** / **below** the arc centre when **k > 0**). **Not** the same convention as **`timeDelta.y`** (which is a signed offset to the baseline).
- Diagram input `**timeNowDatePrefix`** — required string prefix for the left fragment
  (customary short form such as `**Wed 21 Jun`**).

### Text and placement

- Three **TextElement**s that read as one `**Wed 21 Jun - HH:MM:SS`** line (same **FontHeight** and baseline):
  - **Date+HH:MM fragment** — `**timeNowDatePrefix + " - " + HH:MM`**.
  - **Seconds-colon fragment** — a single literal `**:`** (the colon immediately before `**SS**`).
  - **Seconds fragment** — canonical `**SS`** (two digits).
  - **No** literal prefix such as “Time now”.
  - **FontHeight** — **k_font·R** with **k_font** from `**fontHeight`**.
  - **Horizontal justification** — **right** for all three; the seconds fragment’s anchor sits at the
  readout’s trailing edge in **+X**, and the seconds-colon and HMS anchors are offset left by fixed
  monospace advances so the triple abuts (**§Scene model** uses the same width heuristic as preview framing).
  - **Baseline polar angle** — **0** (**TextElement defaults**).
  - **Anchor** — HMS and seconds share **y = 0 − k_y·R** with **k_y** from `**y`**; **x** for the trailing (seconds)
  anchor is **k_x·R** with **k_x** from `**x`**.

### Scene model

- Emitted as a named group **TimeNowLabel** containing three child groups:
  - **TimeNowLabelHms** — one **TextElement** for the **Date+HH:MM** fragment (style name `**time-now-label`**).
  - **TimeNowLabelSecondsColon** — one **TextElement** (style name `**time-now-label-seconds-colon`**).
  - **TimeNowLabelSeconds** — one **TextElement** (style name `**time-now-label-seconds`**).

## TimeDelta

### TimeDelta placement

- **`timeDelta.leftOfOrigin`** (**k·R**, **§Sizing**) — distance from **X = 0** toward **−X** to the left anchor of the composed line.
- **`timeDelta.belowOrigin`** (**k·R**) — distance from **Y = 0** toward **−Y** to the shared text baseline.

### Scene model

- Emitted as a named group **TimeDelta** ( **`timeDelta`** input is required). When there is no next tide today, that group contains only **NoMoreTidesToday** (not **EventKind** / **DeltaGlue** / **DeltaInterval**).

### Copy and layout

- When a **next** marker exists on the civil day — one logical sentence, emitted as **one**
**TextElement** with **left** justification at the anchor from `**timeDelta.leftOfOrigin**` / `**timeDelta.belowOrigin**`.
  - Copy format: `**<town> · Tide <going out|coming in> · <Low tide|High tide> in <Hh Mm> (<HH:MM>)`**
  - `**town**` comes from `**timeDelta.town**`.
  - Direction/event pair comes from `**timeDelta.tidePhasePair**` (`"out-low"` → `going out` + `Low tide`; `"in-high"` → `coming in` + `High tide`).
  - Host derivation policy for `**timeDelta.tidePhasePair**`:
    - Use adjacent retained tide extrema as ordered in civil-day time.
    - For a fully defined segment `**[event_i, event_{i+1})`**, compare heights:
      - if `**height_{i+1} > height_i`**, use `**"in-high"`**;
      - if `**height_{i+1} < height_i`**, use `**"out-low"`**.
    - For `**timeNow`** before the first retained event or after the last retained event, treat those as half-defined edge segments and resolve by alternating opposite to the nearest fully defined segment.
  - `<Hh Mm>` and `<HH:MM>` are derived from the next marker at or after `**timeNow`** on the same civil day.
- **Empty civil day (no next marker)** — one **TextElement** only (not the
three-fragment sentence above):
  - **Text** — fixed synthesis: exactly `**No further tides today`** (not a host
  override).
  - **FontHeight**, **Horizontal justification** (**left**), **Baseline polar
  angle** (**0**), **Anchor X** (**x_delta·R**), and **Anchor Y** (**y_delta·R**) —
  same placement rule as the countdown line below (`**timeDelta.x**`, `**timeDelta.y**`).
  - Allocated leaf name for styling/host binding (exact match): **NoMoreTidesToday**.
  - Do **not** emit **EventKind**, **DeltaGlue**, or **DeltaInterval** in this case.
- **Allocated leaf name** for the countdown case (exact match): `TimeDeltaLine`.
- **Shared** for countdown line **and** for **NoMoreTidesToday**:
  - **FontHeight** — one input **k** as **k·R** for the whole line (**§Sizing**).
  - **Horizontal justification** — **left**.
  - **Baseline polar angle** — **0** (**TextElement defaults**).
  - **Anchor X** — **0 − leftOfOrigin·R**; **Anchor Y** — **0 − belowOrigin·R**.

## CentreFrame

**CentreFrame** is a named element whose output is **one** arc (**Independent
stroked curves**). It is not defined relative to **TimeDelta**; geometry follows
**§Polar** and the inputs below.

### Scene model

- Emitted as a named group **CentreFrame** ( **`centreFrame`** input is required). The group contains that single arc primitive subject to **Independent stroked curves**.

**Radius and endpoints**

- **R_frame** = **k·R** for diagram input **k** = `**centreFrame.frameArcRadius**` (**§Sizing**). The same **R_frame** is the **inner** radius of the **NowPointer** radial segment. The **NextPointer** filled-circle radius is **σ·R_frame** (**§NextPointer**).
- The arc uses the **same** centre **(0, 0)**, **sweep**, and angular orientation
as the **RefArc** (**§Polar**). The **only** geometric quantity that differs
from the **RefArc** is the circle radius (**R_frame** vs **RefRadius**).
- **θ_left** and **θ_right** are the polar angles of the leftmost and rightmost
endpoints of **this** arc at radius **R_frame** (same angular span as the **RefArc**).

**Arc segment**

- One arc at radius **R_frame** as above (**Independent stroked curves**).

## AnnularBand

**AnnularBand** is a **top-level** named element. It is the region between two
**concentric** circular arcs sharing the **RefArc**’s centre **O**, **sweep**, and
angular orientation (**§Polar**), closed at the two angular extremes by **radial
segments** on the rays at **θ_left** and **θ_right**.

### Geometry

- **Inner** circular boundary — coincident with the **RefArc**: radius **RefRadius**,
centre **O**, from **θ_left** to **θ_right** with the same CCW sweep as **§Polar**.
- **Outer** circular boundary — same centre **O**, same **θ_left**, **θ_right**,
and CCW sweep; radius **RefRadius + w** where **w = AnnularBandWidth·RefRadius**
and **AnnularBandWidth** is the dimensionless multiplier supplied as
`**annularBand.annularBandWidth**` (**§Sizing**: linear quantity **k·R** with
**k** = **AnnularBandWidth**).
- **End closures** — two **radial segments**: at **θ_left**, between radii
**RefRadius** and **RefRadius + w**; at **θ_right**, between the same radii.

Together these four edges form one **closed** region (an **annular sector**).

### Logical model and presentation

- **AnnularBand** is a **single** drawable with **both** **fill** and **stroke**
applied to the **entire** closed boundary (inner arc, outer arc, and both radial
segments).
- The **RefArc** remains a **separate** top-level stroked arc, **unchanged** by this
specification (same geometry as the **inner** circular edge of **AnnularBand**).
- **Paint order** is a **host** responsibility (**Host responsibilities**). For
the intended appearance—**RefArc** stroke **replacing** the **inner** portion of
**AnnularBand**’s stroke along the shared curve—the host should paint **RefArc**
**after** **AnnularBand** so the **RefArc** stroke **wins** at the inner boundary.

### Input

- Diagram input object `**annularBand**` (see **Strict diagram input**). When
**present**, `**annularBandWidth**` is **required** (finite, **§Sizing** as
above). When **AnnularBandWidth ≤ 0**, **AnnularBand** is omitted.

### Scene model

- Emitted as a named group **AnnularBand** containing the single closed-region
primitive (exact-match **style binding name** **AnnularBand**, same indirection
contract as **RefArc**, **CentreFrame**, **WaitArc**, etc.; concrete `styleName`
values are **not** fixed in this specification).

## Tick marks

- A tick mark is a (typically short) **radial segment** (**Radial lines and
radial segments**) on the ray at **θ(t)** (**§Time and θ(t)**).
- Radii: **1.0·R** and **(1.0 + k)·R** for diagram input **k** (**§Sizing**).

### Placement

- One tick per integer hour **t ∈ {0, 1, 2, …, 24}**.
- Each at polar angle **θ(t)**.
- **t = 0** and **t = 24** are **distinct** ticks at the two RefArc endpoints.

## TickLabel

- A **TickLabel** is a **TextElement** tied to its **TickMark**; association
implies time **t** and angle **θ(t)** (**§Time and θ(t)**).
- **Text** — two-digit hour string (e.g. `"09"`).
- **Horizontal justification** — **centre**.
- **FontHeight** — **k·R** for input **k** (**§Sizing**).
- **Baseline polar angle** — **0** (**TextElement defaults**).
- Generated only for hours in a host-chosen subset of **{0, 1, …, 24}**.
- Anchor: start at the **outer** end of the associated tick, then:
  - add a polar offset: angle = tick’s **θ(t)**, length = **k·R** (**§Sizing**);
  - add Cartesian offset **(0, −0.5 × FontHeight)**.

## TideMarks

**TideMarks** describe tide markers under **Diagram elements**. Layering and
paint order follow **Host responsibilities** (named elements for external binding;
z-order not fixed here).

### Count and time association

- **N** tide markers; count from host input.
- Each marker provides canonical `**time`** in `**HH:MM:SS`**.
- Parse marker `**time`** per **§Time and θ(t)** to derive **t** and **θ(t)**.
- Marker `**time = "24:00:00"`** is silently ignored (marker dropped).
- If two retained markers share the same canonical `**time`**, generation must
fail with an error.
- Each marker carries a **kind** flag `**highOrLow ∈ {"High", "Low"}`**, used
for derived event descriptions (see **TimeDelta**).

### Logical structure

Each marker is a **cluster** with **direct** children:

- **Height label** — one **TextElement**.
- **Time label** — one **TextElement**.
- **Time pointer** — one **TimePointer** subgroup (below).

### Height label and time label (layout)

For **both** labels:

- **Horizontal justification** — **centre**.
- On the marker’s polar axis from **O** at per-kind radius inputs (**§Sizing**):
  - Height label radius: `**<TideHeightLabelRadius>`·R`.
  - Time label radius: `**<TideTimeLabelRadius>`·R`.
- **Baseline polar angle** — **θ(t) + π/2** (overrides **TextElement defaults**).

**FontHeight** (per kind, **k·R**):

- Height label — `**<TideHeightLabelSize>`·R**.
- Time label — `**<TideTimeLabelSize>`·R**.

**Text** rules:

- Height label text is from the host.
- Time label text is synthesized from canonical marker `**time`** as
`**HH:MM`** (seconds omitted; no host override).
- Other **Text Element** rules apply unless overridden.

### TimePointer

**TimePointer** is the tide **time pointer** (map-pin silhouette). Layout derives the same **metric** geometry as before; the scene emits **stroked** primitives only (**no fill** on the pointer itself).

**Construction** (unchanged; used for vertex positions and the head circle):

- Define input `**tideMarkArrowDivergence`** — a non-negative angle in radians (host field on `**tideMarks**`).
- Define input `**tideMarkArrowLineLen**` — a non-negative float (**k·R** scale; host field on `**tideMarks**`).
- **Vertex1** is the point on the RefArc corresponding to time **t**.
- **halfAngle** is **0.5 × tideMarkArrowDivergence**
- **Vertex2** is located with a polar offset from Vertex1:
  - **R:** **tideMarkArrowLineLen × RefRadius**
  - **theta:** RadialAngle(t) + π + halfAngle
- **Vertex3** is located with a polar offset from Vertex1:
  - **R:** **tideMarkArrowLineLen × RefRadius**
  - **theta:** RadialAngle(t) + π − halfAngle
- Let **line1** = the segment **Vertex1 → Vertex2** and **line2** = **Vertex1 → Vertex3** (the two equal sides of the isosceles triangle **Vertex1, Vertex2, Vertex3**).
- Let **radial1** be the line through **Vertex2** perpendicular to **line1**, and **radial2** the line through **Vertex3** perpendicular to **line2**.
- Let **centre** = the intersection of **radial1** and **radial2**.
- Let **radius** = the distance from **centre** to **Vertex2** (equals distance to **Vertex3**; **Vertex1, Vertex2, Vertex3** lie on this circle).

**Scene emission** (outline, same silhouette as the former filled triangle ∪ filled disk):

- Two **line** primitives: **Vertex1 → Vertex2** and **Vertex1 → Vertex3** (**stroke** only).
- One **arc** primitive: circular arc from **Vertex2** to **Vertex3** with centre **centre** and radius **radius**, choosing the arc that does **not** contain **Vertex1** in its interior (the **head** cap—the arc whose interior points lie on the opposite side of chord **Vertex2–Vertex3** from **Vertex1**). Equivalently: of the two arcs between **Vertex2** and **Vertex3**, use the one that does **not** pass through **Vertex1** along the circle.

**Presentation:** the **TimePointer** subgroup uses **stroke** colour from its leaf style; **fill** is **none** on these primitives. Hosts may set **stroke-linecap** / **stroke-linejoin** so the three curves meet cleanly at **Vertex1**, **Vertex2**, and **Vertex3** (product default: round caps and joins on the **TimePointer** group).

## Notes on interpretation

- Standard mathematical conventions for polar coordinates and angles apply
(**§Polar**).
- Where ambiguity remains, implementations may follow common conventions
consistent with the above.

## o  todo

- collisions
- truncations

