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
How **content bounds** map into a canvas, viewport, or layout is also **not**
fixed here (see **Content bounds**).

## Diagram elements

- The diagram has named elements:
  - TickMarks
  - TickLabels
  - TideMarks
  - NowPointer
  - NextPointer
  - WaitArc
  - CentreCluster
  - NowTime
  - TimeDelta
  - Location
  - CentreClusterFrame

*(Note: **Location** is not yet specified geometrically.)*

### Style binding names (exact-match contract)

- Style bindings are keyed by **exact** leaf element names.
- Name matching is **case-sensitive** and has **no aliasing** or fallback.
- A style binding name must match the emitted leaf element name byte-for-byte.
- Canonical style binding names currently used for styling iteration:
  - `RefArc`
  - `TickMark`
  - `HeightLabel`
  - `EventKind`
  - `NextPointer`
  - `WaitArc`

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
  - Valid normal range: `**00:00:00**` through `**23:59:59**`.
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
  - `**timeNow`** is a host-provided canonical string in `**HH:MM:SS**`.
  - `**timeNow = "24:00:00"` is invalid** and must fail diagram generation.
- Define:
  - Parse `**timeNow`** per **§Time and θ(t)**.
  - **t_now = H + M/60 + S/3600**
  - **θ_now = θ(t_now)** per **§Time and θ(t)**.
- Any element that is “tied to the current time now” is defined **in terms of
`t_now` and `θ_now`**; the specification does **not** introduce a second,
independent notion of “now.”

## Content bounds (box of interest)

- Required inputs define an axis-aligned **rectangle of interest** around **O** in
**diagram model space** (**§Origin**, **§Axes**).
- Each side is a non-negative proportion **k** interpreted as **k·R**
(**§Sizing**):
  - **left** — extent in **−X** from **O**; **X** runs from **−left·R** to **O**.
  - **right** — extent in **+X** from **O**; from **O** to **+right·R**.
  - **above** — extent in **+Y** from **O**; from **O** to **+above·R**.
  - **below** — extent in **−Y** from **O**; from **−below·R** to **O**.
- Together:
**X ∈ [ −left·R, +right·R ],  Y ∈ [ −below·R, +above·R ].**
- This rectangle models **which region counts as content** (e.g. tuning by eye).
Mapping it into a canvas, scene graph, or viewport is **not** fixed here (see
**Host responsibilities**).

## Radial lines and radial segments

- A **radial line** (infinite) passes through **O** at a given polar angle
(**§Polar**, **§Origin**).
- A **radial segment** is the **line segment** on that ray between two polar
radii **r_inner** and **r_outer** (in model units). It has no inherent “direction
of travel.”
- Tick marks and other elements are defined as radial segments where helpful
(**Tick marks**, **CentreClusterFrame**).

## Scene graph primitives (current scope)

- The scene graph at this stage consists of:
  - Arc segments (for **RefArc** and for **CentreClusterFrame**)
  - Line segments (for radial segments, tick marks, and the two
  **CentreClusterFrame** lines)
  - Text elements
  - Non-filled triangle outlines (introduced by **NowPointer**)
  - Filled triangles and filled circles (introduced by **TideMarks.TimePointer**
  and by **NextPointer**)

### Independent stroked curves

- **Line** and **arc** primitives are **one-dimensional** curves in the logical
model. They are **stroked** along the curve and, for now, **never** treated as
**filled** regions. **Fill** of areas bounded by curves is **out of scope**.
- Where multiple curve primitives are **independent**, they are **topologically**
independent: **not** joined into one path, **not** merged into one composite
path, and **do not** form a closed region by composition in the logical scene
graph—even if a viewer perceives closure optically. Distinct primitives may
**coincide** at a point (e.g. at **O**) without becoming one logical path.
- Subgroups that emit several curves (**CentreClusterFrame**, **TimePointer**)
satisfy **Independent stroked curves** unless a subsection adds detail.

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
- **Now triangle** — one non-filled triangle (stroke only; no fill region).

### Time association

