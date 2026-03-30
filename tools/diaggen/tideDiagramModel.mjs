/**
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
 * }} DiagramTextInst
 *
 * @typedef {{
 *   center: DiagramPoint,
 *   radius: number,
 *   sweepRad: number,
 *   thetaLeft: number,
 *   thetaRight: number,
 * }} CentreClusterFrameArcSpec
 *
 * @typedef {{
 *   start: DiagramPoint,
 *   end: DiagramPoint,
 * }} DiagramLineSeg
 *
 * @typedef {{
 *   nowTime: DiagramTextInst,
 *   timeDelta: DiagramTextInst[],
 *   frameArc: CentreClusterFrameArcSpec,
 *   frameLines: [DiagramLineSeg, DiagramLineSeg],
 * }} CentreClusterDiagram
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
 *   radialLine: DiagramLineSeg,
 *   nowLabel: TideLabelTextInst,
 * }} NowPointerDiagram
 *
 * @typedef {{
 *   version: number,
 *   meta: { title: string, width: number, height: number },
 *   refArc: RefArcSpec,
 *   tickMarks: TickMarkSpec[],
 *   tickLabels: TickLabelSpec[],
 *   tideMarks: TideMarkDiagram[],
 *   nowPointer: NowPointerDiagram | null,
 *   centreCluster: CentreClusterDiagram | null,
 *   contentBounds: DiagramContentBounds,
 * }} TideDiagramDocument
 */

/**
 * Axis-aligned box of interest in diagram space: origin at RefArc centre, each extent is a multiple of RefRadius.
 * Left/right/below/above are positive distances in −x, +x, −y, +y respectively.
 *
 * @param {number} left
 * @param {number} right
 * @param {number} above
 * @param {number} below
 * @param {number} refRadius
 * @returns {{ minX: number, maxX: number, minY: number, maxY: number }}
 */
export function diagramBoxFromExtents(left, right, above, below, refRadius) {
  const R = refRadius;
  return {
    minX: -left * R,
    maxX: right * R,
    minY: -below * R,
    maxY: above * R,
  };
}

/**
 * Gap on the circle is centred on +Y; RefArc is symmetric about −Y (bottom), CCW from θ_left to θ_right.
 * @param {number} sweepRad subtended angle (radians)
 * @returns {{ thetaLeft: number, thetaRight: number }}
 */
export function refArcAngles(sweepRad) {
  const mid = (3 * Math.PI) / 2;
  return {
    thetaLeft: mid - sweepRad / 2,
    thetaRight: mid + sweepRad / 2,
  };
}

/**
 * θ(t) = θ_left + (t / 24) * (θ_right − θ_left). t in [0, 24].
 * @param {number} tHours
 * @param {number} thetaLeft
 * @param {number} thetaRight
 */
export function timeToTheta(tHours, thetaLeft, thetaRight) {
  return thetaLeft + (tHours / 24) * (thetaRight - thetaLeft);
}

/**
 * @param {number} r
 * @param {number} theta
 * @returns {DiagramPoint}
 */
export function polar(r, theta) {
  return { x: r * Math.cos(theta), y: r * Math.sin(theta) };
}
