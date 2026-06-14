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

- The bounding box of the diagram is modeled as four conceptual variables: 
B_left, B_right, B_top, and B_bottom.
- These are initialised to accomodate the AnnularBand.
- Then B_top is overwritten with the max_y point of the Hand.BossCircle
- The box is then extended if necessary to accomodate any part of each TideMarker
- Then B_bottom is extended incrementally by the layoutBoundsBottomMargin * RefRadius

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

- Optional top-level diagram input `**civilHalfDayLayout`** — exact string, one of:
  - `**"auto"**` (default when the field is omitted) — any presentation rule in this specification that branches on **before noon** vs **after noon** uses the same condition as `**t_now`**: the **t_now ≤ 12** branch when `**t_now ≤ 12`**, else the `**t_now > 12**` branch (**t_now** per **§Global “time now” input**).
  - `**"beforeNoon"`** — force the **t_now ≤ 12** presentation branch everywhere this specification defines such a split, **regardless of** the numeric value of `**t_now`**.
  - `**"afterNoon"**` — force the `**t_now > 12**` presentation branch everywhere this specification defines such a split, **regardless of** `**t_now`**.
- `**civilHalfDayLayout` does not change** `**timeNow`**, `**t_now**`, `**θ_now**`, hand position along the dial, tide markers, **MainLabel** tide copy, or any semantics derived from the marker schedule. It affects **only** layout/presentation branches keyed to civil half-day (currently **Hand.TimeReadout** anchor offset and baseline rotation; additional elements MUST use this same input if they gain a half-day split later).

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

- Optional `**civilHalfDayLayout`** — see **§Global civil half-day layout**; invalid values are **errors**; when omitted, behaviour matches `**"auto"`**.
- Required `**tickLabelHours`** — non-empty array; each element must be an integer in **{0, 1, …, 24}** (otherwise an error). **TickLabel** rows are emitted for those hours in list order; the reference product lists **1..23**.

### Derived behaviour (civil day vs `timeNow`)

The **product** assumes at least **one** tide extreme on the civil day and a
**non-empty** `**tideMarks.markers`** list describing those extremes. 

When `**spec.semantic.nextTide`** is injected, layout may use it for next-tide timing
instead of scanning markers; `**tideMarks`** remains **required** for drawing **TideMarks**.
When `**spec.semantic.atypicalTideSummary`** is injected as boolean true, **MainLabel**
uses atypical summary copy (`**Tricky tides today`**) whenever a next event exists.

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
- Optional role property `**fontWeight`**: when present on a bound role, must be **400** or **700**; hosts apply it to **text** primitives as SVG/CSS `**font-weight`**. When omitted, presentation uses the user agent default weight.

## 5. Element specs (TB-5)

### BRHCBundle

**BRHC** — **b**ottom-**r**ight-**h**and-**c**orner: the margin text stack anchored at
**B_bottom** / **B_right** (**§Global layout bounds**). Names prefixed **BRHC** belong
only to that stack.

**BRHCBundle** is a **top-level** named group of the diagram root; that holds
two **horizontal** text rows, stacked **upward** along **+Y** from **B_bottom**:
tide summary (**MainLabel**), then host-supplied civil date text (**BRHCDate**).

**Other Inputs** 

- `**brhcBundle`** — plain object with finite `**fontHeight**` (**k·R**, **§Sizing**): **FontHeight** shared by **MainLabel** and **BRHCDate**

**Horizontal placement**: Both rows use **right** justification: each anchor
**x** is **B_right** from **§Global layout bounds** 

**Vertical placement**: Each row receives its height above the bottom of the
diagram from a dedicated input — one per row.

### LocationLabel

**LocationLabel** is a **first-class top-level** named group on the diagram root
(hard-coded scene emission — not nested under any other element). It shows the
host-supplied place name **inside the dial**, near the **Hand** boss at **O**
(**§Origin**). It is **not** part of the **BRHC** bottom-right margin stack
(**BRHCBundle**).

As `**θ_now`** sweeps through the day, a single fixed anchor would intersect the
**Arm** or sit awkwardly against the radial geometry. Placement is therefore
chosen from a small set of **preset anchors** keyed by `**t_now`** (**§Global
“time now” input**), so tuning can happen entirely in diagram input without
changing generator geometry code.