- **NowPointer** is defined relative to the **global** current time:
  - It uses **t_now** derived from canonical `**timeNow`** and **θ_now = θ(t_now)** from
  **§Global “time now” input**.
- All **NowPointer** geometry is defined relative to **θ_now**.

### Geometry (first pass, pending final constants)

Because exact distances and angles are not yet specified, this section defines
the structure and leaves sizing inputs explicit.

#### Inputs and shared derived quantities

- **NowPointerLineInnerRadius**, **NowPointerLineOuterRadius** — line radii
as **k·R** per **§Sizing**.
- **NowPointerLabelSize** — label **FontHeight** multiplier **k** as **k·R**
(**§Sizing**).
- **NowPointerLabelNormalOffset** — signed diagram input **k** as **k·R**
(**§Sizing**).
- Let **û_rad = (cos θ_now, sin θ_now)** — unit vector along the time-now ray from
**O** outward (**§Axes**, **§Polar**).
- Let **û_n = (−sin θ_now, cos θ_now)** — unit vector perpendicular to **û_rad**,
from rotating **û_rad** by **+π/2** CCW (**§Polar**).
- Let **r_inner = NowPointerLineInnerRadius·R**, **r_outer = NowPointerLineOuterRadius·R**.
- Let **P** be the midpoint of the **Now radial line** segment between
**r_inner** and **r_outer** along **û_rad**.
- Define a **side sign** for label placement:
  - **side_sign = +1** when **t_now ≤ 12** (midnight through noon inclusive).
  - **side_sign = −1** when **t_now > 12** (afternoon through midnight).

#### Now radial line

- A radial segment at **θ_now** with:
  - **r_inner = NowPointerLineInnerRadius·R** (default **0.4**)
  - **r_outer = NowPointerLineOuterRadius·R** (default **0.6**)
- Both radius multipliers are diagram inputs interpreted by **§Sizing**.

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

**Now triangle (non-filled)**

- **Now triangle (non-filled)**
  - Triangle is associated to **θ_now** and is rendered as a stroked outline.
  - Define inputs:
    - **NowPointerTriangleRadius** — radius multiplier for the **peak/reference point**,
    - **NowPointerTriangleBaseLen** — base **length** multiplier,
    - **NowPointerTriangleHeight** — **height** multiplier from base to peak.
  - Local shape:
    - In local triangle coordinates, the **peak** is at **(0, 0)**.
    - The **base** is horizontal below the peak:
      - left base vertex at **(−½·NowPointerTriangleBaseLen·R, −NowPointerTriangleHeight·R)**,
      - right base vertex at **(+½·NowPointerTriangleBaseLen·R, −NowPointerTriangleHeight·R)**.
  - Placement and orientation:
    - Let **P_ref = polar(NowPointerTriangleRadius·R, θ_now)** be the **reference point** (the peak) on the time-now radial line.
    - Let the triangle be rotated rigidly about **P_ref** by angle **θ_now + π/2**.
    - The required triangle element is the image of the three local vertices under this rotation+translation, with **fill disabled** (stroke-only primitive in scene terms).

## NextPointer

**NextPointer** is a top-level named element tied to the **next** tide marker at or after `timeNow` on the same civil day (see **CentreCluster** and **TideMarks**).

### Logical structure

**NextPointer** comprises two direct parts, both on the ray of the next-tide time:

- **Next radial line** — one radial segment.
- **Next circle** — one filled circle at the outer end of that radial segment.

### Time association

- Let the **next tide marker** be the same event used by **CentreCluster.TimeDelta** (next marker at or after `timeNow`, ignoring any marker at `24:00:00`).
- Let its time be **t_next** in hours, with **θ_next = θ(t_next)** per **§Time and θ(t)**.
- All **NextPointer** geometry is defined relative to **θ_next**.

### Geometry

Inputs and derived quantities:

