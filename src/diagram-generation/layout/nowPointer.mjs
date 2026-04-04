// NowPointer in diagram space. See docs/specs/tide-diagram.md (NowPointer).
// Reads `spec.nowPointer` and `spec.timeNow`; emits a NowPointerDiagram (see tideDiagramModel.mjs) or `null`
// when the pointer is absent or radial geometry is unusable.
//
// Policies for {@link readNowPointerLineInnerRadiusPx}:
// - Returns `null` when `nowPointer` is missing or not a plain object (no throw).
//
// Policies for {@link buildNowPointerFromSpec}:
// - Returns `null` when `nowPointer` is missing, not a plain object, or inner/outer radii give `r_outer ≤ r_inner`.
// - Throws from {@link parseCanonicalTimeOrThrow} when `spec.timeNow` is invalid.
// - Throws when `spec.timeNow` parses to the civil-day right endpoint (`24:00:00`).
// - Numeric styling keys on the spec are optional; defaults match historical diagram presets (see constants below).

import {
  computeNextTideEventCore,
  shouldOmitNowWaitVisualsForNextPointerClearance,
} from "../model/tideEvents.mjs";
import { polar, timeToTheta } from "../model/tideDiagramModel.mjs";
import { parseCanonicalTimeOrThrow } from "../model/timeCanonical.mjs";

const DEFAULT_LINE_INNER = 0.4;
const DEFAULT_LINE_OUTER = 0.6;
const DEFAULT_LABEL_SIZE = 0.04;
const DEFAULT_LABEL_NORMAL_OFFSET = 0;
const DEFAULT_TRIANGLE_RADIUS = 0.7;
const DEFAULT_TRIANGLE_BASE = 0.08;
const DEFAULT_TRIANGLE_HEIGHT = 0.06;

/**
 * Use nested `radialLine` / `label` / `triangle` when present; otherwise read keys from the root
 * (legacy flat shape).
 *
 * @param {Record<string, unknown>} container
 * @param {'radialLine' | 'label' | 'triangle'} key
 * @returns {Record<string, unknown>}
 */
function childOrSelf(container, key) {
  const nested = container[key];
  return nested && typeof nested === "object"
    ? /** @type {Record<string, unknown>} */ (nested)
    : container;
}

/**
 * Inner radius of the Now radial line in px (same k·R as NextPointer’s shared inner radius).
 * Used when the line is omitted for NextPointer clearance but NextPointer still needs **r_inner**.
 *
 * @param {Record<string, unknown>} spec
 * @param {number} refRadius — diagram reference radius in px
 * @returns {number | null} `null` when `spec.nowPointer` is missing or not a plain object
 */
export function readNowPointerLineInnerRadiusPx(spec, refRadius) {
  const raw = spec.nowPointer;
  if (raw == null || typeof raw !== "object") return null;
  const o = /** @type {Record<string, unknown>} */ (raw);
  const radialLineSpec = childOrSelf(o, "radialLine");
  const lineInnerK = numOr(
    radialLineSpec.innerRadius ??
      radialLineSpec.nowPointerLineInnerRadius ??
      o.nowPointerLineInnerRadius ??
      o.NowPointerLineInnerRadius,
    DEFAULT_LINE_INNER,
  );
  return Math.max(0, lineInnerK) * refRadius;
}

/**
 * @param {Record<string, unknown>} spec
 * @param {number} refRadius
 * @param {number} thetaLeft — dial arc start (radians)
 * @param {number} thetaRight — dial arc end (radians)
 * @returns {import('../model/tideDiagramModel.mjs').NowPointerDiagram | null}
 * @throws {Error} invalid `spec.timeNow`, or `24:00:00` (right endpoint)
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
  const radialLineSpec = childOrSelf(o, "radialLine");
  const labelSpec = childOrSelf(o, "label");
  const triangleSpec = childOrSelf(o, "triangle");
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
  const nowLabelBranch = t <= 12 ? "A" : "B";

  const { anchor, baselineAngle } = nowLabelPlacement(nowLabelBranch, theta, mid, {
    normalOffsetK,
    refRadius,
  });

  const triangle = buildNowPointerTriangle(o, triangleSpec, { refRadius, theta });

  const nextCore = computeNextTideEventCore(spec, parsedNow);
  const omitLineAndLabel =
    shouldOmitNowWaitVisualsForNextPointerClearance(parsedNow, nextCore);

  return {
    timeHours: t,
    theta,
    nowLabelBranch,
    radialLine: omitLineAndLabel ? null : { start, end },
    nowLabel: omitLineAndLabel
      ? null
      : {
          content: "now",
          fontSize,
          anchor,
          angleRad: baselineAngle,
        },
    triangle,
  };
}

/**
 * @param {'A' | 'B'} branch
 * @param {number} theta
 * @param {{ x: number, y: number }} mid
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

  const rotate = theta + 0.5 * Math.PI;
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
 * @param {number} fallback — used only when `v` is not a finite number (optional spec fields).
 * @returns {number}
 */
function numOr(v, fallback) {
  return typeof v === "number" && Number.isFinite(v) ? v : fallback;
}
