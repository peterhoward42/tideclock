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

### §Global layout bounds (single source of truth)

All edge references used by layout consumers MUST be read from this section.
Sections MUST NOT re-derive edge values from local geometry shortcuts.

Define conceptual variables:

- **B_left**, **B_right**, **B_bottom**, **B_top** — final diagram-space
  bounding edges.

Three-pass construction:

1) **Day-invariant baseline bounds**

- Let **AnnularBandBounds** be the axis-aligned bounds of emitted **AnnularBand**
  geometry.
- Set:
  - **B_left_base = AnnularBandBounds.left**
  - **B_right_base = AnnularBandBounds.right**
  - **B_bottom_base = AnnularBandBounds.bottom**
- Let **BossTop** be the top extent of **Hand.BossCircle**.
- Set **B_top_base = BossTop**.

2) **Day-variant marker expansion**

- For each emitted tide-marker cluster in **TideMarks** for the civil day,
  compute that cluster’s relevant extents (labels + pointer geometry in
  diagram-space).
- Expand each baseline edge if any marker exceeds it:
  - **B_left = min(B_left_base, marker-left extents...)**
  - **B_right = max(B_right_base, marker-right extents...)**
  - **B_bottom = min(B_bottom_base, marker-bottom extents...)**
  - **B_top = max(B_top_base, marker-top extents...)**

2b) **Diagram-wide extent (excluding BRHCBundle)**

- Generation then expands **B_left**, **B_right**, **B_bottom**, and **B_top** if
  needed so the axis-aligned bounds also contain:
  - the stroked **RefArc** (radius **RefRadius**, centre **O**, sweep from **θ_left** to **θ_right**),
  - the stroked **Dividor** arc (radius **`dividorArc.radiusK·RefRadius`**, same centre and sweep),
  - **TickLabels** (text bounds; monospace width heuristic consistent with other diagram text),
  - **Hand.TimeReadout** / **Hand.TimeReadoutSeconds** (rotated text along the **Hand**; see **§Hand time readout**).
- **BRHCBundle** is positioned using **B_right** and **B_bottom** from this pass (and pass **3**); each bundle row is **right**-justified to **B_right**. How those rows participate in later bounds accumulation in the reference generator is spelled out in **§BRHCBundle** (distinct from scene **`meta.previewFrame`**, which reflects all emitted primitives).
- **HomeMenuTrigger** is **not** part of the layout-bounds construction: its geometry **must not** expand **B_left**, **B_right**, **B_bottom**, or **B_top**. The tuple **(B_left, B_right, B_bottom, B_top)** is defined **without** reference to the menu control. The trigger may be placed using those edges (and may extend outside the resulting rectangle); hosts and generators **must not** fold the trigger’s axis-aligned bounds into framing or preview-rectangle logic.

3) **Layout bottom margin**

- Diagram input **`layoutBoundsBottomMargin`**: finite **k·R** multiplier (**§Sizing**),
  **≥ 0**; when omitted, **0** (see **Strict diagram input**).
- **B_bottom** is further extended **downward** along **§Axes** (toward smaller **Y**)
  by a fixed amount in all cases:
  - **B_bottom := B_bottom − layoutBoundsBottomMargin·RefRadius**
- **B_left**, **B_right**, and **B_top** are unchanged by this pass.

The tuple **(B_left, B_right, B_bottom, B_top)** after pass **3** is the global layout-bounds
contract for all dependent placements in this specification.

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

### §Global civil half-day layout

- Optional top-level diagram input **`civilHalfDayLayout`** — exact string, one of:
  - **`"auto"`** (default when the field is omitted) — any presentation rule in this specification that branches on **before noon** vs **after noon** uses the same condition as **`t_now`**: the **t_now ≤ 12** branch when **`t_now ≤ 12`**, else the **`t_now > 12`** branch (**t_now** per **§Global “time now” input**).
  - **`"beforeNoon"`** — force the **t_now ≤ 12** presentation branch everywhere this specification defines such a split, **regardless of** the numeric value of **`t_now`**.
  - **`"afterNoon"`** — force the **`t_now > 12`** presentation branch everywhere this specification defines such a split, **regardless of** **`t_now`**.
- **`civilHalfDayLayout` does not change** **`timeNow`**, **`t_now`**, **`θ_now`**, hand position along the dial, tide markers, **MainLabel** tide copy, or any semantics derived from the marker schedule. It affects **only** layout/presentation branches keyed to civil half-day (currently **Hand.TimeReadout** / **Hand.TimeReadoutSeconds** anchor offset and baseline rotation; additional elements MUST use this same input if they gain a half-day split later).

