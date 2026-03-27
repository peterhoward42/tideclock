# Specification for a tide diagram

## Role

To specify a specific diagram in terms of a scene graph and input parameters.

## Overview and the reference arc <RefArc>

- The diagram is dominated by a near semicircular arc - the reference arc. (RefArc)
- The RefArc's centre is located at X:0, Y:0.
- The RefArc's subtended angle will be defined by a <Sweep> input.
- The RefArc's radius will be defined by a <RefRadius> input.
- The angular orientation of the RefArc is defined in terms of which segment of the
  circle it is derived from is absent. Which is the uppermost (max Y) segment.
- The remainder of the diagram geometry is defined as a function of the RefArc.

### Clarification: RefArc angular extent

- The RefArc is a contiguous arc of a circle of radius <RefRadius>.
- The omitted portion of the circle is centred on the positive Y axis.
- The RefArc therefore spans symmetrically about the negative Y axis.
- The leftmost endpoint of the RefArc lies in the negative X direction.
- The rightmost endpoint of the RefArc lies in the positive X direction.
- Angles increase in the counterclockwise (CCW) direction.

## Interpretation of linear sizing input parameters

- The inputs will include linear sizing parameters, for example the length of a TickMark.
- All linear sizing inputs are interpreted as proporitions of RefRadius.
- For example the input 0.15 will be interpreted as RefArc * 0.15

## Diagram elements

- The diagram has named elements:
    - TickMarks
    - TickLabels
    - TideMarks
    - CentreCluster
    - NowTime
    - TimeDelta
    - Location

*(Note: Only TickMarks are defined geometrically at this stage. Other elements are placeholders.)*

## Coordinate System

- A Cartesian coordinates system with its origin at the centre of the RefArc, and X increasing to right of the scene and Y increasing to the top of the scene.
- Any polar angles defined in the remainder of this specification are with respect to the RefArc centre.

## Left and Right, Above and Below

- Left means the direction of decreasing X
- Right means the direction of increasing X
- Top means the direction of increasing Y
- Bottom means the direction of decreasing Y
- Above means Top-wards 
- Below means Bottom-wards

## The role of time in this specification

- The RefArc represents a single 24 hour time span from 00h00 until 24h00.
- 00:00 corresponds to the leftmost endpoint of the RefArc.
- 24:00 corresponds to the rightmost endpoint of the RefArc.
- Increasing time is linearly interpolated to CCW distance along the RefArc from left to right.
- The mapping between time and polar angle is monotonic and linear over the RefArc sweep.

### Clarification: time to angle mapping

- Let θ_left be the polar angle of the leftmost endpoint of the RefArc.
- Let θ_right be the polar angle of the rightmost endpoint of the RefArc.
- Let t be a time in hours, where 0 ≤ t ≤ 24.
- Then:

    θ(t) = θ_left + (t / 24) * (θ_right - θ_left)

- This mapping is invertible and defines the correspondence between time and position on the RefArc.

## Radial lines

- A Radial line is defined to be a segment of the infinite line passing through the centre of the
  RefArc at a given polar angle.
- The bounds of the radial line's segment are given by two polar radius values.
- A radial line is not defined as having a linear direction travel in of itself.

## Scene graph primitives (current scope)

- The scene graph at this stage consists of:
    - Arc segments (for RefArc)
    - Line segments (for radial lines and tick marks)
    - Text elements

## Text Element

- A single line of text parameterised by:
 -  Text
 -  FontHeight
 -  Horizontal Justification from {left, right, centre}
 -  Baseline polar angle
 -  Assumed to be using a monospace font to support primitive font-metric type calculations

*(Additional primitives may be introduced as required by later elements.)*

## Tick marks

- A tick mark is a (typically short) radial line.
- The bounding radius pair is:
    - 1.0 * RefRadius
    - (1.0 + <TickLen>) * RefRadius

### Placement

- There is a tick mark placed corresponding to each integer hour in the 24 hour period.
- The set of times for which tick marks are placed is:

    t ∈ {0, 1, 2, ..., 24}

- Each tick mark is placed at polar angle θ(t) as defined by the time-to-angle mapping.
- Tick marks at t = 0 and t = 24 are distinct and correspond to the two endpoints of the RefArc.

## TickLabel

- A tick label is associated with a given TickMark
- A tick label is a TextElement always comprising two digits. E.g. "23", or "03"
- One tick label is placed in the diagram for the set of time values in the <TickLabelTimes> input set, where the times are provided as 2-digit 24hour times  like "17", or "03".
- The text content is 2-digit text.
- The text height is defined by the <TickLabelHeight> input parameter
- The text horizontal justification is always centre
- The position of a tick label is defined by the following recipe - which assumes that the bounding area
  of the visible part of the text is a square shape aligned with the X/Y axis.
    - Calculate the square's width and height =  2 * TickLabelHeight
    - Calculate the square's centre point
    - Calculate the offset vector from the text's natural origin (for centre justified text) to the       square's center
    - Now we define the position of the text:
        -  The polar position angle for the text is determined from the time it belongs to
        -  The polar radius at which to place the square's centre is RefRadius * (1 + TickLen + <TickLabelOffs>)

## Notes on interpretation

- The specification assumes standard mathematical conventions for polar coordinates and angular measurement.
- Where multiple reasonable interpretations exist, implementations may adopt widely used conventions consistent with the above constraints.

## o  todo
- no more high waters or low water today
- collisions
- truncations
