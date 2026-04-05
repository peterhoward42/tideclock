/**
 * tideDiagramModel.mjs — Diagram-space geometry helpers and typedefs shared by layout (polar, ref arc, time→θ).
 * Consumed by layout modules and mapping. Kind: Definition + pure logic. Does not assemble full diagrams alone.
 *
 * Tide diagram domain model (diagram space: origin at RefArc centre, x right, y up, angles CCW from +x).
 * See docs/specs/tide-diagram.md.
 *
 * @typedef {{ x: number, y: number }} DiagramPoint
 *
 * @typedef {{
 *   center: DiagramPoint,
 *   refRadius: number,
 *   sweepRad: number,
 *   thetaLeft: number,
 *   thetaRight: number,
 * }} RefArcSpec
 *
 * @typedef {{
 *   hour: number,
 *   theta: number,
 *   start: DiagramPoint,
 *   end: DiagramPoint,
 * }} TickMarkSpec
 *
 * @typedef {{
 *   hour: number,
 *   theta: number,
 *   content: string,
 *   fontSize: number,
 *   anchor: DiagramPoint,
 * }} TickLabelSpec
 *
 * @typedef {{
 *   left: number,
 *   right: number,
 *   above: number,
 *   below: number,
 * }} ContentBoundsExtents
 *
 * @typedef {{
 *   extents: ContentBoundsExtents,
 *   rect: { minX: number, maxX: number, minY: number, maxY: number },
 * }} DiagramContentBounds
 *
 * @typedef {{
 *   content: string,
 *   fontSize: number,
 *   anchor: DiagramPoint,
 *   hAlign?: 'left' | 'center' | 'right',
 * }} DiagramTextInst
 *
 * Civil clock readout: `HH:MM`, `:`, and `SS` as separate text instances (same baseline;
 * {@link buildTimeNowLabelFromSpec} offsets anchors so the triple reads as one right-aligned `HH:MM:SS`).
 *
 * @typedef {{
 *   hhmm: DiagramTextInst,
 *   secondsColon: DiagramTextInst,
 *   seconds: DiagramTextInst,
 * }} DiagramTimeNowLabelInst
 *
 * @typedef {{
 *   center: DiagramPoint,
 *   radius: number,
 *   sweepRad: number,
 *   thetaLeft: number,
 *   thetaRight: number,
 * }} CentreFrameArcSpec
 *
 * @typedef {{
 *   start: DiagramPoint,
 *   end: DiagramPoint,
 * }} DiagramLineSeg
 *
 * TimeDeltaDiagram: **timeDelta** holds three fragments when counting down to the next tide;
 * **timeDeltaEmptyMessage** is set (and **timeDelta** empty) when there is no next tide today (**NoMoreTidesToday** in the spec).
 *
 * @typedef {{
 *   timeDelta: DiagramTextInst[],
 *   timeDeltaEmptyMessage: DiagramTextInst | null,
 * }} TimeDeltaDiagram
 *
 * @typedef {{
 *   frameArc: CentreFrameArcSpec,
 *   frameLines: [DiagramLineSeg, DiagramLineSeg],
 * }} CentreFrameDiagram
 *
 * @typedef {{
 *   content: string,
 *   fontSize: number,
 *   anchor: DiagramPoint,
 *   angleRad: number,
 * }} TideLabelTextInst
 *
 * @typedef {{
 *   triangle: { v1: DiagramPoint, v2: DiagramPoint, v3: DiagramPoint },
 *   circle: { center: DiagramPoint, radius: number },
 * }} TideTimePointerSpec
 *
 * @typedef {{
 *   timeHours: number,
 *   theta: number,
 *   heightLabel: TideLabelTextInst,
 *   timeLabel: TideLabelTextInst,
 *   timePointer: TideTimePointerSpec,
 * }} TideMarkDiagram
 *
 * @typedef {{
 *   timeHours: number,
 *   theta: number,
 *   nowLabelBranch: 'A' | 'B',
 *   radialLine: DiagramLineSeg | null,
 *   nowLabel: TideLabelTextInst | null,
 *   triangle?: { v1: DiagramPoint, v2: DiagramPoint, v3: DiagramPoint },
 * }} NowPointerDiagram
 *
 * @typedef {{
 *   timeHours: number,
 *   theta: number,
 *   radialLine: DiagramLineSeg,
 *   circle: { center: DiagramPoint, radius: number },
 * }} NextPointerDiagram
 *
 * @typedef {{
 *   at: 'end',
 *   lengthK: number,
 *   widthK: number,
 *   insetK: number,
 *   style: 'filled' | 'open',
 *   scaleWithStroke: boolean,
 * }} ArcArrowMeta
 *
 * @typedef {{
 *   center: DiagramPoint,
 *   radius: number,
 *   thetaStart: number,
 *   sweepRad: number,
 *   arrow: ArcArrowMeta,
 * }} WaitArcDiagram
 *
 * @typedef {{
 *   version: number,
 *   meta: { title: string, width: number, height: number },
 *   refArc: RefArcSpec,
 *   tickMarks: TickMarkSpec[],
 *   tickLabels: TickLabelSpec[],
 *   tideMarks: TideMarkDiagram[],
 *   nowPointer: NowPointerDiagram | null,
 *   nextPointer: NextPointerDiagram | null,
 *   waitArc: WaitArcDiagram | null,
 *   timeDeltaDiagram: TimeDeltaDiagram,
 *   centreFrameDiagram: CentreFrameDiagram,
 *   timeNowLabel: DiagramTimeNowLabelInst | null,
 *   contentBounds: DiagramContentBounds,
 * }} TideDiagramDocument
 */