### Radial lines and radial segments

- A **radial line** (infinite) passes through **O** at a given polar angle
(**§Polar**, **§Origin**).
- A **radial segment** is the **line segment** on that ray between two polar
radii **r_inner** and **r_outer** (in model units). It has no inherent “direction
of travel.”
- Tick marks are defined as radial segments (**Tick marks**).

### Scene graph primitives (current scope)

- The scene graph at this stage consists of:
  - Arc primitives (for **RefArc** and **Dividor**)
  - Circle primitives (for **Hand.BossCircle** outlines)
  - Line segments (for radial segments and tick marks)
  - Text elements
  - One **closed path** for **TideMarks.TimePointer** (tip **Vertex1**, sides **Vertex1 → Vertex2** and **Vertex1 → Vertex3**, head arc **Vertex2 → Vertex3** as a single composite boundary; **fill** and **stroke** on that path; see **TimePointer**)
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
**TimePointer** when the host supplies a **fill** for that leaf).
- Where multiple curve primitives are **independent**, they are **topologically**
independent: **not** joined into one path, **not** merged into one composite
path, and **do not** form a closed region by composition in the logical scene
graph—even if a viewer perceives closure optically. Distinct primitives may
**coincide** at a point (e.g. at **O**) without becoming one logical path.
- **AnnularBand** and **TimePointer** are **not** covered by **Independent
stroked curves**: each is one closed region with unified **fill** and **stroke**
on its boundary (see those subsections).

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
does **not** apply silent numeric defaults for layout keys 

- Optional `**civilHalfDayLayout**` — see **§Global civil half-day layout**; invalid values are **errors**; when omitted, behaviour matches **`"auto"`**.
- Required `**brandFontHeight`** — finite **k·R** **> 0**; **FontHeight** for the fixed-content **Brand** line (**left** at **B_left**, baseline derived from **B_bottom** per **§HomeMenuTrigger** / reference generator).
- Required `**homeMenuTrigger**` — plain object: **`diameter`**, **`menuLeftPadding`**, **`menuAboveBrand`**, **`iconBarLength`**, **`iconBarGap`** — each a finite **k·R** number; **`diameter`** and **`iconBarLength`** must be **> 0**; **`menuLeftPadding`**, **`menuAboveBrand`**, and **`iconBarGap`** must be **≥ 0**. See **§HomeMenuTrigger**.
- Required `**tickLabelHours`** — non-empty array; each element must be an integer in **{0, 1, …, 24}** (otherwise an error). **TickLabel** rows are emitted for those hours in list order; the reference product lists **1..23**.

### Derived behaviour (civil day vs `timeNow`)

The **product** assumes at least **one** tide extreme on the civil day and a
**non-empty** `**tideMarks.markers`** list describing those extremes. 

When `**spec.semantic.nextTide`** is injected, layout may use it for next-tide timing
instead of scanning markers; `**tideMarks`** remains **required** for drawing **TideMarks**.
When `**spec.semantic.atypicalTideSummary`** is injected as boolean true, **MainLabel**
uses atypical summary copy (`**Tricky tides today**`) whenever a next event exists.

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


## 4. Scene model contracts (TB-4)

### Diagram elements

- The diagram has named elements. E.g.  - TickMarks and - TickLabels etc.

### Style binding names (exact-match contract)

- Style bindings are keyed by **exact** leaf element names.
- Name matching is **case-sensitive** and has **no aliasing** or fallback.
- A style binding name must match the emitted leaf element name byte-for-byte.
- This specification allocates leaf names **where the corresponding leaf is
mandated**; it does not maintain a separate exhaustive registry section.
- Optional role property **`fontWeight`**: when present on a bound role, must be **400** or **700**; hosts apply it to **text** primitives as SVG/CSS **`font-weight`**. When omitted, presentation uses the user agent default weight.

## 5. Element specs (TB-5)

### BRHCBundle

**BRHCBundle** is a **top-level** named group of the diagram root; that holds
three **horizontal** text rows, stacked **upward** along **+Y** from **B_bottom**:
tide summary (**MainLabel**), then host-supplied civil date text (**BRHCDate**),
then host-supplied place name (**BRHCLocation**). 

**Other Inputs** 

- `**brhcBundle**` — plain object with finite **`fontHeight`** (**k·R**, **§Sizing**): **FontHeight** shared by **MainLabel**, **BRHCDate**, and **BRHCLocation**

