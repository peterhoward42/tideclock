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
 *   version: number,
 *   meta: { title: string, width: number, height: number },
 *   refArc: RefArcSpec,
 *   tickMarks: TickMarkSpec[],
 *   tickLabels: TickLabelSpec[],
 * }} TideDiagramDocument
 */

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
