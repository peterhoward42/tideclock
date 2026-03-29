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
  - CentreCluster
  - NowTime
  - TimeDelta
  - Location
  - CentreClusterFrame

*(Note: **Location** is not yet specified geometrically.)*

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
- Increasing time maps **monotonically and linearly** to distance along the
RefArc from left to right (CCW along the arc).
- For **t** in hours with **0 ≤ t ≤ 24**:
  **θ(t) = θ_left + (t / 24) × (θ_right − θ_left)**
  This **θ(t)** is the polar angle for time **t** on the RefArc. It is
  invertible. Any element that “uses time **t**” uses **θ(t)** unless stated
  otherwise.

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
| **NowTime**            | One **TextElement** — the main “time now” line.                                         |
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
  - **Text** — from the host (full line, e.g. “time now …”).
  - **FontHeight** — input **k** as **k·R** (**§Sizing**).
  - **Horizontal justification** — **centre** (explicit override; matches default).
  - **Baseline polar angle** — **0** (**TextElement defaults**).
  - **Anchor** — **(0, Y_now)** with **Y_now** an input **k** as **k·R** along **Y**
  from **O** (**§Axes**, **§Sizing**).

### TimeDelta

- One logical sentence, **three** **TextElement** instances, **centre-aligned as
a whole** at **X = 0** (**CentreCluster horizontal axis**):
  1. **Event kind** — **Text** from host (e.g. `"Low"`, `"High"`). Separate for
    styling while staying one visual line.
  2. **Glue** — literal `**water in`** (fixed; not a host input).
  3. **Interval** — **Text** from host (e.g. `"3h 21m"`).
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
- Each marker has time **t** in **[0, 24]** and polar angle **θ(t)** (**§Time and
θ(t)**).

### Logical structure

Each marker is a **cluster** with **direct** children:

- **Height label** — one **TextElement**.
- **Time label** — one **TextElement**.
- **Time pointer** — one **TimePointer** subgroup (below).

### Height label and time label (shared layout)

For **both** labels:

- **Horizontal justification** — **centre**.
- On the marker’s polar axis at radius **k·R** for `**<TideLabelRadius>`**
(**§Sizing**) from **O**.
- **Baseline polar angle** — **θ(t) − π/2** (overrides **TextElement defaults**).

**FontHeight** (per kind, **k·R**):

- Height label — `**<TideHeightLabelSize>`·R**.
- Time label — `**<TideTimeLabelSize>`·R**.

**Text** is from the host; other **Text Element** rules apply unless overridden.

### TimePointer

**TimePointer** outputs **curve primitives** only: **one** half-turn **arc** (π
radians on the pointer’s circle) and **two** **line segments**, subject to
**Independent stroked curves**.

**Reference geometry (arc first)** — The **arc** is the **authoritative**
definition of the pointer’s curved edge. It is fully specified in a **local** frame
(below), then mapped into diagram space by **placement** (**translation** then
**rotation**). It is **not** inferred from, and must **not** be constrained by,
the line segments below.

**Local frame** — Use the same axis convention as diagram space (**§Axes**):
**+X** to the right, **+Y** upward. Let **r** = `**<TimePointerUniversalRadius>`·R**
(**§Sizing**). The pointer’s circle is centred at **(0, 0)** with radius **r**.

**Half-circle choice (unique)** — The **arc** is exactly **one half** of that
circle (subtended angle **π**). It is **uniquely** fixed by requiring that the
**arc-length midpoint** of the visible segment — the point halfway along the arc
between its two endpoints — is the point on the **full** circle with **maximum
X**, namely **(r, 0)** in local coordinates.

**Equivalent endpoint form** — The two endpoints are **(0, −r)** and **(0, +r)**.
The arc is the **CCW** half (**§Polar**) from **(0, −r)** to **(0, +r)** that
passes through **(r, 0)** (positive sweep **π** in local polar angle from **+X**).

**Placement** (applies to the **arc** and its centre and endpoints)

- **Translation**: polar vector from **O** with radius **(1 −
`<TimePointerInset>`)·R** (`**<TimePointerInset>`** ∈ **[0, 1]**, dimensionless)
and angle **θ(t)** (**§Time and θ(t)**).
- **Rotation**: **θ(t)**.

Together, **Local frame** + **Half-circle choice** + **Placement** determine the
arc in diagram space **unambiguously**.

**Arc segment**

- One **arc** after the placement transform — the **final** transformed curve
primitive.

**Line segments (two)** — **Derived only** from the **final** transformed arc:
each is the segment from the **RefArc** point at **θ(t)** to one **endpoint** of
that arc. The lines **follow** the arc; they **do not** participate in defining
the arc.

## Notes on interpretation

- Standard mathematical conventions for polar coordinates and angles apply
(**§Polar**).
- Where ambiguity remains, implementations may follow common conventions
consistent with the above.

## o  todo

- no more high waters or low water today
- collisions
- truncations