Long place names are split into multiple **TextElement** lines per
`**maxSegmentLength**` (see **Diagram input** below). Each line is a separate
text leaf; **TextElement** remains one line of text (**§Text Element**).

**Scene model** — top-level group `**LocationLabel`** containing **N** sibling
**text** leaves, one per wrapped line, in top-to-bottom order:

- Leaf names `**LocationLabel.Line0**`, `**LocationLabel.Line1**`, …
  `**LocationLabel.Line(N−1)**` (zero-based index; **Style binding names
  (exact-match contract)**).
- The generator emits only as many line leaves as the wrap produces (**N ≥ 1**).

**Text** — host-supplied place name (`**spec.locationName**`), trimmed; split
into line strings per `**maxSegmentLength**`.

**FontHeight** — `**locationPlacement.fontHeight·RefRadius`** (**§Sizing**);
shared by every line.

**Baseline polar angle** — **0** on every line (horizontal baseline in diagram
space; **TextElement defaults**). Anchor **Y** follows **Text anchor Y (global)**.

**Diagram input** — plain object `**locationPlacement`**:

- `**fontHeight**` — **k·R** (**§Sizing**).
- `**maxSegmentLength**` — positive integer: maximum character count per line
  (monospace width heuristic per **§Text Element**). The generator word-wraps
  `**spec.locationName**` into one or more lines so that no emitted line
  exceeds this length. Prefer breaks at whitespace; when a single word exceeds
  the limit, break within that word.
- `**lineGap**` — non-negative **k·R** (**§Sizing**): fixed downward offset
  between consecutive line baselines (see **Vertical stacking**).
- `**ranges**` — ordered array of range entries. Entries are evaluated in
  **array order**; the **first** matching entry wins. Each entry supplies:
  - `**from**` — canonical time `**HH:MM:SS**` per **§Time and θ(t)** (inclusive lower bound on `**t_now`**).
  - `**to**` — canonical time `**HH:MM:SS**` per **§Time and θ(t)** (**exclusive** upper bound on `**t_now`**; `**24:00:00**` permitted only as `**to**` on the final range).
  - `**justification**` — `**"left"**`, `**"right"**`, or `**"centre"**` (**Text Element**); shared by every line in the block.
  - `**belowOrigin**` — **k·R** (**§Sizing**): anchor of the **first** line
    (`**LocationLabel.Line0**`) `**belowOrigin·RefRadius**` **below** **O**
    along **−Y** (**§Axes**).
  - `**offsetRight**` — signed **k·R** (**§Sizing**): horizontal anchor
    `**offsetRight·RefRadius**` to the **right** of **O** along **+X**
    (negative → **left** of **O**); shared by every line.

**Matching** — parse `**from**` and `**to**` to `**t_from**`, `**t_to**` per **§Time and θ(t)**. Entry matches when `**t_from ≤ t_now < t_to`**.

**Horizontal placement** — for the active range entry, every line uses the same
`**x = offsetRight · RefRadius**` and the same horizontal **justification** at
that **x** per **Text Element**.

**Vertical stacking** — let `**y₀ = −belowOrigin · RefRadius**` be the anchor
**Y** of `**LocationLabel.Line0**` (diagram model space, relative to **O**).
For line index `**i ≥ 1**`:

- `**yᵢ = y₀ − i × lineGap · RefRadius**`

Each step moves the baseline **downward** along **−Y** by the fixed unsigned
`**lineGap · RefRadius**` increment. Line `**i**` is emitted as text leaf
`**LocationLabel.Line<i>**` with anchor `**(x, yᵢ)`**.

The preset anchor does **not** rotate with `**θ_now`**; only the **selected
range entry** changes with `**t_now`**.

Reference product (three presets — tunable without code changes):

```
locationPlacement: {
    fontHeight: 0.045,
    maxSegmentLength: 21,
    lineGap: 0.05,
    ranges: [
        {
            from: "00:00:00",
            to: "08:00:00",
            justification: "left",
            belowOrigin: 0.06,
            offsetRight: -0.10,
        },
        {
            from: "08:00:00",
            to: "16:00:00",
            justification: "centre",
            belowOrigin: 0.08,
            offsetRight: 0,
        },
        {
            from: "16:00:00",
            to: "24:00:00",
            justification: "right",
            belowOrigin: 0.06,
            offsetRight: 0.10,
        },
    ],
}
```