**Horizontal placement**: All three rows use **right** justification: each anchor
**x** is **B_right** from **§Global layout bounds** 

**Vertical placement**: Each of the rows receives its height above the bottom of
the diagram from a dedicated input - one per row.

### HomeMenuTrigger

**HomeMenuTrigger** is a **top-level** named group (**not** a child of **BRHCBundle**). Its geometry **must not** expand **§Global layout bounds** (**TB-2**); hosts **must not** fold its axis-aligned bounds into framing or preview-rectangle logic.

**Placement** (after **§Global layout bounds** passes **2b** and **3**):

- Let **`h_brand = brandFontHeight·R`**. Let **`y_brand`** be the **Brand** text baseline: **`y_brand = B_bottom + d_em·h_brand`**, where **`d_em`** is the descent heuristic used for diagram text (**≈ 0.2** in the reference generator), matching **Brand** **left** alignment at **`B_left`**.
- Let **`y_brand_top = y_brand + a_em·h_brand`** with the ascent heuristic **`a_em`** used elsewhere (**≈ 0.8** in the reference generator).
- Circular control diameter **`d = spec.homeMenuTrigger.diameter·R`**. **Leading** (left) edge at **`B_left + menuLeftPadding·R`**; centre **`x = B_left + menuLeftPadding·R + d/2`** (**`menuLeftPadding·R`** = **`spec.homeMenuTrigger.menuLeftPadding·R`**).
- **Bottom** of the circular control at **`y_brand_top + menuAboveBrand·R`**; centre **`y = y_brand_top + menuAboveBrand·R + d/2`** (**`menuAboveBrand·R`** = **`spec.homeMenuTrigger.menuAboveBrand·R`**).
- Hamburger icon bars: generator-derived from **`spec.homeMenuTrigger.iconBarLength`** and **`spec.homeMenuTrigger.iconBarGap`** (**k·R**).

**Scene model**

- Default deterministic **root** sibling order (when **`paintOrder`** is omitted) ends with **`…`**, **BRHCBundle**, **Brand**, **HomeMenuTrigger** so the control paints above **Brand** by default.
- **HomeMenuTrigger** — named group **HomeMenuTrigger** (**direct child** of the diagram root): one filled rounded square with **`rx = ry = diameter/2`** (circular silhouette) plus named subgroup **HomeMenuTriggerIcon** with three horizontal **line** primitives (hamburger). Style bindings use leaf group names **HomeMenuTrigger** and **HomeMenuTriggerIcon**.
- **Brand** — named group **Brand** (**direct child** of the diagram root): three **TextElement** leaves in nested leaf groups **`Brand.tides`**, **`Brand.separator`**, **`Brand.domain`** (exact names for **Style binding names**). Fixed copy: **`tides`**, then a middle-dot separator (**`·`**, U+00B7), then **`thetidedial.page`**. The word run and the domain run share the **alphabetic** baseline **`y_brand`** and **left**-justify in sequence from **`B_left`**: the separator uses **horizontal justification** **left** with a small gap (**k_gap·FontHeight** on each side of the dot in the reference generator) and **`dominant-baseline` `middle`**, with anchor **`Y`** at the vertical midpoint of the brand em-box (**≈ `y_brand + 0.3·FontHeight`** in the reference generator) so the dot sits at mid-height of the line. **Typography** (colour, **font-weight** **400** vs **700**, opacity) is supplied only via **semantic roles** bound to those leaf names, not via diagram input; the reference style model uses **700** for **`Brand.tides`** and **400** for **`Brand.separator`** and **`Brand.domain`**. SVG text accepts the same numeric **`font-weight`** presentation values as CSS (**400**, **700**).

### MainLabel

### MainLabel placement

- **MainLabel** is emitted as one **text** leaf in named group **MainLabel**, **child of** named group **BRHCBundle** (see **§BRHCBundle** scene model).
- **MainLabel** **FontHeight** is **`brhcBundle.fontHeight·RefRadius`** (same as the other **BRHCBundle** text rows; **§Sizing**).
- **MainLabel** uses horizontal justification **right**; trailing anchor **`x = B_right`** (see **§Horizontal placement (bundle rows)**).
- MainLabel baseline **`y_mainLabel`** per **§Vertical placement** (independent **Y** from other bundle rows).
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

### Input

- Diagram input object `**annularBand`** (see **Strict diagram input**): **required**;
`**annularBandWidth`** must be finite and **> 0** (**§Sizing** as above).

### Scene model

- Emitted as a named group **AnnularBand** containing the single closed-region
primitive (leaf-name matching follows **Style binding names (exact-match contract)**;
concrete `styleName` values are **not** fixed in this specification).

