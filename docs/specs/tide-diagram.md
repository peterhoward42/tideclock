# Specification for a tide diagram

## 1. Role and boundaries (TB-1)

To specify a specific diagram in terms of a scene graph and input parameters.

### Host responsibilities

The **diagram generator** defines deterministic scene-child order and supports
an optional, constrained paint-order override seam (`paintOrder.overrides`) so
specific named groups can be moved **before**/**after** siblings. This
specification does **not** introduce a global numeric z-index model.
**Named elements** (see **Diagram elements**) remain the contract for targeted
ordering and style behavior by exact name.

Where this specification mentions text or numeric inputs “from outside” or
“from the host,” value supply and policy are host responsibilities. How final
rendered bounds map into canvas, viewport, or layout is also **not** fixed
here.

## 2. Core conventions (TB-2)

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
- **MainLabel** is a horizontal **TextElement** with **left** justification.
  Its **content** is one synthesized line:
  `**Next tide extreme tomorrow**` when no marker exists at or after `**timeNow`**
  on the same civil day; otherwise `**Tricky tides today**` when
  `**spec.semantic.atypicalTideSummary = true`**; otherwise
  `**<Low|High> tide at <HH:MM>**`. Low/high and event clock text are derived
  from the next event computed from marker schedule and canonical time parsing
  (see **TideMarks**, **§Time and θ(t)**).

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

### Radial lines and radial segments

- A **radial line** (infinite) passes through **O** at a given polar angle
(**§Polar**, **§Origin**).
- A **radial segment** is the **line segment** on that ray between two polar
radii **r_inner** and **r_outer** (in model units). It has no inherent “direction
of travel.”
- Tick marks are defined as radial segments (**Tick marks**).

### Scene graph primitives (current scope)

- The scene graph at this stage consists of:
  - Arc primitives (for **RefArc** and **TideMarks.TimePointer** head arcs)
  - Circle primitives (for **Hand.BossCircle** outlines)
  - One closed circular segment path (for **CentreFrame**: circular arc + straight chord closure)
  - Line segments (for radial segments and tick marks)
  - Text elements
  - **Line** segments and **arc** segments for **TideMarks.TimePointer** (two equal sides of the pointer triangle as strokes, head as a circular arc; **fill** is **none**)
  - One **closed annular sector** path (**fill** and **stroke** on the composite
  boundary) introduced by **AnnularBand** (see **AnnularBand**)

### Independent stroked curves

- **Line** and **arc** primitives are **one-dimensional** curves in the logical
model. They are **stroked** along the curve and, for now, **never** treated as
**filled** regions.
- **Circle** primitives are also one-dimensional stroked curves in the same sense
  (full 2π circular outlines; **fill** is none unless a subsection explicitly
  overrides).
- Area fills are represented by dedicated closed-region primitives (currently:
**CentreFrame** closed circular segment and **AnnularBand** annular sector).
- Where multiple curve primitives are **independent**, they are **topologically**
independent: **not** joined into one path, **not** merged into one composite
path, and **do not** form a closed region by composition in the logical scene
graph—even if a viewer perceives closure optically. Distinct primitives may
**coincide** at a point (e.g. at **O**) without becoming one logical path.
- Subgroups that emit several curves (e.g. **TimePointer**) satisfy **Independent
stroked curves** unless a subsection adds detail.
- **AnnularBand** is **not** covered by **Independent stroked curves**: it is one
closed region with unified **fill** and **stroke** on its boundary (**AnnularBand**).

### Text Element

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

## 3. Global contract (TB-3)

### Strict diagram input (generator)

The generator **throws** when required host fields are missing or wrong-type; it
does **not** apply silent numeric defaults for layout keys (`buildDiagram.mjs`
and layout submodules). Invalid marker rows (including marker `**24:00:00`**),
degenerate geometry inputs (for example wait-arc radius **<= 0**), and missing
required objects (including `**timeNowLabel**`, `**timeNowLocation**`,
`**timeNowDatePrefix**`, and `**annularBand`**) are **errors**, not
"omit-this-element" fallbacks.

### Derived behaviour (civil day vs `timeNow`)

The **product** assumes at least **one** tide extreme on the civil day and a
**non-empty** `**tideMarks.markers`** list describing those extremes. The
open-ended time-navigation case is when there is **no** marker at or after
`**timeNow`** on that day (for example, after the last tide): **MainLabel**
content becomes `**Next tide extreme tomorrow**`. This branch is derived from
`**timeNow`** and the marker schedule; it is **not** triggered by missing spec
fields.

When `**spec.semantic.nextTide`** is injected, layout may use it for next-tide timing
instead of scanning markers; `**tideMarks`** remains **required** for drawing **TideMarks**.
When `**spec.semantic.atypicalTideSummary`** is injected as boolean true, **MainLabel**
uses atypical summary copy (`**Tricky tides today**`) whenever a next event exists.

- `**canvas`** — object with finite `**width`** and `**height`** (px).
- `**title**` — string (diagram meta).
- `**paintOrder`** — optional plain object.
  - Optional `**overrides`** array.
  - Each override must be a plain object with:
    - `**name`** — non-empty string (named scene group to move),
    - `**place`** — exact string `**"before"`** or `**"after"`**,
    - `**relativeTo`** — non-empty string (sibling named group target).
  - Validation:
    - `**name !== relativeTo`**,
    - duplicate overrides for the same `**name`** are errors,
    - referenced names must exist in the generated scene tree,
    - each override must resolve to one unique sibling relationship in the scene tree,
    - cyclic constraints are errors.
  - Default behaviour when omitted: preserve current deterministic scene-child order.
- `**refRadius**`, `**sweepRad**`, `**tickLabelTickLen**`, `**tickLabelSize**`, `**tickLabelClearance**` — finite numbers (**k·R** or px as documented per key). `**tickLabelTickLen`** must be **> 0** and **strictly less** than `**annularBand.annularBandWidth`**.
- `**insideTrackRadius`** — finite number (**k·R**): radius of **InsideTrack** is **InsideTrackRadius × RefRadius**. Must be **> 0**. Same centre **O**, **θ_left**, and CCW sweep as **RefArc** (see **§Polar**, **InsideTrack**).
- `**tickLabelHours`** — array; each entry must be an integer in **0..24** (inclusive). An empty array is valid (explicit “no tick labels” for listed hours).
- `**tideMarks`** — **required** plain object with **non-empty** `**markers`** array. Each marker row must supply string `**heightText`**, `**highOrLow ∈ {"High","Low"}`**, and canonical `**time`** per **§Time and θ(t)** (including reserved-sentinel policy). These finite numbers are required on `**tideMarks`**: `**tideHeightLabelRadius**`, `**tideTimeLabelRadius**`, `**tideHeightLabelSize**`, `**tideTimeLabelSize**`, `**tideMarkArrowDivergence**`, `**tideMarkArrowLineLen**`. Duplicate canonical marker times are errors.
- `**hand`** — **required** plain object for the top-level **Hand** element: finite `**bossCircleRadius`** (**k·R**, strictly **> 0**). Generation fails if hand-derived radial ordering is invalid (see **Hand**, **Radial segments**).
- `**timeNowLabel`** — **required** plain object; finite `**fontHeight**` and `**dateAboveTime**` (k·R multiples; see **Time now readout**). Together with required strings `**timeNowLocation**` and `**timeNowDatePrefix**`, drives **TimeNowLocation**, **TimeNowDate**, and **TimeNowClock**.
- `**centreFrame`** — **required** plain object; finite `**frameArcRadius`** (**k·R**). Defines **R_frame** = **k·R** for the **CentreFrame** arc (**§CentreFrame**). Uses top-level `**refRadius`** and `**sweepRad`** (required above).
- `**annularBand**` — **required** plain object; `**annularBandWidth`** must be a finite **k·R** multiplier **> 0** (**AnnularBandWidth·RefRadius** is the band thickness). **AnnularBandWidth ≤ 0** is an error.
- `**homeMenuTrigger`** — **required** plain object for the home-route instrument trigger: finite `**width`**, `**height`**, and `**cornerRadius`** (each **k·R**, strictly **> 0**), with `**cornerRadius**` ≤ **min(width,height)/2** (so the rounded rectangle is valid); finite `**labelSize`** (**k·R**, strictly **> 0**); finite `**gapAboveMainLabel`** (**k·R**, **≥ 0**); and string `**label`** (product default `**Menu**`). Position is derived from diagram content bounds: the trigger’s left edge is anchored to the leftmost tick-label bound, and its bottom edge is anchored above **MainLabel** top by `**gapAboveMainLabel·RefRadius`**. Layout emits a **roundedRect** and centred **label** at that derived position (see **HomeMenuTrigger** under diagram elements).

## 4. Scene model contracts (TB-4)

### Diagram elements

- The diagram has named elements:
  - TickMarks
  - TickLabels
  - TideMarks
  - Hand (group; leaves are **BossCircle**, **Arm**)
  - TimeNowLocation (single **TextElement**; current location name from the host)
  - TimeNowDate (single **TextElement**; civil date prefix from the host)
  - TimeNowClock (group; style-bound leaves are **TimeNowLabelHms**, **TimeNowLabelSecondsColon**, and **TimeNowLabelSeconds** — canonical `HH:MM`, the colon before `SS`, and `SS`)
  - CentreFrame
  - AnnularBand
  - InsideTrack
  - MainLabel (single horizontal left-justified text element; content synthesized from the next tide event at or after `**timeNow`** on the same civil day)
  - RefArc
  - HomeMenuTrigger (named group: **roundedRect** with **width**, **height**, and **cornerRadius** (k·R); center is derived from content bounds so the rectangle left edge aligns to the leftmost tick-label bound and rectangle bottom edge sits above **MainLabel** top with a fixed gap; **HomeMenuTriggerLabel** carries the **label** at that same centre with vertical alignment chosen so the cap height is centred in the control)

### Style binding names (exact-match contract)

- Style bindings are keyed by **exact** leaf element names.
- Name matching is **case-sensitive** and has **no aliasing** or fallback.
- A style binding name must match the emitted leaf element name byte-for-byte.
- This specification allocates leaf names **where the corresponding leaf is
mandated**; it does not maintain a separate exhaustive registry section.

## 5. Element specs (TB-5)

### Time now readout

Three related **top-level** named elements (see **Diagram elements**) show host-local **location name**, host-local civil **date**, and **clock time** derived from `**timeNowLocation**`, `**timeNowDatePrefix**`, and global canonical `**timeNow**` (format/parsing per **§Time and θ(t)**). They are positioned **relative to AnnularBand** and **TickLabels** as below (not from free-floating absolute `x`/`y` clock anchors).

### Shared inputs

- Diagram input object `**timeNowLabel`** — **required** plain object; finite numbers as **k·R** multiples (**§Sizing**):
  - `**fontHeight`** — **k_font·R**; used as **FontHeight** for **TimeNowLocation**, **TimeNowDate**, and **TimeNowClock** leaves.
  - `**dateAboveTime`** — non-negative **k·R** gap: the **TimeNowLocation** baseline is **`dateAboveTime·R`** **above** (+**Y**) the merged **(TimeNowDate + TimeNowClock)** baseline (see **§Vertical placement** below).
- Diagram input `**timeNowLocation`** — required string for **TimeNowLocation** text (current location name; may be empty after trim).
- Diagram input `**timeNowDatePrefix`** — required string for **TimeNowDate** text (customary short form such as `**Wed 21 Jun`**; may be empty after trim).

### Horizontal placement (both elements)

- Let **X_ann_max** be the **maximum diagram-space X** coordinate attained by the closed **AnnularBand** sector (outer/inner arcs and closing radial segments), for the band’s emitted geometry (same centre **O** as **RefArc**).
- **TimeNowLocation**, **TimeNowDate**, and **TimeNowClock** use **horizontal justification** **right**.
- The **trailing** (rightmost) anchor for the clock row is at **(X_ann_max, y_clock)** so the **TimeNowLabelSeconds** anchor **x** equals **X_ann_max**; **TimeNowLabelSecondsColon** and **TimeNowLabelHms** anchors sit to the left by the same fixed monospace width heuristic as before (**§Scene model** / preview framing).
- **TimeNowDate** is shifted left so that its right edge stops before the clock and a fixed separator gap (implemented as spacing equal to several monospace character widths), producing a merged “date + time” single visual row.
- **TimeNowLocation** uses the same **x** anchor as the annular band’s **+X** bound (so the location remains right-aligned to the full readout).

### Vertical placement

- Let **y_tick_min** be the **minimum** `**anchor.y**` among all emitted **TickLabels** (same anchor convention as **TickLabels**).
- **TimeNowClock** — all three fragments share baseline **`y_clock = y_tick_min`** (exact numeric equality).
- **TimeNowDate** — baseline **`y_date = y_clock`** (same row as the clock).
- **TimeNowLocation** — baseline **`y_location = y_clock + dateAboveTime·R + fontHeight·R`**.

### Clock row text (TimeNowClock)

- Three **TextElement**s on one line (same **FontHeight** and **`y_clock`**):
  - **TimeNowLabelHms** — canonical `**HH:MM**` only (no date, no literal `" - "`).
  - **TimeNowLabelSecondsColon** — a single literal `**:`**.
  - **TimeNowLabelSeconds** — canonical `**SS`**.
- **Baseline polar angle** — **0** (**TextElement defaults**).

### Scene model

- **TimeNowLocation** — one named group **TimeNowLocation** containing one **TextElement** (leaf/style binding name **TimeNowLocation**).
- **TimeNowDate** — one named group **TimeNowDate** containing one **TextElement** (leaf/style binding name **TimeNowDate**).
- **TimeNowClock** — named group **TimeNowClock** containing three child groups (stable leaf names for hosts that patch DOM text):
  - **TimeNowLabelHms** — **TextElement** (leaf name for style binding).
  - **TimeNowLabelSecondsColon** — **TextElement** (leaf name for style binding).
  - **TimeNowLabelSeconds** — **TextElement** (leaf name for style binding).

### Generator note

- **`spec.tickLabelHours`** must yield **at least one** tick label when this readout is used; otherwise **y_tick_min** is undefined and generation **throws** (empty tick-label arrays remain valid for other diagram modes only if the product never requests the time-now readout — the reference product always lists hours).

### MainLabel

### MainLabel placement

- **MainLabel** is emitted as one **text** leaf in named group **MainLabel**.
- Font height is fixed by the generator at **0.045·RefRadius**.
- **MainLabel** uses horizontal justification **left**.
- Let **x_tick_min** be the leftmost rendered X bound among **TickLabels**
  (same width heuristic used for other text-derived bounds).
- Let **y_tick_min** be the minimum `**anchor.y**` among **TickLabels**.
- MainLabel anchor is `**(x_tick_min, y_tick_min)`**.
- Baseline polar angle is **0** (horizontal baseline in diagram space).

### MainLabel copy synthesis

- Source data is the marker schedule (`**tideMarks.markers`**) plus canonical
  `**timeNow`** and optional semantic override `**spec.semantic.atypicalTideSummary`**.
- Compute the next tide event at or after `**timeNow`** on the same civil day.
- If no next event exists, **MainLabel** content is:
  `**Next tide extreme tomorrow**`.
- Else if `**spec.semantic.atypicalTideSummary = true`**, **MainLabel** content is:
  `**Tricky tides today**`.
- Else (next event exists and atypical summary is not true), **MainLabel** content is:
  `**<Low|High> tide at <HH:MM>**`.
- No separate host-provided content field exists for **MainLabel**.

### CentreFrame

**CentreFrame** is a named element whose output is **one closed circular segment**
(arc boundary plus straight chord closure). Geometry follows **§Polar** and the
inputs below.

### Scene model

- Emitted as a named group **CentreFrame** ( `**centreFrame`** input is required). The group contains one closed circular-segment primitive.

**Radius and endpoints**

- **R_frame** = **k·R** for diagram input **k** = `**centreFrame.frameArcRadius`** (**§Sizing**).
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

### AnnularBand

**AnnularBand** is a top-level named element: the closed region between two
concentric arcs that share the **RefArc** centre **O**, sweep, and angular
orientation (**§Polar**), with radial closures at **θ_left** and **θ_right**.

### Geometry

- **Inner boundary**: coincident with **RefArc** (radius **RefRadius**, centre
  **O**, from **θ_left** to **θ_right** with the same CCW sweep).
- **Outer boundary**: same centre and angles, radius **RefRadius + w**, where
  `**w = AnnularBandWidth·RefRadius`** and
  `**AnnularBandWidth = annularBand.annularBandWidth`** (**§Sizing**, linear
  **k·R**).
- **End closures**: radial segments at **θ_left** and **θ_right**, each between
  radii **RefRadius** and **RefRadius + w**.

Together these four edges form one **closed** region (an **annular sector**).

### Logical model and presentation

- **AnnularBand** is one drawable with both **fill** and **stroke** on its full
  closed boundary (inner arc, outer arc, radial closures).
- **RefArc** remains a separate top-level stroked arc with unchanged geometry
  (coincident with the AnnularBand inner edge).
- Paint order remains a host responsibility (**Host responsibilities**). For the
  intended visual override at the shared inner curve, paint **RefArc** after
  **AnnularBand** so **RefArc** stroke wins there.

### Input

- Diagram input object `**annularBand`** (see **Strict diagram input**): **required**;
`**annularBandWidth`** must be finite and **> 0** (**§Sizing** as above).

### Scene model

- Emitted as a named group **AnnularBand** containing the single closed-region
primitive (leaf-name matching follows **Style binding names (exact-match contract)**;
concrete `styleName` values are **not** fixed in this specification).

### Tick marks

- A tick mark is a (typically short) **radial segment** (**Radial lines and
radial segments**) on the ray at **θ(t)** (**§Time and θ(t)**).
- Inner radius is always **1.0·R**.
- Outer radius depends on whether hour **t** is in `**tickLabelHours`**:
  - For **general** (non-labelled) hours, tick length is **locked by definition** to **AnnularBand** thickness:
    `**k_general = annularBand.annularBandWidth`** and outer radius **(1.0 + k_general)·R**.
  - For **labelled** hours (those that emit **TickLabel**), tick length uses
    input `**tickLabelTickLen`** (`**k_label`**) and outer radius **(1.0 + k_label)·R**.
- Constraint: `**0 < tickLabelTickLen < annularBand.annularBandWidth`**.

### Placement

- One tick per integer hour **t ∈ {0, 1, 2, …, 24}**.
- Each at polar angle **θ(t)**.
- **t = 0** and **t = 24** are **distinct** ticks at the two RefArc endpoints.

### TickLabel

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

### TideMarks

**TideMarks** define tide-marker clusters under **Diagram elements**. Layering
and paint order remain host-managed (**Host responsibilities**); this spec fixes
names and geometry, not global z-order.

### Count and time association

- Marker count **N** comes from host input.
- Each marker provides canonical `**time`** in `**HH:MM:SS`**.
- Parse marker `**time`** per **§Time and θ(t)** to derive **t** and **θ(t)**.
- Marker-time validity and duplicate-time failures follow **Strict diagram input**.
- Each marker carries `**highOrLow ∈ {"High", "Low"}`** for derived event
  descriptions (see **MainLabel**).

### Logical structure

Each marker emits one cluster with direct children:

- **Height label** — one **TextElement**.
- **Time label** — one **TextElement**.
- **Time pointer** — one **TimePointer** subgroup (below).

### Height label and time label (layout)

For **both** labels:

- **Horizontal justification** — **centre**.
- On the marker polar axis from **O** at per-kind radius inputs (**§Sizing**):
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

**TimePointer** is the tide marker pointer (map-pin silhouette). Geometry is
unchanged; scene emission is stroke-only (**no fill** on pointer primitives).

**Construction** (unchanged; defines vertices and head circle):

- `**tideMarkArrowDivergence`**: non-negative radians (host field on
  `**tideMarks`**).
- `**tideMarkArrowLineLen`**: non-negative float (**k·R** scale; host field on
  `**tideMarks`**).
- **Vertex1** is the point on the RefArc corresponding to time **t**.
- **halfAngle** is **0.5 × tideMarkArrowDivergence**
- **Vertex2** is located with a polar offset from Vertex1:
  - **R:** **tideMarkArrowLineLen × RefRadius**
  - **theta:** RadialAngle(t) + π + halfAngle
- **Vertex3** is located with a polar offset from Vertex1:
  - **R:** **tideMarkArrowLineLen × RefRadius**
  - **theta:** RadialAngle(t) + π − halfAngle
- Let **line1** = segment **Vertex1 → Vertex2** and **line2** =
  **Vertex1 → Vertex3** (the equal sides of isosceles triangle
  **Vertex1, Vertex2, Vertex3**).
- Let **radial1** be the line through **Vertex2** perpendicular to **line1**,
  and **radial2** the line through **Vertex3** perpendicular to **line2**.
- Let **centre** = the intersection of **radial1** and **radial2**.
- Let **radius** = the distance from **centre** to **Vertex2** (equals distance to **Vertex3**; **Vertex1, Vertex2, Vertex3** lie on this circle).

**Scene emission** (outline silhouette equivalent to the former filled
triangle-plus-disk rendering):

- Two **line** primitives: **Vertex1 → Vertex2** and **Vertex1 → Vertex3** (**stroke** only).
- One **arc** primitive: circular arc from **Vertex2** to **Vertex3** with
  centre **centre** and radius **radius**, choosing the arc that does **not**
  contain **Vertex1** in its interior (the head cap on the opposite side of
  chord **Vertex2–Vertex3** from **Vertex1**). Equivalently, choose the
  **Vertex2**-to-**Vertex3** arc that does not pass through **Vertex1**.

**Presentation:** **TimePointer** uses leaf-style **stroke** color and no fill.
Hosts may set `stroke-linecap`/`stroke-linejoin` so curves meet cleanly at
**Vertex1**, **Vertex2**, and **Vertex3** (product default: round caps/joins).

### Hand

**Hand** is a top-level named element tied to global `**timeNow`** via
`**θ_now`** (**§Global "time now" input**). `paintOrder.overrides` addresses the
exact group/leaf names listed here.

### Scene model

- Emitted as a named group **Hand** (`**hand`** input is required).
- Direct leaves:
  - **BossCircle** — stroked circle.
  - **Arm** — stroked radial line segment.
- **Hand** primitives are stroked only; **fill** is **none**.
- **Arm** should render with a slightly wider stroke width than the default diagram stroke.

### Paint-order example

Hosts can target Hand leaves directly for ordering (for example, placing **Arm**
before **BossCircle**):

```json
{
  "paintOrder": {
    "overrides": [
      { "name": "Arm", "place": "before", "relativeTo": "BossCircle" }
    ]
  }
}
```

### BossCircle

- Center at **O** (`(0,0)`).
- Radius: `**hand.bossCircleRadius · RefRadius`**.

### Radial segments

- **Arm** is colinear with the `**θ_now`** ray.
- Let:
  - `**r_track = insideTrackRadius · RefRadius**`
  - `**r_boss = hand.bossCircleRadius · RefRadius**`
- Segment radii:
  - **Arm** — from `**r_boss`** to `**r_track`**.
- Validation: generation fails if radial ordering is invalid at emission time
  (specifically, require `**r_boss < r_track**`).

## 6. Behavioral branches (TB-6)

Branch behavior is specified in:

- `Derived behaviour (civil day vs timeNow)` under `3. Global contract (TB-3)`
- `MainLabel` under `5. Element specs (TB-5)`

## 7. Interpretation and deferred topics (TB-7)

### Notes on interpretation

- Standard mathematical conventions for polar coordinates and angles apply (**§Polar**).
- Where ambiguity remains, implementations may follow common conventions consistent with the above.

### TODO (deferred)

- collisions
- truncations

