# Specification for a tide diagram

## Role

To specify a specific diagram in terms of a scene graph and input parameters.

The **diagram generator** does **not** define paint order, z-height ordering, or
layers. Those topics will be handled later and **outside** the generator. **Named
elements** (see **Diagram elements**) exist so that an **external** host can bind
layering and related presentation properties to each entity by name; the
mechanics of that binding are **not in scope** for this specification yet.

## Overview and the reference arc <RefArc>

- The diagram is dominated by a near semicircular arc - the reference arc.
  (RefArc)
- The RefArc's centre is located at X:0, Y:0.
- The RefArc's subtended angle will be defined by a <Sweep> input.
- The RefArc's radius will be defined by a <RefRadius> input.
- The angular orientation of the RefArc is defined in terms of which segment of
  the circle it is derived from is absent. Which is the uppermost (max Y)
  segment.
- The remainder of the diagram geometry is defined as a function of the RefArc.

### Clarification: RefArc angular extent

- The RefArc is a contiguous arc of a circle of radius <RefRadius>.
- The omitted portion of the circle is centred on the positive Y axis.
- The RefArc therefore spans symmetrically about the negative Y axis.
- The leftmost endpoint of the RefArc lies in the negative X direction.
- The rightmost endpoint of the RefArc lies in the positive X direction.
- Angles increase in the counterclockwise (CCW) direction.

## Interpretation of linear sizing input parameters

- The inputs will include linear sizing parameters, for example the length of a
  TickMark.
- All linear sizing inputs are interpreted as proportions of RefRadius.
- For example the input 0.15 will be interpreted as RefRadius × 0.15

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

*(Note: **TideMarks** and **Location** are not yet specified geometrically.)*

## Coordinate System

- A Cartesian coordinates system with its origin at the centre of the RefArc, and
  X increasing to right of the scene and Y increasing to the top of the scene.
- Any polar angles defined in the remainder of this specification are with
  respect to the RefArc centre.

## Left and Right, Above and Below

- Left means the direction of decreasing X
- Right means the direction of increasing X
- Top means the direction of increasing Y
- Bottom means the direction of decreasing Y
- Above means Top-wards 
- Below means Bottom-wards

## Content bounds (box of interest, diagram model space)

- Required inputs define an axis-aligned **rectangle of interest** around the
  RefArc centre in **diagram model space** (origin at the RefArc centre, same
  coordinate system as elsewhere in this document).
- Each value is a non-negative **multiple of RefRadius**:
	- **left** — extent in the −X direction from the centre (the plane X runs
	  from **−left × RefRadius** to the centre).
	- **right** — extent in the +X direction from the centre (from the centre to
	  **+right × RefRadius**).
	- **above** — extent in the +Y direction from the centre (from the centre to
	  **+above × RefRadius**).
	- **below** — extent in the −Y direction from the centre (from **−below ×
	  RefRadius** to the centre).
- Together they define:

	X ∈ [ −left × RefRadius, +right × RefRadius ],  Y ∈ [ −below × RefRadius,
	+above × RefRadius ].

- This rectangle is a modelling choice for **what region of the diagram is
  considered the content** (e.g. for tuning by eye). How that rectangle is mapped
  into a canvas, scene graph, preview viewport, or any other host layout is
  **not** fixed by this specification.

## The role of time in this specification

- The RefArc represents a single 24 hour time span from 00h00 until 24h00.
- 00:00 corresponds to the leftmost endpoint of the RefArc.
- 24:00 corresponds to the rightmost endpoint of the RefArc.
- Increasing time is linearly interpolated to CCW distance along the RefArc from
  left to right.
- The mapping between time and polar angle is monotonic and linear over the
  RefArc sweep.

### Clarification: time to angle mapping

- Let θ_left be the polar angle of the leftmost endpoint of the RefArc.
- Let θ_right be the polar angle of the rightmost endpoint of the RefArc.
- Let t be a time in hours, where 0 ≤ t ≤ 24.
- Then:

	θ(t) = θ_left + (t / 24) * (θ_right - θ_left)

- This mapping is invertible and defines the correspondence between time and
  position on the RefArc.

## Radial lines

- A Radial line is defined to be a segment of the infinite line passing through
  the centre of the RefArc at a given polar angle.
