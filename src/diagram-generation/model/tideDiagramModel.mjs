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
 * Stroked arc concentric with **RefArc**, same centre and CCW sweep; radius is **radiusK·RefRadius** (**§Sizing**).
 *
 * @typedef {{
 *   radiusK: number,
 * }} DividorArcSpec
 *
 * @typedef {{
 *   start: DiagramPoint,
 *   end: DiagramPoint,
 * }} DiagramLineSeg
 *
 * @typedef {{
 *   hour: number,
 *   theta: number,
 *   start: DiagramPoint,
 *   end: DiagramPoint,
 *   bandOuterInward: DiagramLineSeg,
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
 * **BRHCBundle** (scene group): **MainLabel** (tide summary, bottom row), **BRHCDate**.
 *
 * **Hand** arm clock readout: one composed scene group built from
 * literal **`time now`** and **`HH:MM`** (tag precedes time along the arm).
 *
 * @typedef {{
 *   timeContent: string,
 *   nowTagContent: string,
 *   fontSize: number,
 *   anchor: DiagramPoint,
 *   angleRad: number,
 * }} HandTimeReadoutPartDiagram
 *
 * @typedef {{
 *   content: string,
 *   fontSize: number,
 *   anchor: DiagramPoint,
 * }} HandBossLabelDiagram
 *
 * @typedef {{
 *   timeHours: number,
 *   theta: number,
 *   bossCircle: { center: DiagramPoint, radius: number },
 *   livePulse: {
 *     periodSeconds: number,
 *     radiusRelativeAmplitude: number,
 *     opacityRelativeAmplitude: number,
 *   },
 *   bossLabel: HandBossLabelDiagram,
 *   arm: DiagramLineSeg,
 *   armTimeReadout: HandTimeReadoutPartDiagram,
 * }} HandDiagram
 *
 * Tide mark height label: **anchor** lies on the label circle at the **start** of the arc span (angular
 * midpoint of the string is **theta**); **arcCenter** is the RefArc centre; **arcSweepRad** is the total
 * CCW angular span for glyphs (see **arcText** in the scene model).
 *
 * @typedef {{
 *   content: string,
 *   fontSize: number,
 *   anchor: DiagramPoint,
 *   arcCenter: DiagramPoint,
 *   arcSweepRad: number,
 * }} TideHeightLabelDiagram
 *
 * @typedef {{
 *   triangle: { v1: DiagramPoint, v2: DiagramPoint, v3: DiagramPoint },
 *   circle: { center: DiagramPoint, radius: number },
 * }} TideTimePointerSpec
 *
 * @typedef {{
 *   timeHours: number,
 *   theta: number,
 *   temporalClass: 'future' | 'past',
 *   pointerFillStyle: 'filled' | 'outline',
 *   heightLabel: TideHeightLabelDiagram,
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
 * MainLabel: horizontal tide-summary text, right-justified to **B_right**; baseline **Y** per bundle vertical rules.
 *
 * @typedef {{
 *   content: string,
 *   fontSize: number,
 *   anchor: DiagramPoint,
 *   hAlign: 'right',
 * }} MainLabelDiagram
 *
 * Home menu trigger: circular control + hamburger icon; top-level scene sibling (not inside **BRHCBundle**).
 *
 * @typedef {{
 *   center: DiagramPoint,
 *   diameter: number,
 *   iconBarHalfLength: number,
 *   iconBarCenterSpacing: number,
 * }} HomeMenuTriggerDiagram
 *
 * @typedef {{
 *   content: string,
 *   fontSize: number,
 *   anchor: DiagramPoint,
 *   hAlign: 'left',
 * }} HomeLocationActionDiagram
 *
 * @typedef {{
 *   center: DiagramPoint,
 *   width: number,
 *   height: number,
 *   rx: number,
 * }} HomeLocationPanelPlateDiagram
 *
 * @typedef {{
 *   plate: HomeLocationPanelPlateDiagram,
 *   label: DiagramTextInst,
 *   share: HomeLocationActionDiagram,
 *   separator: HomeLocationActionDiagram,
 *   change: HomeLocationActionDiagram,
 * }} HomeLocationPanelDiagram
 *
 * **Brand** compound: **BrandQR** matrix only (see spec §Brand).
 * @typedef {{
 *   center: DiagramPoint,
 *   width: number,
 *   height: number,
 *   rx: number,
 * }} BrandQrPlateDiagram
 *
 * @typedef {{
 *   payload: string,
 *   origin: DiagramPoint,
 *   moduleSize: number,
 *   moduleCount: number,
 *   cells: boolean[],
 *   plate: BrandQrPlateDiagram,
 * }} BrandQrDiagram
 *
 * @typedef {{
 *   brandQr: BrandQrDiagram,
 * }} BrandCompoundDiagram
 *
 * @typedef {{
 *   minX: number,
 *   maxX: number,
 *   minY: number,
 *   maxY: number,
 * }} LayoutBoundsBox
 *
 * @typedef {{
 *   version: number,
 *   meta: { title: string },
 *   layoutBounds: LayoutBoundsBox,
 *   paintOrder?: {
 *     overrides?: { name: string, place: 'before' | 'after', relativeTo: string }[],
 *   },
 *   refArc: RefArcSpec,
 *   dividorArc: DividorArcSpec,
 *   mainLabel: MainLabelDiagram,
 *   tickMarks: TickMarkSpec[],
 *   tickLabels: TickLabelSpec[],
 *   tideMarks: TideMarkDiagram[],
 *   annularBand: AnnularBandDiagram,
 *   homeMenuTrigger: HomeMenuTriggerDiagram,
 *   homeLocationPanel: HomeLocationPanelDiagram,
 *   hand: HandDiagram,
 *   locationLabel: DiagramTextInst[],
 *   brhcDate: DiagramTextInst,
 *   brand: BrandCompoundDiagram,
 * }} TideDiagramDocument
 */

/**
 * Maximum diagram-space **X** over the closed **AnnularBand** sector (same geometry as layout).
 *
 * @param {{ center: DiagramPoint, rInner: number, rOuter: number, thetaLeft: number, sweepRad: number }} annular
 * @returns {number}
 */
export function annularBandMaxX(annular) {
  return annularBandBounds(annular).maxX;
}

/**
 * Axis-aligned bounds of the closed **AnnularBand** sector in diagram space.
 *
 * @param {{ center: DiagramPoint, rInner: number, rOuter: number, thetaLeft: number, sweepRad: number }} annular
 * @returns {{ minX: number, maxX: number, minY: number, maxY: number }}
 */
export function annularBandBounds(annular) {
  const { center, rInner, rOuter, thetaLeft, sweepRad } = annular;
  const thetaRight = thetaLeft + sweepRad;
  const lo = Math.min(thetaLeft, thetaRight);
  const hi = Math.max(thetaLeft, thetaRight);
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  const consider = (theta, r) => {
    const x = center.x + r * Math.cos(theta);
    const y = center.y + r * Math.sin(theta);
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
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
  return { minX, maxX, minY, maxY };
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