### Dividor

**Dividor** is a top-level named element: one **independent stroked arc** (**Independent stroked curves**) concentric with the **RefArc**.

### Input

- Diagram input object `**dividorArc**` (see **Strict diagram input**): **required**; `**radiusK`** must be finite and strictly **> 0** (**§Sizing**). Model radius = **`radiusK·RefRadius`**.

### Geometry

- **Centre** — **O** (same as **RefArc**, **§Origin**).
- **Sweep** — same subtended angle and CCW orientation as **RefArc** (**§Polar**): from **θ_left** at the left endpoint to **θ_right** at the right endpoint.
- **Radius** — **`dividorArc.radiusK·RefRadius`** (not necessarily equal to **RefRadius**).

### Scene model

- Emitted as a named group **Dividor** containing one **arc** primitive (leaf-level style binding name **Dividor** per **Style binding names (exact-match contract)**).

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
- Generated only for hours listed in **`tickLabelHours`** (integers in **{0, 1, …, 24}**). The reference diagram labels **1..23** only (see **Strict diagram input** for **`tickLabelHours`**).
- Anchor: start at the **outer** end of the associated tick, then:
  - add a polar offset: angle = tick’s **θ(t)**, length = **k·R** (**§Sizing**);
  - add Cartesian offset **(0, −0.5 × FontHeight)**.

### TideMarks

**TideMarks** define tide-marker clusters under **Diagram elements**. 

### Count and time association

- Marker count **N** comes from host input.
- Each marker provides canonical `**time`** in `**HH:MM:SS`**.
- Parse marker `**time`** per **§Time and θ(t)** to derive **t** and **θ(t)**.
- Marker-time validity and duplicate-time failures follow **Strict diagram input**.
- Each marker carries `**highOrLow ∈ {"High", "Low"}`** for derived event
  descriptions (see **MainLabel**).

### Logical structure

Each marker emits one cluster with direct children:

- **Height label** — one **arcText** primitive (tide height along a circular path at label radius; see layout below).
- **Time pointer** — one **TimePointer** subgroup (below).

### Height label (layout)

- **Label radius** from **O**: `**<TideLabelRadius>·R`** (same concentric circle for all markers).
- The string follows that circle (per-glyph tangential layout; **arcText** in the scene model). **Horizontal justification along the arc** is **center**: the **angular midpoint** of the glyph run lies on the marker radial **θ(t)** (the same angle as **TimePointer** vertex **Vertex1** on the RefArc).
- Implementation equivalence: choose a CCW angular span **sweep** for the string from estimated chord length and font size; place the span so **θ(t)** bisects it (start angle **θ(t) − sweep/2** on the label circle when **sweep** is positive CCW).
- **FontHeight** (**k·R**): height label uses `**<TideHeightLabelSize>`·R**.
- **Text**: height label content is from the host (`**heightText`**). Marker `**time`** is not rendered on the marker cluster; it is used for **θ(t)**
- Other **Text Element** rules apply where they match **arcText** emission unless overridden above.

### TimePointer

**TimePointer** is the tide marker pointer (map-pin silhouette). **Construction**
(vertices and head circle) is unchanged; scene emission is one **closed path**
with the same boundary as the former trio of two **line** primitives and one
**arc** primitive.

**Construction** (defines vertices and head circle):

- `**tideMarkArrowDivergence`**: non-negative radians (host field on
  `**tideMarks`**).
- `**tideMarkArrowLineLen`**: non-negative float (**k·R** scale; host field on
  `**tideMarks`**).
- `**tideMarkOuterBandGap`**: optional signed float (**k·R**; host field on
  `**tideMarks`**; default **0** when omitted). **Vertex1** lies on the marker radial at polar angle **θ(t)** at radius **`(1 + AnnularBandWidth + tideMarkOuterBandGap) × RefRadius`** (**§Sizing**). The **AnnularBand** outer boundary is **`(1 + AnnularBandWidth) × RefRadius`**: negative values inset **Vertex1** toward **O** (clearance from the outer boundary); positive values place **Vertex1** outside that boundary.
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

**Scene emission** (single closed path; boundary identical to the former
independent **line**/**line**/**arc** trio):

- Subpath: **Vertex1** → **Vertex2** → circular arc **Vertex2** → **Vertex3**
  → close to **Vertex1**.
