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
and layout submodules). Invalid marker rows (including `**24:00:00`** as a marker
time), degenerate geometry used as configuration (e.g. wait-arc radius **≤ 0**,
pointer outer radius **≤ R_frame**), or missing objects such as the time-now readout inputs (`**timeNowLabel**`, `**timeNowDatePrefix**`) or `**annularBand`**, are **errors** — not “omit this element” fallbacks.

### Derived behaviour (civil day vs `timeNow`)

The **product** assumes at least **one** tide extreme on the civil day and a **non-empty**
`**tideMarks.markers`** list describing those extremes. The **only** open-ended case is
**time navigation**: when there is **no** marker at or after `**timeNow`** on that day
(e.g. after the last tide), **NextPointer** and **WaitArc** are **omitted** and
**TimeDelta** shows **TimeDeltaLocation**, **TimeDeltaPhase**, and **NoMoreTidesToday** (see **Diagram elements**, **TimeDelta**). That
omission follows from `**timeNow`** and the marker schedule; it is **not** triggered by
missing spec fields.

When `**spec.semantic.nextTide`** is injected, layout may use it for next-tide timing
instead of scanning markers; `**tideMarks`** remains **required** for drawing **TideMarks**.

For **NextPointer** occlusion clearance, a separate derived rule applies only when
a next marker exists on the same civil day:

- If the forward interval from `**timeNow`** to that marker is **strictly less
than 1 hour**, generation omits **NowPointer**’s **Now label**.
- If that same interval is **strictly less than 5 minutes**, generation also
omits **NowPointer**’s **Now radial line**.
- **WaitArc** uses a separate fit rule: geometry is kept whenever a qualifying
next marker exists, and arrow metadata is omitted whenever the configured
arrowhead would dominate the rendered arc segment.
- At **exactly 1 hour**, the Now-label omission does not apply.
- At **exactly 5 minutes**, the Now-radial-line omission does not apply.
- `**canvas`** — object with finite `**width`** and `**height`** (px).
- `**title**` — string (diagram meta).
- `**refRadius**`, `**sweepRad**`, `**tickLen**`, `**tickLabelSize**`, `**tickLabelClearance**` — finite numbers (**k·R** or px as documented per key).
- `**insideTrackRadius`** — finite number (**k·R**): radius of **InsideTrack** is **InsideTrackRadius × RefRadius**. Must be **> 0**. Same centre **O**, **θ_left**, and CCW sweep as **RefArc** (see **§Polar**, **InsideTrack**).
- `**tickLabelHours`** — array; each entry must be an integer in **0..24** (inclusive). An empty array is valid (explicit “no tick labels” for listed hours).
- `**waitArc`** — **required** plain object. `**radius`** must be a finite **k·R** multiplier **> 0** (**R_wait = WaitArcRadius·RefRadius**). `**arrow`** is **required**: finite `**lengthK`**, `**widthK`**, `**insetK**`; `**style**` is `**filled**` or `**open**`; `**scaleWithStroke**` is a boolean. (Derived behaviour still applies: with no next marker at/after `**timeNow**`, **WaitArc** is omitted; with a qualifying next marker, **WaitArc** geometry remains and arrow metadata is emitted only when the configured arrowhead fits the rendered arc span.)
- `**tideMarks`** — **required** plain object with **non-empty** `**markers`** array. Each marker row must supply string `**heightText`**, `**highOrLow ∈ {"High","Low"}`**, and canonical `**time`** in `**HH:MM:SS`** **other than** `**24:00:00`** (that sentinel is for the RefArc right endpoint only, not for tide events). These finite numbers are required on `**tideMarks`**: `**tideHeightLabelRadius**`, `**tideTimeLabelRadius**`, `**tideHeightLabelSize**`, `**tideTimeLabelSize**`, `**tideMarkArrowDivergence**`, `**tideMarkArrowLineLen**`. Duplicate canonical marker times are errors.
- `**nowPointer**` / `**nextPointer**` — **required** plain objects with the nested fields described under **NowPointer** and **NextPointer** (no legacy flat key fallbacks): **now** — `**radialLine`**, `**label`**, `**triangle**`; next — `**radialLine**` only. `**radialLine.outerRadius`** must be a finite **k·R** multiplier **> 0** and must place the line end **outside** **R_frame** (outer **>** inner). On `**nowPointer.triangle`**, `**subtendedAngleRad`** is required: a literal angle in radians (not a k·R length); see §NowPointer. R_frame from `**centreFrame.frameArcRadius**` supplies the Now radial **inner** radius; the Next filled-circle radius is **σ·R_frame** for fixed **σ** in **§NextPointer** (see **CentreFrame**, **NowPointer**, **NextPointer**). **NextPointer** is omitted from the scene only when there is no qualifying next tide (derived), not when `**nextPointer`** is missing.
- `**timeNowLabel`** — **required** plain object; finite `**fontHeight**` and `**dateAboveTime**` (k·R multiples; see **Time now readout**). Together with required string `**timeNowDatePrefix**`, drives **TimeNowDate** and **TimeNowClock**.
- `**timeDelta`** — **required** plain object; string `**town**`; enum `**tidePhasePair ∈ {"out-low","in-high"}**`; **boolean** `**atypicalTideSummary**` (when `**true**` and a next marker exists, countdown copy follows the atypical branch in **TimeDelta**); **`countdownLines`** — array of **exactly four** plain objects (location, phase, next-event interval, next-event clock stripes), each with finite `**belowOrigin`** and `**fontHeight`** (**k·R** per **§Sizing**); **`emptyMessage`** — plain object with finite `**belowOrigin`** and `**fontHeight**`: when there is no next tide today, the first two empty-day stripes use `**countdownLines[0]`** and `**countdownLines[1]`** for baselines and font heights; the third stripe (**NoMoreTidesToday**) uses `**countdownLines[2].belowOrigin`** for its baseline and `**emptyMessage.fontHeight`** for **FontHeight** (`**emptyMessage.belowOrigin`** is reserved / validated but not used for placement). Per stripe, `**belowOrigin`** is the distance from **Y = 0** toward **−Y** to that stripe’s baseline; **X** is fixed at **0** for all. Supplies **TimeDelta** layout/copy inputs only (see **TimeDelta**).
- `**centreFrame`** — **required** plain object; finite `**frameArcRadius`** (**k·R**). Defines **R_frame** = **k·R** for the **CentreFrame** arc and the **NowPointer** radial inner endpoint (**§CentreFrame**). Uses top-level `**refRadius`** and `**sweepRad`** (required above).
- `**annularBand**` — **required** plain object; `**annularBandWidth`** must be a finite **k·R** multiplier **> 0** (**AnnularBandWidth·RefRadius** is the band thickness). **AnnularBandWidth ≤ 0** is an error.
- `**homeMenuTrigger`** — **required** plain object for the home-route instrument trigger: finite `**width`**, `**height`**, and `**cornerRadius`** (each **k·R**, strictly **> 0**), with `**cornerRadius**` ≤ **min(width,height)/2** (so the rounded rectangle is valid); finite `**labelSize`** (**k·R**, strictly **> 0**); and string `**label`** (product default `**Menu**`). Position is derived from diagram content bounds: the trigger’s left edge is anchored to the leftmost tick-label bound, and its bottom edge is anchored to the minimum tick-label-anchor **Y**. Layout emits a **roundedRect** and centred **label** at that derived position (see **HomeMenuTrigger** under diagram elements).

## Diagram elements

- The diagram has named elements:
  - TickMarks
  - TickLabels
  - TideMarks
  - NowPointer
  - NextPointer
  - WaitArc
  - TimeNowDate (single **TextElement**; civil date prefix from the host)
  - TimeNowClock (group; style-bound leaves are **TimeNowLabelHms**, **TimeNowLabelSecondsColon**, and **TimeNowLabelSeconds** — canonical `HH:MM`, the colon before `SS`, and `SS`)
  - TimeDelta (countdown style-bound leaves: **TimeDeltaLocation**, **TimeDeltaPhase**, **TimeDeltaNext**, **TimeDeltaNextTime**; empty-day leaves: **TimeDeltaLocation**, **TimeDeltaPhase**, **NoMoreTidesToday**)
  - CentreFrame
  - AnnularBand
  - InsideTrack
  - RefArc
  - HomeMenuTrigger (named group: **roundedRect** with **width**, **height**, and **cornerRadius** (k·R); center is derived from content bounds so the rectangle left edge aligns to the leftmost tick-label bound and rectangle bottom edge aligns to the minimum tick-label-anchor **Y**; **HomeMenuTriggerLabel** carries the **label** at that same centre with vertical alignment chosen so the cap height is centred in the control)