- The bounds of the radial line's segment are given by two polar radius values.
- A radial line is not defined as having a linear direction travel in of itself.

## Scene graph primitives (current scope)

- The scene graph at this stage consists of:
	- Arc segments (for **RefArc** and for **CentreClusterFrame**)
	- Line segments (for radial lines, tick marks, and the two
	  **CentreClusterFrame** lines)
	- Text elements

### Curve primitives: topology, stroke, and fill

- **Line segment** and **arc segment** primitives are one-dimensional curves in
  the logical model. They are **stroked** (rendered along the curve) and, for
  now, are **never** treated as **filled** regions. **Fill** of areas bounded by
  curves is **out of scope** at this stage of the specification.
- Where the specification treats multiple curve primitives as **independent**,
  that includes **topological** independence: they are **not** joined into a
  single path or merged into one composite path object, and **do not** define a
  closed region by composition in the logical scene graph—even if a viewer might
  perceive a closed shape optically. Distinct primitives may still **coincide**
  at a point in space (e.g. several segments meeting at the RefArc centre)
  without becoming a single logical path.

## Text Element

- A single line of text parameterised by:
 -  Text
 -  FontHeight
 -  Horizontal Justification from {left, right, centre}
 -  Baseline polar angle
 -  Assumed to be using a monospace font to support primitive font-metric type
	calculations

*(Additional primitives may be introduced as required by later elements.)*

### Text anchor Y (global)

- Diagram elements that delegate to **TextElement** place the anchor **(x, y)**
  in diagram model space. The **Y** coordinate follows the same convention as for
  **TickLabel** anchors (vertical position in diagram space associated with that
  text for rendering in the host). The specification does not model em-boxes or
  similar font metrics.

## CentreCluster

**CentreCluster** groups content **near the centre of the RefArc** (the RefArc
centre at the diagram origin) and is centred on **X = 0** through that point.

### Logical structure

Under **CentreCluster** there are **three** logical parts, all **direct** members
of **CentreCluster** (siblings in the named-element sense):

| Part | Role | |------|------| | **NowTime** | One **TextElement** — the main
“time now” line. | | **TimeDelta** | Three **TextElement** fragments that read as
one centred line. | | **CentreClusterFrame** | **Curve primitives only** — two
line segments and one arc (see **CentreClusterFrame**). |

### Vertical layout (diagram space)

Larger **Y** is nearer the **top** of the scene. The two text lines stack in this
order: **NowTime** above **TimeDelta**. **CentreClusterFrame** is not a third row
between them; its geometry is defined in **CentreClusterFrame** and may **look**
like a frame around both lines, but that is alignment in the drawing, not an
extra slot in the vertical list.

### Scene model (invariants)

- **NowTime** and **TimeDelta** are **not** children of **CentreClusterFrame**;
  they sit beside it under **CentreCluster**.
- **CentreClusterFrame** contributes **three separate** curve primitives. They
  are **not** merged into one path, polyline, or closed outline; only subgroup
  membership and the geometry below tie them together (**Curve primitives:
  topology, stroke, and fill**).

### NowTime

- A single **TextElement**:
	- **Text** — one string supplied from outside (the full line, e.g. a “time
	  now …” line as produced by the host).
	- **FontHeight** — a diagram input as a multiple of **RefRadius** (same
	  interpretation as other linear sizing inputs).
	- **Horizontal justification** — **centre**.
	- **Baseline polar angle** — **0** (horizontal in diagram space).
	- **Anchor** — **(0, Y_now)** where **Y_now** is a diagram input as a
	  multiple of **RefRadius** (offset in **+Y** / **−Y** from the RefArc centre
	  per the global coordinate system).

### TimeDelta

- One logical sentence made of **three** **TextElement** instances, composed so
  the line reads as one phrase and is **centre-aligned as a whole** at **X = 0**:
  1. **Event kind** — **Text** is a string supplied from outside (e.g. `"Low"` or
  `"High"`). Modelled separately from the other fragments so it can be styled or
  emphasised distinctly while remaining visually integrated on the line.  2.
  **Glue** — fixed literal **` water in `** (leading space, the word **water**,
  spaces, **in**, trailing space) between event kind and interval. Not a host
  input.  3. **Interval** — **Text** is a string supplied from outside (e.g. a
  relative duration such as `"3h 21m"`).