- **NextPointerLineOuterRadius** — line **outer** radius as **k·R** per **§Sizing**.
- **NextPointerCircleRadius** — circle radius as **k·R** per **§Sizing**.
- The **inner** radius of **NextPointer** is **not** an independent input:
  - Define **NowPointerLineInnerRadius** as in **NowPointer**.
  - **NextPointer** reuses that same **inner** radius so its radial segment begins at the **NowPointer** minimum radius.
- Let:
  - **r_inner = NowPointerLineInnerRadius·R** (effective value after any defaults),
  - **r_outer = NextPointerLineOuterRadius·R**,
  - **r_circle = NextPointerCircleRadius·R**.

#### Next radial line

- A radial segment at **θ_next** with:
  - **inner radius** **r_inner** shared with **NowPointer**,
  - **outer radius** **r_outer** from **NextPointerLineOuterRadius** (default **0.8**).
- If **r_outer ≤ r_inner**, **NextPointer** is omitted from the scene (no radial segment or circle emitted).

#### Next circle

- The **Next circle** is a filled circle at the **outer** endpoint of the Next radial line:
  - **Centre** — the point at radius **r_outer** on the ray at **θ_next**.
  - **Radius** — **r_circle** as above.

## WaitArc

**WaitArc** is a top-level named element representing the waiting interval from
`timeNow` to the next tide marker on the same civil day.

### Logical structure

- **WaitArc** contributes one arc segment concentric with **RefArc**.
- Arrowhead rendering is **not** synthesized by diagram generation; generation
  carries an explicit metadata intent that an arrow exists at arc end. The
  downstream renderer is responsible for visual arrowhead geometry.

### Time association

- Use the same **next tide marker** definition as **NextPointer** and
  **CentreCluster.TimeDelta**.
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

## CentreCluster

**CentreCluster** groups content near **O** (**§Origin**).

### CentreCluster horizontal axis

- Layout is **centred on X = 0** through **O**: **NowTime** and the composed
**TimeDelta** line use **X = 0** as the horizontal centre unless a subsection
states otherwise.

### Logical structure

Under **CentreCluster** there are **three** logical parts, all **direct** members
(siblings in the named-element sense):


| Part                   | Role                                                                                    |
| ---------------------- | --------------------------------------------------------------------------------------- |
| **NowTime**            | One **TextElement** — the main **“time now” readout line**, derived from `**timeNow`**. |
| **TimeDelta**          | Three **TextElement** fragments that read as one centred line.                          |
| **CentreClusterFrame** | **Curve primitives only** — two line segments and one arc (see **CentreClusterFrame**). |


### Vertical layout

Stack order follows **§Axes**: **NowTime** is **above** **TimeDelta**. **CentreClusterFrame** is **not** a third row between them; its geometry is in **CentreClusterFrame** and may **look** like a frame around both lines without being an extra vertical slot.

### Scene model (invariants)

- **NowTime** and **TimeDelta** are **not** children of **CentreClusterFrame**;
they sit beside it under **CentreCluster**.
- **CentreClusterFrame** contributes **three** separate curve primitives subject
to **Independent stroked curves**.

### NowTime

- One **TextElement**:
  - **Text** — fixed synthesis from global `**timeNow`**:
    - exactly `**Time now HH:MM:SS**` (includes seconds; no host override).
  - **FontHeight** — input **k** as **k·R** (**§Sizing**).
  - **Horizontal justification** — **centre** (explicit override; matches default).
  - **Baseline polar angle** — **0** (**TextElement defaults**).
  - **Anchor** — **(0, Y_now)** with **Y_now** an input **k** as **k·R** along **Y**
  from **O** (**§Axes**, **§Sizing**).

### TimeDelta

- One logical sentence, **three** **TextElement** instances, **centre-aligned as
a whole** at **X = 0** (**CentreCluster horizontal axis**):
  1. **Event kind** — **Text** **derived** from the **kind** of the **next**
    tide marker at or after `**timeNow`**, using the marker’s `**highOrLow**`
    flag (`"Low"` or `"High"`). Separate for styling while staying one visual
    line.
  2. **Glue** — literal `**water in`** (fixed; not a host input).
  3. **Interval** — **Text** **derived** from the **forward time difference**
    between `**timeNow`** and the **next** tide marker **on the same civil
    day**, formatted as `**Hh Mm`** (e.g. `"3h 21m"`). Behaviour when no such
    “next” marker exists is intentionally left undefined here.
