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
 * Civil clock readout: location line (**TimeNowLocation**), date line (**TimeNowDate**),
 * plus `HH:MM`, `:`, and `SS` (**TimeNowClock** leaves; same baseline on the clock row).
 *
 * @typedef {{
 *   hhmm: DiagramTextInst,
 *   secondsColon: DiagramTextInst,
 *   seconds: DiagramTextInst,
 * }} DiagramTimeNowClockInst
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
 * @typedef {{
 *   timeHours: number,
 *   theta: number,
 *   bossCircle: { center: DiagramPoint, radius: number },
 *   smallCircle: { center: DiagramPoint, radius: number },
 *   extension: DiagramLineSeg,
 *   projection: DiagramLineSeg,
 *   arm: DiagramLineSeg,
 *   pointerPip: TideTimePointerSpec,
 * }} HandDiagram
 *
 * TimeDeltaDiagram: **countdownStripes** holds four center-justified lines (location, phase, next-event interval, next-event clock) when counting down;
 * **timeDeltaEmptyStripes** holds three lines (location, phase, tomorrow event) when there is no next tide today (**NoMoreTidesToday** third stripe in the spec).
 * X anchor is fixed at **0** for each stripe; baseline Y follows per-stripe **belowOrigin** on the spec (**k·R**), distance from the origin toward negative Y.
 *
 * @typedef {{
 *   countdownStripes: DiagramTextInst[] | null,
 *   timeDeltaEmptyStripes: DiagramTextInst[] | null,
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
 * MainLabel is currently a single placeholder line that follows the InsideTrack.
 *
 * @typedef {{
 *   content: string,
 *   fontSize: number,
 *   center: DiagramPoint,
 *   radius: number,
 *   thetaStart: number,
 *   sweepRad: number,
 * }} MainLabelDiagram
 *
 * Home menu trigger control embedded in the diagram space (rounded rectangle + label).
 *
 * @typedef {{
 *   center: DiagramPoint,
 *   width: number,
 *   height: number,
 *   cornerRadius: number,
 *   labelSize: number,
 *   label: string,
 * }} HomeMenuTriggerDiagram
 *
 * @typedef {{
 *   version: number,
 *   meta: { title: string, width: number, height: number },
 *   paintOrder?: {
 *     overrides?: { name: string, place: 'before' | 'after', relativeTo: string }[],
 *   },
 *   refArc: RefArcSpec,
 *   insideTrack: InsideTrackDiagram,
 *   mainLabel: MainLabelDiagram,
 *   tickMarks: TickMarkSpec[],
 *   tickLabels: TickLabelSpec[],
 *   tideMarks: TideMarkDiagram[],
 *   annularBand: AnnularBandDiagram,
 *   homeMenuTrigger: HomeMenuTriggerDiagram,
 *   hand: HandDiagram,
 *   timeDeltaDiagram: TimeDeltaDiagram,
 *   centreFrameDiagram: CentreFrameDiagram,
 *   timeNowLocation: DiagramTextInst,
 *   timeNowDate: DiagramTextInst,
 *   timeNowClock: DiagramTimeNowClockInst,
 * }} TideDiagramDocument
 */

/**
 * Maximum diagram-space **X** over the closed **AnnularBand** sector (same geometry as layout).
 * Used to right-align the time-now readout to the band’s **+X** extent.
 *
 * @param {{ center: DiagramPoint, rInner: number, rOuter: number, thetaLeft: number, sweepRad: number }} annular
 * @returns {number}
 */
export function annularBandMaxX(annular) {
  const { center, rInner, rOuter, thetaLeft, sweepRad } = annular;
  const thetaRight = thetaLeft + sweepRad;
  const lo = Math.min(thetaLeft, thetaRight);
  const hi = Math.max(thetaLeft, thetaRight);
  let maxX = -Infinity;
  const consider = (theta, r) => {
    const x = center.x + r * Math.cos(theta);
    if (x > maxX) maxX = x;
  };
  for (const r of [rInner, rOuter]) {
    consider(thetaLeft, r);
    consider(thetaRight, r);
  }
  for (let n = -12; n <= 12; n += 1) {
    const th = n * Math.PI;
    if (th > lo && th < hi) {
      consider(th, rInner);
      consider(th, rOuter);
    }
  }
  return maxX;
}

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
