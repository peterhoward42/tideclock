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
 *   content: string,
 *   fontSize: number,
 *   anchor: DiagramPoint,
 *   hAlign?: 'left' | 'center' | 'right',
 * }} DiagramTextInst
 *
 * Civil clock readout: `HH:MM`, `:`, and `SS` as separate text instances (same baseline;
 * {@link buildTimeNowLabelFromSpec} sets baseline **y** to **0 − k·R** for **`timeNowLabel.y`** = **k** and offsets **x** so the triple reads as one right-aligned `HH:MM:SS`).
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
 * TimeDeltaDiagram: **timeDeltaLine** holds a single left-justified sentence when counting down to the next tide;
 * **timeDeltaEmptyMessage** is set (and **timeDeltaLine** null) when there is no next tide today (**NoMoreTidesToday** in the spec).
 * Anchors follow **timeDelta.leftOfOrigin** / **timeDelta.belowOrigin** on the spec (**k·R**), interpreted as distances from the origin toward negative axes.
 *
 * @typedef {{
 *   timeDeltaLine: DiagramTextInst | null,
 *   timeDeltaEmptyMessage: DiagramTextInst | null,
 * }} TimeDeltaDiagram
 *
 * @typedef {{
 *   frameArc: CentreFrameArcSpec,
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
 * Now “triangle” in diagram space: wedge tip on RefArc; maps to scene kind `nowWedgeOutline`.
 *
 * @typedef {{
 *   center: DiagramPoint,
 *   vertex: DiagramPoint,
 *   outerArcStart: DiagramPoint,
 *   outerArcSweepRad: number,
 * }} NowPointerTriangleDiagram
 *
 * @typedef {{
 *   timeHours: number,
 *   theta: number,
 *   nowLabelBranch: 'A' | 'B',
 *   radialLine: DiagramLineSeg | null,
 *   nowLabel: TideLabelTextInst | null,
 *   triangle?: NowPointerTriangleDiagram,
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
 * Annular sector between RefRadius and RefRadius + w (**w** = **annularBandWidth·RefRadius**); same **θ_left** and CCW sweep as RefArc.
 *
 * @typedef {{
 *   center: DiagramPoint,
 *   rInner: number,
 *   rOuter: number,
 *   thetaLeft: number,
 *   sweepRad: number,
 * }} AnnularBandDiagram
 *
 * Circular arc concentric with RefArc; radius **InsideTrackRadius·RefRadius**; same **θ_left** and CCW sweep as RefArc.
 *
 * @typedef {{
 *   center: DiagramPoint,
 *   radius: number,
 *   thetaLeft: number,
 *   sweepRad: number,
 * }} InsideTrackDiagram
 *
 * @typedef {{
 *   version: number,
 *   meta: { title: string, width: number, height: number },
 *   refArc: RefArcSpec,
 *   insideTrack: InsideTrackDiagram,
 *   tickMarks: TickMarkSpec[],
 *   tickLabels: TickLabelSpec[],
 *   tideMarks: TideMarkDiagram[],
 *   nowPointer: NowPointerDiagram | null,
 *   nextPointer: NextPointerDiagram | null,
 *   waitArc: WaitArcDiagram | null,
 *   annularBand: AnnularBandDiagram,
 *   timeDeltaDiagram: TimeDeltaDiagram,
 *   centreFrameDiagram: CentreFrameDiagram,
 *   timeNowLabel: DiagramTimeNowLabelInst | null,
 * }} TideDiagramDocument
 */

/** @param {string} label @param {number} value */
function assertFiniteNumber(label, value) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`${label} must be a finite number`);
  }
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