- Shared for all fragments:
  - **FontHeight** — one input **k** as **k·R** for the whole line (**§Sizing**).
  - **Horizontal justification** — **centre**; **X** positions chosen so the
  line is centred on **X = 0** (monospace width estimates allowed).
  - **Baseline polar angle** — **0** (**TextElement defaults**).
  - **Anchor Y** — one input **Y_delta** as **k·R**, shared (**§Sizing**), same
  anchor convention as **Y_now**, different parameter.
- **Anchors (X)** — **NowTime** at **X = 0**; **TimeDelta** assigns per-fragment
**X** for whole-line centring.

### CentreClusterFrame

**CentreClusterFrame** is a **logical subgroup** whose output is **three** curve
primitives: **one** arc and **two** line segments (**Independent stroked
curves**).

**Radius and endpoints**

- **R_frame** = **k·R** for diagram input **k** (**§Sizing**).
- The arc uses the **same** centre **(0, 0)**, **sweep**, and angular orientation
as the **RefArc** (**§Polar**). The **only** geometric quantity that differs
from the **RefArc** is the circle radius (**R_frame** vs **RefRadius**).
- **θ_left** and **θ_right** are the polar angles of the leftmost and rightmost
endpoints of **this** arc at radius **R_frame** (same angular span as the **RefArc**).

**Arc segment**

- One arc at radius **R_frame** as above (**Independent stroked curves**).

**Line segments (two)**

- From **O** to each arc endpoint at **θ_left** and **θ_right** on the circle of
radius **R_frame**—i.e. **radial segments** (**Radial lines and radial
segments**) at those angles with **r_inner = 0**, **r_outer = R_frame**.
- These two segments are **not** one polyline joined to the arc.

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
- Each marker provides canonical `**time`** in `**HH:MM:SS**`.
- Parse marker `**time**` per **§Time and θ(t)** to derive **t** and **θ(t)**.
- Marker `**time = "24:00:00"`** is silently ignored (marker dropped).
- If two retained markers share the same canonical `**time**`, generation must
fail with an error.
- Each marker carries a **kind** flag `**highOrLow ∈ {"High", "Low"}`**, used
for derived event descriptions (see **CentreCluster**).

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
`**HH:MM**` (seconds omitted; no host override).
- Other **Text Element** rules apply unless overridden.

### TimePointer

** TimePointer ** comprises one filled triangle and one filled circle, 
having geometry defined as follows.

- Define a new input TideMarkArrowDivergence. It is a positive angle 
expressed in radians
- Define a new input TideMarkArrowLineLen. It is a positive float 
- Vertex1 is the point on the RefArc corresponding to time (t).
- halfAngle is 0.5 * TideMarkArrowDivergence
- Vertex 2 is is located with a polar offset from Vertex1 :
  R: TideMarkArrowLineLen * RefRad
  theta: RadialAngle(t) + PI + halfAngle
- Vertex 3 is is located with a polar offset from Vertex1 :
  R: TideMarkArrowLineLen * RefRad
  theta: RadialAngle(t) + PI - halfAngle
- The required triangle element is Vertex1, Vertex2, Vertex3
- Let line1 = the line segment vertex1->vertex2
- Let line2 = the line segment vertex1->vertex3
- Let radial1 = a normal to line1 from vertex2 of length RefRadb
- Let radial2 = a normal to line2 from vertex3 of length RefRadb
- Let centre = the intersection of radial1 and radial2
- let radius = the distance between centre and vertex2
- The required circle element is defined by centre and radius

## Notes on interpretation

- Standard mathematical conventions for polar coordinates and angles apply
(**§Polar**).
- Where ambiguity remains, implementations may follow common conventions
consistent with the above.

## o  todo

- no more high waters or low water today
- collisions
- truncations