When there is **no** tide marker at or after `timeNow` on the same civil day
(same “next marker” notion as **WaitArc**), **NextPointer** and **WaitArc** are
**omitted**. **TimeDelta** then carries **three** centre **TextElement**s (see **TimeDelta**, empty-day case): **TimeDeltaLocation**, **TimeDeltaPhase**, and **NoMoreTidesToday** (replacing the interval and `**at HH:MM**` stripes), instead of the four countdown stripes. **TimeDelta** and
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
- **InsideTrack** is a separate stroked **circular arc** concentric with the
**RefArc** (centre **O**), with radius **InsideTrackRadius × RefRadius** (**k·R**;
see strict inputs). It uses the same **θ_left** and the same CCW **swept angle**
as the **RefArc** (from **θ_left** to **θ_right**).

### §Time and θ(t)

- The RefArc represents one **24 h** span from **00:00** to **24:00**.
- **00:00** is the **leftmost** endpoint; **24:00** the **rightmost**.
- All host-provided times use one strict canonical string format:
  - `**HH:MM:SS`** (exactly 2 digits per field, colon-delimited).
  - Valid normal range: `**00:00:00`** through `**23:59:59`**.
  - `**24:00:00`** is a reserved sentinel for the RefArc right endpoint only.
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
  - Arc primitives (for **RefArc** and **TideMarks.TimePointer** head arcs)
  - One closed circular segment path (for **CentreFrame**: circular arc + straight chord closure)
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
**filled** regions.
- Area fills are represented by dedicated closed-region primitives (currently:
**CentreFrame** closed circular segment, **AnnularBand** annular sector, **NowPointer**
triangle wedge, and **NextPointer** filled circle).
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

### Occlusion-clearance rule

- When a qualifying next tide marker exists and is strictly less than
**1 hour** ahead of `**timeNow`**, **Now label** is omitted.
- When that interval is strictly less than **5 minutes**, **Now radial line** is
also omitted.
- **Now triangle** remains.
- At **exactly 1 hour**, Now-label omission does not apply.
- At **exactly 5 minutes**, Now-radial-line omission does not apply.

### Time association

- **NowPointer** is defined relative to the **global** current time:
  - It uses **t_now** derived from canonical `**timeNow`** and **θ_now = θ(t_now)** from
  **§Global “time now” input**.
- All **NowPointer** geometry is defined relative to **θ_now**.

### Geometry (first pass, pending final constants)

Because exact distances and angles are not yet specified, this section defines
the structure and leaves sizing inputs explicit.

#### Inputs and shared derived quantities

- **R_frame** — from `**centreFrame.frameArcRadius`** as **k·R** (**§Sizing**); same value as **§CentreFrame** (**R_frame**).
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
  - **r_inner = R_frame** (from `**centreFrame.frameArcRadius`**, not on `**nowPointer.radialLine`**),
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
  - **Required** diagram input on `**nowPointer.triangle`**:
    - `**subtendedAngleRad`** — **literal** angle in **radians** between the two straight sides at the vertex (**not** a **k·R** value). Must satisfy **0 < subtendedAngleRad < π**.
  - **Radii** (model units):
    - **r_ref = RefRadius** — vertex **V = polar(r_ref, θ_now)** lies on the RefArc.
    - **r_ann_outer = RefRadius + AnnularBandWidth·RefRadius** with **AnnularBandWidth** from `**annularBand.annularBandWidth`** (**§AnnularBand**, **§Sizing**). The straight sides end where they meet the circle of radius **r_ann_outer** about **O**.
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

- Let the **next tide marker** be the same event used by **TimeDelta** (next marker at or after `timeNow`; marker times must not use `24:00:00` — see **Strict diagram input** / **TideMarks**).
- Let its time be **t_next** in hours, with **θ_next = θ(t_next)** per **§Time and θ(t)**.
- All **NextPointer** geometry is defined relative to **θ_next**.
- If no such next marker exists on the same civil day, **NextPointer** is
omitted from the scene (no radial segment or circle emitted), consistent with
**WaitArc**.

### Geometry

Inputs and derived quantities:

- **NextPointerLineOuterRadius** — line **outer** radius as **k·R** per **§Sizing**.
- **R_frame** — from `**centreFrame.frameArcRadius`** as **k·R** (**§Sizing**); same as **§CentreFrame** and **NowPointer** inner radius.
- **σ** — fixed dimensionless constant **1/35** (not a host input). Scales the Next filled-circle radius relative to **R_frame**.
- Let:
  - **r_inner = R_frame**,
  - **r_outer = NextPointerLineOuterRadius·R**,
  - **r_circle = σ·R_frame**.

#### Next radial line

- A radial segment at **θ_next** with:
  - **inner radius** **r_inner** = **R_frame** (same as **NowPointer**),
  - **outer radius** **r_outer** from **NextPointerLineOuterRadius** (required host input under `**nextPointer.radialLine`**).
- If **r_outer ≤ r_inner**, generation **throws** (misconfigured outer radius relative to **R_frame**). **NextPointer** is omitted from the scene only when there is no qualifying next tide (derived).

#### Next circle

- The **Next circle** is a filled circle at the **outer** endpoint of the Next radial line:
  - **Centre** — the point at radius **r_outer** on the ray at **θ_next**.
  - **Radius** — **r_circle** = **σ·R_frame** (**σ** = **1/35**; **R_frame** from `**centreFrame.frameArcRadius`**; no host field on `**nextPointer`**).

## WaitArc

**WaitArc** is a top-level named element representing the waiting interval from
`timeNow` to the next tide marker on the same civil day.

### Logical structure

- **WaitArc** contributes one arc segment concentric with **RefArc**.
- Arrowhead rendering is **not** synthesized by diagram generation; when an
arrow is present, generation carries explicit metadata intent for an arc-end
arrow, and the downstream renderer is responsible for visual arrowhead
geometry.

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
- If the qualifying next tide marker exists, **WaitArc** geometry is emitted.
- Arrow metadata is omitted when the configured arrowhead would dominate the
rendered arc segment (see also **§Strict diagram input → Derived behaviour**).

### Arrow metadata

- **WaitArc** carries arrow metadata only; generator does not synthesize
arrowhead geometry.
- Arrow metadata is omitted by the arc-fit rule above (not by the
Now-line/Now-label 1-hour occlusion threshold).
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

## Time now readout

Two related **top-level** named elements (see **Diagram elements**) show local civil **date** and **clock time** derived from the host’s `**timeNowDatePrefix**` and global canonical `**timeNow**` (`**HH:MM:SS**`). They are positioned **relative to AnnularBand** and **TickLabels** as below (not from free-floating absolute `x`/`y` clock anchors).

### Shared inputs

- Diagram input object `**timeNowLabel`** — **required** plain object; finite numbers as **k·R** multiples (**§Sizing**):
  - `**fontHeight`** — **k_font·R**; used as **FontHeight** for **both** **TimeNowDate** and **TimeNowClock** leaves.
  - `**dateAboveTime`** — non-negative **k·R** gap: the **TimeNowDate** baseline is **`dateAboveTime·R`** **above** (+**Y**) the **TimeNowClock** baseline (same diagram-space **Y** convention as **§Origin**).
- Diagram input `**timeNowDatePrefix`** — required string for **TimeNowDate** text (customary short form such as `**Wed 21 Jun`**; may be empty after trim).

### Horizontal placement (both elements)

- Let **X_ann_max** be the **maximum diagram-space X** coordinate attained by the closed **AnnularBand** sector (outer/inner arcs and closing radial segments), for the band’s emitted geometry (same centre **O** as **RefArc**).
- **TimeNowDate** and **TimeNowClock** use **horizontal justification** **right**.
- The **trailing** (rightmost) anchor for the clock row is at **(X_ann_max, y_clock)** so the **TimeNowLabelSeconds** anchor **x** equals **X_ann_max**; **TimeNowLabelSecondsColon** and **TimeNowLabelHms** anchors sit to the left by the same fixed monospace width heuristic as before (**§Scene model** / preview framing).
- **TimeNowDate** uses the same **x** anchor as that trailing clock anchor (**X_ann_max**) so the date and clock are **right-aligned** to one another at the annular band’s **+X** bound.

### Vertical placement

- Let **y_tick_min** be the **minimum** `**anchor.y**` among all emitted **TickLabels** (same anchor convention as **TickLabels**).
- **TimeNowClock** — all three fragments share baseline **`y_clock = y_tick_min`** (exact numeric equality).
- **TimeNowDate** — baseline **`y_date = y_clock + dateAboveTime·R`**.

