// NowPointer radial line in diagram space. See docs/specs/tide-diagram.md §NowPointer.
import { polar, timeToTheta } from "./tideDiagramModel.mjs";
import { parseCanonicalTimeOrThrow } from "./timeCanonical.mjs";

const DEFAULT_LINE_INNER = 0.4;
const DEFAULT_LINE_OUTER = 0.6;
const DEFAULT_LABEL_SIZE = 0.04;
const DEFAULT_LABEL_NORMAL_OFFSET = 0;
const DEFAULT_TRIANGLE_RADIUS = 0.7;
const DEFAULT_TRIANGLE_BASE = 0.08;
const DEFAULT_TRIANGLE_HEIGHT = 0.06;

/**
 * @param {Record<string, unknown>} spec
 * @param {number} refRadius
 * @param {number} thetaLeft
 * @param {number} thetaRight
 * @returns {import('./tideDiagramModel.mjs').NowPointerDiagram | null}
 */
export function buildNowPointerFromSpec(
  spec,
  refRadius,
  thetaLeft,
  thetaRight,
) {
  const raw = spec.nowPointer;
  if (raw == null || typeof raw !== "object") return null;
  const o = /** @type {Record<string, unknown>} */ (raw);
  const radialLineSpec =
    o.radialLine && typeof o.radialLine === "object"
      ? /** @type {Record<string, unknown>} */ (o.radialLine)
      : o;
  const labelSpec =
    o.label && typeof o.label === "object"
      ? /** @type {Record<string, unknown>} */ (o.label)
      : o;
  const triangleSpec =
    o.triangle && typeof o.triangle === "object"
      ? /** @type {Record<string, unknown>} */ (o.triangle)
      : o;
  const parsedNow = parseCanonicalTimeOrThrow(
    spec.timeNow,
    "spec.timeNow",
  );
  if (parsedNow.isRightEndpoint) {
    throw new Error('spec.timeNow cannot be "24:00:00"');
  }
  const t = parsedNow.hours;

  const lineInnerK = numOr(
    radialLineSpec.innerRadius ??
      radialLineSpec.nowPointerLineInnerRadius ??
      o.nowPointerLineInnerRadius ??
      o.NowPointerLineInnerRadius,
    DEFAULT_LINE_INNER,
  );
  const lineOuterK = numOr(
    radialLineSpec.outerRadius ??
      radialLineSpec.nowPointerLineOuterRadius ??
      o.nowPointerLineOuterRadius ??
      o.NowPointerLineOuterRadius,
    DEFAULT_LINE_OUTER,
  );
  const rInner = Math.max(0, lineInnerK) * refRadius;
  const rOuter = Math.max(0, lineOuterK) * refRadius;
  if (rOuter <= rInner) return null;

  const theta = timeToTheta(t, thetaLeft, thetaRight);
  const start = polar(rInner, theta);
  const end = polar(rOuter, theta);

  const labelSizeK = numOr(
    labelSpec.size ??
      labelSpec.nowPointerLabelSize ??
      o.nowPointerLabelSize ??
      o.NowPointerLabelSize,
    DEFAULT_LABEL_SIZE,
  );
  const fontSize = Math.max(0, labelSizeK) * refRadius;
  const mid = {
    x: 0.5 * (start.x + end.x),
    y: 0.5 * (start.y + end.y),
  };
  const normalOffsetK = numOr(
    labelSpec.normalOffset ??
      labelSpec.nowPointerLabelNormalOffset ??
      o.nowPointerLabelNormalOffset ??
      o.NowPointerLabelNormalOffset,
    DEFAULT_LABEL_NORMAL_OFFSET,
  );
  // Branch A: t ≤ 12; Branch B: t > 12. See docs/specs/tide-diagram.md §NowPointer (Now label).
  const nowLabelBranch = t <= 12 ? "A" : "B";

  const { anchor, baselineAngle } = nowLabelPlacement(nowLabelBranch, theta, mid, {
    normalOffsetK,
    refRadius,
  });

  const triangle = buildNowPointerTriangle(o, triangleSpec, { refRadius, theta });

  return {
    timeHours: t,
    theta,
    nowLabelBranch,
    radialLine: { start, end },
    nowLabel: {
      content: "now",
      fontSize,
      anchor,
      angleRad: baselineAngle,
    },
    triangle,
  };
}