/** @param {string} label @param {number} value */
function assertFiniteNumber(label, value) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`${label} must be a finite number`);
  }
}

/**
 * Axis-aligned box of interest in diagram space: origin at RefArc centre, each extent is a multiple of RefRadius.
 * Left/right/below/above are positive distances in -x, +x, -y, +y respectively.
 *
 * @param {number} left
 * @param {number} right
 * @param {number} above
 * @param {number} below
 * @param {number} refRadius
 * @returns {{ minX: number, maxX: number, minY: number, maxY: number }}
 * @throws {Error} any extent or `refRadius` is not a finite number, or `refRadius` is not positive
 */
export function diagramBoxFromExtents(left, right, above, below, refRadius) {
  assertFiniteNumber("left", left);
  assertFiniteNumber("right", right);
  assertFiniteNumber("above", above);
  assertFiniteNumber("below", below);
  assertFiniteNumber("refRadius", refRadius);
  if (refRadius <= 0) {
    throw new Error("refRadius must be positive");
  }
  const R = refRadius;
  return {
    minX: -left * R,
    maxX: right * R,
    minY: -below * R,
    maxY: above * R,
  };
}

/**
 * Gap on the circle is centred on +Y; RefArc is symmetric about -Y (bottom), CCW from thetaLeft to thetaRight.
 * @param {number} sweepRad subtended angle (radians)
 * @returns {{ thetaLeft: number, thetaRight: number }}
 * @throws {Error} `sweepRad` is not a finite number
 */
export function refArcAngles(sweepRad) {
  assertFiniteNumber("sweepRad", sweepRad);
  const mid = (3 * Math.PI) / 2;
  return {
    thetaLeft: mid - sweepRad / 2,
    thetaRight: mid + sweepRad / 2,
  };
}

/**
 * theta(t) = thetaLeft + (t / 24) * (thetaRight - thetaLeft). t in [0, 24].
 * @param {number} tHours
 * @param {number} thetaLeft
 * @param {number} thetaRight
 * @throws {Error} any argument is not a finite number
 */
export function timeToTheta(tHours, thetaLeft, thetaRight) {
  assertFiniteNumber("tHours", tHours);
  assertFiniteNumber("thetaLeft", thetaLeft);
  assertFiniteNumber("thetaRight", thetaRight);
  return thetaLeft + (tHours / 24) * (thetaRight - thetaLeft);
}

/**
 * @param {number} r
 * @param {number} theta
 * @returns {DiagramPoint}
 * @throws {Error} `r` or `theta` is not a finite number
 */
export function polar(r, theta) {
  assertFiniteNumber("r", r);
  assertFiniteNumber("theta", theta);
  return { x: r * Math.cos(theta), y: r * Math.sin(theta) };
}