## HomeMenuTrigger

- **HomeMenuTrigger** is a top-level named group.
- It comprises three horizontal lines centred inside a circle.
- **Not** part of **BRHCBundle**; bounds are **excluded** from `**B_*`** expansion.
- **Horizontal** — circular control trailing edge at `**B_right − homeMenuTrigger.menuRightPadding·R`**.
- **Vertical** — bottom of the circular control at `**B_bottom + homeMenuTrigger.menuAboveBottom·R`** (**Y** upward).
- Sizing and positioning parameters:

```
homeMenuTrigger: {
    diameter: 0.18,
    menuRightPadding: 0,   // k·R inset from B_right
    menuAboveBottom: 0.27, // k·R above B_bottom to control bottom edge
    iconBarLength: 0.09,
    iconBarGap: 0.025,
}
```

### HomeLocationPanel

Bottom-left **location** affordances: a boxed heading (**Location**) and one action row (**Share** · **Change**). **Share** copies the canonical place `**shareUrl`**; **Change** navigates to the location picker (host wiring).

- **HomeLocationPanel** is a top-level named compound group.
- **HomeMenuTrigger** and **Brand** are **not** ancestors; **HomeMenuTrigger**, **Brand**, and **HomeLocationPanel** are positioned **independently** via their own offsets from `**B_left**` / `**B_right**` / `**B_bottom**` (`**menuRightPadding**` / `**menuAboveBottom**` for **HomeMenuTrigger**; `**leftPadding**` / `**aboveBottom**` or `**brandQrLeftPadding**` / `**brandQrAboveBottom**` for the others).
- **Horizontal** — panel leading edge at `**B_left + homeLocationPanel.leftPadding·R`**.
- **Vertical** — panel bottom edge at `**B_bottom + homeLocationPanel.aboveBottom·R`**.
- **Plate** — leaf group `**HomeLocationPanelPlate`**: `**roundedRect**` behind the text block; preset surface matches `**role.menu.trigger**`.
- **Heading** — leaf group `**HomeLocationPanelLabel`**: fixed copy from `**homeLocationPanel.label**` (e.g. `**Location**`); `**labelFontHeight·R**`.
- **Actions** — sibling leaf groups on one row at `**actionFontHeight·R`**:
  - `**HomeLocationTrigger**` — `**changeLabel**` (e.g. `**Change**`); pointer/navigation wiring in the host.
  - `**HomeLocationPanelSeparator**` — middle dot (`**·**`); display only.
  - `**HomeShareTrigger**` — `**shareLabel**` (e.g. `**Share**`); pointer/clipboard wiring in the host.
- **Action row horizontal spacing** (from the panel inner leading edge `**panelLeft + innerPadLeft·R`**) — **Change** at the row origin; **·** and **Share** placed from estimated monospace label width (`**0.6 × actionFontHeight·R**` per code point) plus `**gapBeforeSeparator·R**` and `**gapAfterSeparator·R**`.
- **Layout bounds** — `**HomeLocationPanel`** plate and text extend `**B_***` (replacing the former **BrandURL** horizontal extent).

```
homeLocationPanel: {
    leftPadding: 0.24,       // k·R from B_left to panel leading edge
    aboveBottom: 0,          // k·R from B_bottom to panel bottom edge
    width: 0.38,
    height: 0.15,
    cornerRx: 0.014,
    labelFontHeight: 0.034,
    actionFontHeight: 0.045,
    label: "Location",
    shareLabel: "Share",
    changeLabel: "Change",
    gapBeforeSeparator: 0.01, // k·R after Change before ·
    gapAfterSeparator: 0.01,  // k·R after · before Share
    innerPadLeft: 0.018,
    innerPadBottom: 0.022,
    labelAboveActions: 0.028,
}
```

#### Scene model

- Top-level group `**HomeLocationPanel**` with children `**HomeLocationPanelPlate**`, `**HomeLocationPanelLabel**`, `**HomeLocationTrigger**`, `**HomeLocationPanelSeparator**`, `**HomeShareTrigger**`.

### Brand

**Brand** is a **top-level** named **compound** group containing only the place-share **QR** matrix (**BrandQR**). The former fixed URL line (**BrandURL** / `**thetidedial.page`**) is removed; outbound sharing is via **HomeLocationPanel** and scan-only **BrandQR**.