- Head arc: centre **centre**, radius **radius**, endpoints **Vertex2** and
  **Vertex3**, choosing the arc that does **not** contain **Vertex1** in its
  interior (the head cap on the opposite side of chord **Vertex2–Vertex3** from
  **Vertex1**). Equivalently, choose the **Vertex2**-to-**Vertex3** arc that
  does not pass through **Vertex1**.

**Presentation:** **TimePointer** uses leaf-style **stroke** color from the
bound role. **Fill** is **none** unless the host sets an explicit **fill** colour
on that **TimePointer** leaf’s style role (**fillColor**); the outline shape is
unchanged either way. Hosts may set `stroke-linecap`/`stroke-linejoin` on the
**TimePointer** group so the path meets cleanly at **Vertex1**, **Vertex2**, and
**Vertex3** (product default: round caps/joins).

### Hand

**Hand** is a top-level named element tied to global `**timeNow`** via
`**θ_now`** (**§Global "time now" input**). 

### Scene model

- Emitted as a named group **Hand** (`**hand`** input is required).
- **BossCircle** — named group containing one stroked **circle** (see below).
- **Arm** — named group containing:
  - the stroked radial **line** segment (**Arm** geometry below), and
  - **Hand.TimeReadout** / **Hand.TimeReadoutSeconds** — clock readout along the arm (see below).
- **Hand** curve primitives (**BossCircle** outline, **Arm** segment) are stroked only; **fill** is **none**.
- **Arm** should render with a slightly wider stroke width than the default diagram stroke.

### BossCircle

- Center at **O** (`(0,0)`).
- Radius: `**hand.bossCircleRadius · RefRadius`**.

### Radial segments

- **Arm** is colinear with the `**θ_now`** ray.
- Let:
  - `**r_arm_outer = RefRadius − hand.armRefArcGap · RefRadius**`
  - `**r_boss = hand.bossCircleRadius · RefRadius**`
- Segment radii:
  - **Arm** — from `**r_boss`** to `**r_arm_outer`** (outer end is on the **RefArc** radius when `**hand.armRefArcGap = 0`**; positive gap shortens the segment so it stops just short of the **RefArc**).
- Validation: generation fails if radial ordering is invalid at emission time
  (specifically, require `**r_boss < r_arm_outer**`).

### Hand time readout (`Hand.TimeReadout` / `Hand.TimeReadoutSeconds`)

A single visual line of the global canonical
**`timeNow`** (**`HH:MM:SS`**, **§Global “time now” input** / **§Time and
θ(t)**), positioned along the **Hand** so it moves with **`θ_now`**, emitted as
**two** sibling named groups (each with one **text** primitive) so hosts may bind
styles per leaf: **`Hand.TimeReadout`** carries **`HH:MM:`** and
**`Hand.TimeReadoutSeconds`** carries **`SS`**.

- Required diagram input **`hand.armTimeLabelFontHeight`**: finite dimensionless **k > 0** (**§Sizing**). **FontHeight** is **`hand.armTimeLabelFontHeight · RefRadius`**. This is independent of **TickLabel** sizing; it applies to **both** readout texts (identical **font-size** unless a host overrides via style).
- **Text** — concatenation of the two leaves reproduces the canonical **`timeNow`** string (second resolution; no reformatting beyond what the host supplies in that canonical form).
- **Horizontal justification** — **centre** on the rotated baseline for each **text**; anchors are offset along the advance direction so the pair’s combined centroid matches the nominal single-line placement (monospace **0.6 em** per code unit width heuristic, consistent with diagram-wide text bounds).
- Anchor placement uses the midpoint of the **Arm** segment (between **`r_boss`** and **`r_arm_outer`**, **§Radial segments**), then shifts by **0.05·RefRadius** along the **RefArc** tangent at **`θ_now`** that points toward **decreasing θ** (earlier clock time along the arc) when the **before-noon** presentation branch applies, and **opposite** that tangent when the **after-noon** branch applies. With **`civilHalfDayLayout = "auto"`**, the before-noon branch is **`t_now ≤ 12`** and the after-noon branch is **`t_now > 12`** (**t_now** per **§Global “time now” input**). With **`"beforeNoon"`** or **`"afterNoon"`**, the branch is forced per **§Global civil half-day layout** without changing **`θ_now`**.
- **Baseline rotation** (radians, same convention as other rotated diagram **text**): **`θ_now + π`** on the **before-noon** branch, else **`θ_now`**, so the string runs along the arm with a consistent reading sense across morning and afternoon. Branch selection matches the preceding bullet (**§Global civil half-day layout** when not **`"auto"`**).
- **Dominant baseline** — **middle** (anchor is the nominal centre of the line’s em box in the host).