### Clock row text (TimeNowClock)

- Three **TextElement**s on one line (same **FontHeight** and **`y_clock`**):
  - **TimeNowLabelHms** — canonical `**HH:MM**` only (no date, no literal `" - "`).
  - **TimeNowLabelSecondsColon** — a single literal `**:`**.
  - **TimeNowLabelSeconds** — canonical `**SS`**.
- **Baseline polar angle** — **0** (**TextElement defaults**).

### Scene model

- **TimeNowDate** — one named group **TimeNowDate** containing one **TextElement** (leaf/style binding name **TimeNowDate**).
- **TimeNowClock** — named group **TimeNowClock** containing three child groups (stable leaf names for hosts that patch DOM text):
  - **TimeNowLabelHms** — **TextElement** (leaf name for style binding).
  - **TimeNowLabelSecondsColon** — **TextElement** (leaf name for style binding).
  - **TimeNowLabelSeconds** — **TextElement** (leaf name for style binding).

### Generator note

- **`spec.tickLabelHours`** must yield **at least one** tick label when this readout is used; otherwise **y_tick_min** is undefined and generation **throws** (empty tick-label arrays remain valid for other diagram modes only if the product never requests the time-now readout — the reference product always lists hours).

## TimeDelta

### TimeDelta placement

- **Countdown** — four stripes; stripe *i* uses `**timeDelta.countdownLines[i].belowOrigin`** and `**timeDelta.countdownLines[i].fontHeight`** (**k·R** each). **Anchor X** is **0** for every stripe.
- **Empty day** — three stripes: baselines and font heights for rows **0** and **1** from `**timeDelta.countdownLines[0]`** and `**countdownLines[1]`**; row **2** baseline from `**countdownLines[2].belowOrigin`** and **FontHeight** from `**emptyMessage.fontHeight`** (**k·R** each). **Anchor X** is **0** for each.

### Scene model

- Emitted as a named group **TimeDelta** (`**timeDelta`** input is required). When there is no next tide today, that group contains **TimeDeltaLocation**, **TimeDeltaPhase**, and **NoMoreTidesToday** (not **TimeDeltaNext**, **TimeDeltaNextTime**, or the four-stripe countdown layout).

### Copy and layout

- When a **next** marker exists on the civil day — **four** centre-justified **TextElement**s at distinct baselines (no interpuncts between stripes; vertical rhythm is intentional typography):
  1. **TimeDeltaLocation** — `**town**` from `**timeDelta.town**`; **FontHeight** **k·R** from `**countdownLines[0].fontHeight**`; **Anchor Y** **0 − countdownLines[0].belowOrigin·R**; **Horizontal justification** **centre**; **Baseline polar angle** **0**.
  2. **TimeDeltaPhase** — `**Tide <going out|coming in>**` from `**timeDelta.tidePhasePair**` (`"out-low"` → `going out`; `"in-high"` → `coming in`); geometry from `**countdownLines[1]**`.
  3. **TimeDeltaNext** — `**<Low tide|High tide> in <Hh Mm>**` where the low/high label matches the pair (`"out-low"` → `Low tide`; `"in-high"` → `High tide`); `<Hh Mm>` is derived from the interval to the next marker at or after `**timeNow`** on the same civil day; geometry from `**countdownLines[2]**`.
  4. **TimeDeltaNextTime** — `**at <HH:MM>**` where `<HH:MM>` is synthesized from the same next marker’s canonical time (seconds omitted); geometry from `**countdownLines[3]**`.
  - Host derivation policy for `**timeDelta.tidePhasePair**`:
    - Use adjacent retained tide extrema as ordered in civil-day time.
    - For a fully defined segment `**[event_i, event_{i+1})`**, compare heights:
      - if `**height_{i+1} > height_i`**, use `**"in-high"`**;
      - if `**height_{i+1} < height_i`**, use `**"out-low"`**.
    - For `**timeNow`** before the first retained event or after the last retained event, treat those as half-defined edge segments and resolve by alternating opposite to the nearest fully defined segment.