#### Placement

- **Horizontal** — **BrandQR** leading edge at `**B_left + brandQrLeftPadding·R`**.
- **Vertical** — **BrandQR** bottom edge at `**B_bottom + brandQrAboveBottom·R`**.
- **BrandQR** is scan-only; no pointer/click wiring on the QR matrix.

#### BrandQR (matrix)

- **Payload** is host-supplied `**shareUrl`** (full canonical place share URL).
- **Module grid** — square modules from a standard QR encoder (error correction **M**); includes the symbol quiet zone in the module count.
- **Size** — square side `**brandQrSize·R`** from diagram input `**brandQrSize**` (**k·R**).
- **Origin** — bottom-left corner of the QR bounding box at `**(B_left + brandQrLeftPadding·R, B_bottom + brandQrAboveBottom·R)`**.
- **Plate** — leaf group `**BrandQRPlate`**: one `**roundedRect**` coincident with the QR square (same width/height as `**brandQrSize·R**`, corner radius `**brandQrPlateCornerRx·R**`), centred on the QR box, drawn **behind** the modules. Preset surface matches `**role.menu.trigger`** (`**#111**` fill, `**#555**` stroke).
- **Modules** — leaf group `**BrandQR`**: one `**qrMatrix**` primitive (dark modules only; plate provides the light margin).
- **Style binding** — `**BrandQR`** module fill uses grey `**#666**` on the plate (no `**fontWeight**`).

#### Layout bounds

- `**B_left**`, `**B_right**`, and `**B_bottom**` extend to include **BrandQR** geometry (axis-aligned box for the QR).

#### Diagram inputs

- `**brandQrLeftPadding`** — required finite **k·R** **>= 0**; inset from `**B_left`** to **BrandQR** leading edge.
- `**brandQrAboveBottom`** — required finite **k·R** **>= 0**; inset from `**B_bottom`** up to **BrandQR** bottom edge.
- `**brandQrSize`** — required finite **k·R** **> 0** (QR square side).
- `**brandQrPlateCornerRx`** — required finite **k·R** **>= 0**; `**roundedRect`** corner radius for `**BrandQRPlate**`.

#### Scene model

- Top-level group `**Brand**` with children `**BrandQRPlate**` (`**roundedRect**`) and `**BrandQR**` (`**qrMatrix**`).

### MainLabel

### MainLabel placement

- **MainLabel** is emitted as one **text** leaf in named group **MainLabel**, **child of** named group **BRHCBundle** (see **§BRHCBundle** scene model).
- **MainLabel** **FontHeight** is `**brhcBundle.fontHeight·RefRadius`** (same as the other **BRHCBundle** text rows; **§Sizing**).
- **MainLabel** uses horizontal justification **right**; trailing anchor `**x = B_right`** (see **§Horizontal placement (bundle rows)**).
- MainLabel baseline `**y_mainLabel`** per **§Vertical placement** (independent **Y** from other bundle rows).
- Baseline polar angle is **0** (horizontal baseline in diagram space).

### MainLabel copy synthesis

- Source data is the marker schedule (`**tideMarks.markers`**) plus canonical
`**timeNow`** and optional semantic override `**spec.semantic.atypicalTideSummary`**.
- Compute the next tide event at or after `**timeNow`** on the same civil day.
- If no next event exists, **MainLabel** content is:
`**Next tide extreme tomorrow`**.
- Else if `**spec.semantic.atypicalTideSummary = true`**, **MainLabel** content is:
`**Tricky tides today`**.
- Else (next event exists and atypical summary is not true), **MainLabel** content is:
`**<Low|High> tide at <HH:MM>`**.
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

- Diagram input object `**dividorArc`** (see **Strict diagram input**): **required**; `**radiusK`** must be finite and strictly **> 0** (**§Sizing**). Model radius = `**radiusK·RefRadius`**.

### Geometry