- For all three fragments:
	- **FontHeight** — one diagram input as a multiple of **RefRadius**, shared
	  by the whole line.
	- **Horizontal justification** — **centre** per fragment; horizontal
	  positions are chosen so the concatenation is centred on **X = 0**
	  (implementation may use monospace character-width estimates).
	- **Baseline polar angle** — **0**.
	- **Anchor Y** — a single diagram input **Y_delta** as a multiple of
	  **RefRadius**, shared by all three fragments (same convention as **Y_now**
	  in **NowTime**, with a separate input value).
- **Anchors (X)** — **NowTime** fixes **X = 0** (see **NowTime**). **TimeDelta**
  assigns each fragment its own **X** (computed layout) so the full line is
  centred on **X = 0**.

### CentreClusterFrame

**CentreClusterFrame** is a **logical subgroup** whose output is **three** curve
primitives: **one** arc segment and **two** line segments. All are **stroked**
and **not** filled; they are **topologically** independent as separate primitives
(not stitched into one path or compound shape; see **Curve primitives: topology,
stroke, and fill**).

**Radius and endpoints**

- **R_frame** = **<FrameArcRadius> × RefRadius**, where **<FrameArcRadius>** is a
  diagram input as a **proportion of RefRadius** (**Interpretation of linear
  sizing input parameters**).
- The arc uses the **same** centre **(0, 0)**, **Sweep**, and angular orientation
  as the **RefArc** (**Overview and the reference arc**, **Clarification: RefArc
  angular extent**). The **only** geometric quantity that differs from the
  **RefArc** is the circle radius (**R_frame** instead of **RefRadius**).
- Let **θ_left** and **θ_right** be the polar angles of the **leftmost** and
  **rightmost** endpoints of this arc (same angular span as the **RefArc** at
  radius **R_frame**).

**Arc segment**

- One arc at radius **R_frame** following the rules above, as a **stroked** curve
  primitive (**Curve primitives: topology, stroke, and fill**).

**Line segments (two)**

- Each runs from the RefArc centre **(0, 0)** to one endpoint of that arc: **(0,
  0)** to the point at **θ_left** on the circle of radius **R_frame**, and **(0,
  0)** to the point at **θ_right** on that circle.
- Equivalently: each is a **Radial line** (**Radial lines**) at **θ_left** or
  **θ_right** with bounding radii **0** and **R_frame**.
- In the logical model these two segments are **not** a single polyline joined to
  the arc.

## Tick marks

- A tick mark is a (typically short) radial line.
- The bounding radius pair is:
	- 1.0 * RefRadius
	- (1.0 + <TickLen>) * RefRadius

### Placement

- There is a tick mark placed corresponding to each integer hour in the 24 hour
  period.
- The set of times for which tick marks are placed is:

	t ∈ {0, 1, 2, ..., 24}

- Each tick mark is placed at polar angle θ(t) as defined by the time-to-angle
  mapping.
- Tick marks at t = 0 and t = 24 are distinct and correspond to the two endpoints
  of the RefArc.

## TickLabel

- A tick label is-a TextElement with its own generation model based on the
  TickMark with which it associated:
- The associations gives implicit axis to the time it belongs to and thence the
  polar angle of the TickMark
- We use those assoctions to define the TickLabel:
	- The text content is a two digit string representation of the time. e.g.
	  "09"
	- centre justified
	- FontSize = <TickLabelSize> * RefRadius
	- The baseline angle is constant 0.
- Tick labels are generated only for hours included in an input parameter (a
  subset of {0, 1, …, 24}).
- The location for the TextElement is the max-radius end of the associated
  TickMark, plus the following vector additions:
	-  A polar vector with
		-  Angle = that associated with the TickMark
		-  Length = <TickLabelClearance> * RefRadius
	- A cartesian vector with X = 0 Y = -0.5 * Font size




## Notes on interpretation

- The specification assumes standard mathematical conventions for polar
  coordinates and angular measurement.
- Where multiple reasonable interpretations exist, implementations may adopt
  widely used conventions consistent with the above constraints.

## o  todo
- no more high waters or low water today
- collisions
- truncations