- **Atypical civil-day pattern** — `**timeDelta.atypicalTideSummary`** is a **required** boolean. When it is `**true**` and a next marker exists, the generator still emits **four** stripes (same geometry slots and leaf names), but **copy** is:
  1. **TimeDeltaLocation** — unchanged (`**town**`).
  2. **TimeDeltaPhase** — fixed product line: **Tricky tides today**.
  3. **TimeDeltaNext** — fixed product line: **Use the markers**.
  4. **TimeDeltaNextTime** — **empty string** (placeholder stripe; vertical tuning is a host/layout concern). No verbal next-interval or `**at HH:MM**` line in this mode. **NextPointer** and **WaitArc** behaviour is unchanged (see **Derived behaviour** above). When `**atypicalTideSummary`** is `**false**`, the typical countdown copy rules apply. `**atypicalTideSummary`** does **not** alter **NoMoreTidesToday** behaviour.
- **No next marker at or after `timeNow` on the civil day** (e.g. after the last tide; includes the case where every marker is strictly before `**timeNow`**) — **three** **TextElement**s (same leaf names and geometry keys as the first two countdown stripes, plus the tomorrow line):
  1. **TimeDeltaLocation** — `**town**` from `**timeDelta.town**`; **FontHeight** from `**countdownLines[0].fontHeight**`; **Anchor Y** **0 − countdownLines[0].belowOrigin·R**; **Horizontal justification** **centre**; **Baseline polar angle** **0**.
  2. **TimeDeltaPhase** — `**Tide <going out|coming in>**` from `**timeDelta.tidePhasePair**` (same mapping as the countdown case); geometry from `**countdownLines[1]**`.
  3. **NoMoreTidesToday** — fixed synthesis from `**timeDelta.tidePhasePair`**: `**Low tide tomorrow`** for `"out-low"` and `**High tide tomorrow`** for `"in-high"` (not a host override). **FontHeight** — **k·R** from `**emptyMessage.fontHeight**`; **Anchor Y** **0 − countdownLines[2].belowOrigin·R** (the interval stripe’s vertical slot; replaces the verbal interval and `**at HH:MM**` rows). **Horizontal justification** **centre**; **Baseline polar angle** **0**; **Anchor X** **0**.
- **Layout guidance:** choose each `**countdownLines[i].belowOrigin`** so baselines sit comfortably inside the chord region implied by **`centreFrame.frameArcRadius`** and the ref arc; **CentreFrame** and **TimeDelta** remain independent inputs (no automatic coupling in the generator).

## CentreFrame

**CentreFrame** is a named element whose output is **one closed circular segment**
(arc boundary plus straight chord closure). It is not defined relative to **TimeDelta**; geometry follows
**§Polar** and the inputs below.

### Scene model

- Emitted as a named group **CentreFrame** ( `**centreFrame`** input is required). The group contains one closed circular-segment primitive.

**Radius and endpoints**

- **R_frame** = **k·R** for diagram input **k** = `**centreFrame.frameArcRadius`** (**§Sizing**). The same **R_frame** is the **inner** radius of the **NowPointer** radial segment. The **NextPointer** filled-circle radius is **σ·R_frame** (**§NextPointer**).
- The arc uses the **same** centre **(0, 0)**, **sweep**, and angular orientation
as the **RefArc** (**§Polar**). The **only** geometric quantity that differs
from the **RefArc** is the circle radius (**R_frame** vs **RefRadius**).
- **θ_left** and **θ_right** are the polar angles of the leftmost and rightmost
endpoints of **this** arc at radius **R_frame** (same angular span as the **RefArc**).

**Closed segment boundary**

- The curved boundary is one arc at radius **R_frame**, with **θ_left** and **θ_right** as above.
- The arc endpoints are joined by one straight chord, yielding a closed region.
- Presentation applies both **fill** and **stroke** to this closed boundary.
- Product style uses the same fill tone as **AnnularBand** by default, while keeping the **CentreFrame** outline stroke independently configurable.

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
`**annularBand.annularBandWidth`** (**§Sizing**: linear quantity **k·R** with
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

- Diagram input object `**annularBand`** (see **Strict diagram input**): **required**;
`**annularBandWidth`** must be finite and **> 0** (**§Sizing** as above).

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
- Marker `**time = "24:00:00"`** is **invalid** and must fail generation (that sentinel is reserved for the RefArc right endpoint, not tide extremes).
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

- Define input `**tideMarkArrowDivergence`** — a non-negative angle in radians (host field on `**tideMarks`**).
- Define input `**tideMarkArrowLineLen`** — a non-negative float (**k·R** scale; host field on `**tideMarks`**).
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