- **Centre** — **O** (same as **RefArc**, **§Origin**).
- **Sweep** — same subtended angle and CCW orientation as **RefArc** (**§Polar**): from **θ_left** at the left endpoint to **θ_right** at the right endpoint.
- **Radius** — `**dividorArc.radiusK·RefRadius`** (not necessarily equal to **RefRadius**).

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
- Generated only for hours listed in `**tickLabelHours`** (integers in **{0, 1, …, 24}**). The reference diagram labels **1..23** only (see **Strict diagram input** for `**tickLabelHours`**).
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
- `**tideMarkArrowLineLen`**: non-negative float (k·R scale; host field on
`**tideMarks`**).
- `**tideMarkOuterBandGap`**: optional signed float (k·R; host field on
`**tideMarks`**; default **0** when omitted). **Vertex1** lies on the marker radial at polar angle **θ(t)** at radius `**(1 + AnnularBandWidth + tideMarkOuterBandGap) × RefRadius`** (**§Sizing**). The **AnnularBand** outer boundary is `**(1 + AnnularBandWidth) × RefRadius`**: negative values inset **Vertex1** toward **O** (clearance from the outer boundary); positive values place **Vertex1** outside that boundary.
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
- **Hand.TimeReadout** — composed readout along the arm (`**time now`** then `**HH:MM**`; see below).
- **Hand** curve primitives (**BossCircle** outline, **Arm** segment) are stroked only; **fill** is **none**.
- **Arm** should render with a slightly wider stroke width than the default diagram stroke.

### BossCircle

- Center at **O** (`(0,0)`).
- Radius: `**hand.bossCircleRadius · RefRadius`**.

### Radial segments

- **Arm** is colinear with the `**θ_now`** ray.
- Let:
  - `**r_arm_outer = RefRadius − hand.armRefArcGap · RefRadius`**
  - `**r_boss = hand.bossCircleRadius · RefRadius**`
- Segment radii:
  - **Arm** — from `**r_boss`** to `**r_arm_outer`** (outer end is on the **RefArc** radius when `**hand.armRefArcGap = 0`**; positive gap shortens the segment so it stops just short of the **RefArc**).
- Validation: generation fails if radial ordering is invalid at emission time
(specifically, require `**r_boss < r_arm_outer`**).

### Hand time readout (`Hand.TimeReadout`)

A single visual line showing `**time now HH:MM**` (literal `**time now**`, a
space, then the clock readout). The time part is derived from the global
canonical `**timeNow**` (`**HH:MM:SS**`, **§Global “time now” input**
/ **§Time and θ(t)**): the first two fields only (five characters:
`**HH:MM`**, no trailing colon in the display string). It is positioned along
the **Hand** so it moves with `**θ_now`**, emitted as **one** named group
`**Hand.TimeReadout`** containing `**Hand.TimeReadoutNowTag**` (literal
`**time now**`) and a sibling **text** leaf for `**HH:MM`**, to allow dedicated
style binding for the tag.

- Required diagram input `**hand.armTimeLabelFontHeight**`: finite dimensionless **k > 0** (**§Sizing**). **FontHeight** is `**hand.armTimeLabelFontHeight · RefRadius`**. This is independent of **TickLabel** sizing.
- **Text** — the first five characters of the canonical `**timeNow`** string (the hours and minutes fields and their delimiters; no seconds).
- **Horizontal justification** — **centre** on the rotated baseline for the
composed line `**time now HH:MM`** (monospace **0.6 em** per code unit width
heuristic, consistent with diagram-wide text bounds).
- Anchor placement uses the midpoint of the **Arm** segment (between `**r_boss`** and `**r_arm_outer**`, **§Radial segments**), then shifts by **0.05·RefRadius** along the **RefArc** tangent at `**θ_now`** that points toward **decreasing θ** (earlier clock time along the arc) when the **before-noon** presentation branch applies, and **opposite** that tangent when the **after-noon** branch applies. With `**civilHalfDayLayout = "auto"`**, the before-noon branch is `**t_now ≤ 12**` and the after-noon branch is `**t_now > 12**` (**t_now** per **§Global “time now” input**). With `**"beforeNoon"`** or `**"afterNoon"**`, the branch is forced per **§Global civil half-day layout** without changing `**θ_now`**.
- **Baseline rotation** (radians, same convention as other rotated diagram **text**): `**θ_now + π`** on the **before-noon** branch, else `**θ_now`**, so the string runs along the arm with a consistent reading sense across morning and afternoon. Branch selection matches the preceding bullet (**§Global civil half-day layout** when not `**"auto"`**).
- **Dominant baseline** — **middle** (anchor is the nominal centre of the line’s em box in the host).