/**
 * Anchor and baseline for the "now" label: A = t≤12 (θ+π, −û_n), B = t>12 (θ+2π, +û_n).
 * @param {'A' | 'B'} branch
 * @param {number} theta
 * @param {{ x: number, y: number }} mid midpoint of the Now radial line
 * @param {{ normalOffsetK: number, refRadius: number }} opts
 */
function nowLabelPlacement(branch, theta, mid, opts) {
  const { normalOffsetK, refRadius } = opts;
  const nx = -Math.sin(theta);
  const ny = Math.cos(theta);
  const d = normalOffsetK * refRadius;

  if (branch === "A") {
    return {
      anchor: {
        x: mid.x - d * nx,
        y: mid.y - d * ny,
      },
      baselineAngle: theta + Math.PI,
    };
  }
  return {
    anchor: {
      x: mid.x + d * nx,
      y: mid.y + d * ny,
    },
    baselineAngle: theta + 2 * Math.PI,
  };
}

/**
 * Build the NowPointer triangle: an isosceles triangle with a horizontal base in
 * its local coordinates, reference point at the peak. The peak lies on the
 * radial line at radius k·R, and the whole triangle is rotated about that peak
 * by angle θ(t) + π.
 *
 * @param {Record<string, unknown>} nowSpec
 * @param {Record<string, unknown>} triangleSpec
 * @param {{ refRadius: number, theta: number }} ctx
 * @returns {{ v1: {x:number,y:number}, v2: {x:number,y:number}, v3: {x:number,y:number} }}
 */
function buildNowPointerTriangle(nowSpec, triangleSpec, ctx) {
  const { refRadius, theta } = ctx;

  const radiusK = numOr(
    triangleSpec.radius ??
      triangleSpec.nowPointerTriangleRadius ??
      nowSpec.nowPointerTriangleRadius ??
      nowSpec.NowPointerTriangleRadius,
    DEFAULT_TRIANGLE_RADIUS,
  );
  const baseK = numOr(
    triangleSpec.baseLen ??
      triangleSpec.nowPointerTriangleBaseLen ??
      nowSpec.nowPointerTriangleBaseLen ??
      nowSpec.NowPointerTriangleBaseLen,
    DEFAULT_TRIANGLE_BASE,
  );
  const heightK = numOr(
    triangleSpec.height ??
      triangleSpec.nowPointerTriangleHeight ??
      nowSpec.nowPointerTriangleHeight ??
      nowSpec.NowPointerTriangleHeight,
    DEFAULT_TRIANGLE_HEIGHT,
  );

  const radius = Math.max(0, radiusK) * refRadius;
  const baseLen = Math.max(0, baseK) * refRadius;
  const height = Math.max(0, heightK) * refRadius;

  const referencePoint = polar(radius, theta);

  const halfBase = 0.5 * baseLen;
  const localPeak = { x: 0, y: 0 };
  const localBaseLeft = { x: -halfBase, y: -height };
  const localBaseRight = { x: halfBase, y: -height };

  const rotate = theta + Math.PI;
  const cosA = Math.cos(rotate);
  const sinA = Math.sin(rotate);

  const v1 = {
    x: referencePoint.x + localPeak.x * cosA - localPeak.y * sinA,
    y: referencePoint.y + localPeak.x * sinA + localPeak.y * cosA,
  };
  const v2 = {
    x: referencePoint.x + localBaseLeft.x * cosA - localBaseLeft.y * sinA,
    y: referencePoint.y + localBaseLeft.x * sinA + localBaseLeft.y * cosA,
  };
  const v3 = {
    x: referencePoint.x + localBaseRight.x * cosA - localBaseRight.y * sinA,
    y: referencePoint.y + localBaseRight.x * sinA + localBaseRight.y * cosA,
  };

  return { v1, v2, v3 };
}

/**
 * @param {unknown} v
 * @param {number} fallback
 */
function numOr(v, fallback) {
  return typeof v === "number" && Number.isFinite(v) ? v : fallback;
}
