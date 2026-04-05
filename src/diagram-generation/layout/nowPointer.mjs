/**
 * nowPointer.mjs — “Now” radial pointer layout in diagram space.
 * Kind: Pipeline stage (layout submodule). Does not compute next-tide geometry alone.
 *
 * See docs/specs/tide-diagram.md (NowPointer).
 *
 * Policies for {@link buildNowPointerFromSpec}:
 * - Returns `null` when `nowPointer` is missing, not a plain object, or inner/outer radii give `r_outer ≤ r_inner`.
 * - Throws from {@link parseCanonicalTimeOrThrow} when `spec.timeNow` is invalid.
 * - Throws when `spec.timeNow` parses to the civil-day right endpoint (`24:00:00`).
 * - When `nowPointer` is present, `radialLine`, `label`, and `triangle` objects and their numeric fields are required (finite numbers; see spec). Radial **inner** radius is **R_frame** from `spec.centreFrame.frameArcRadius` (not on `radialLine`).
 */

import {
  computeNextTideEventCore,
  shouldOmitNowWaitVisualsForNextPointerClearance,
} from "../model/tideEvents.mjs";
import { polar, timeToTheta } from "../model/tideDiagramModel.mjs";
import { parseCanonicalTimeOrThrow } from "../model/timeCanonical.mjs";
import { readRFramePx } from "./centreFrame.mjs";
import { requireFiniteNumber, requirePlainObject } from "./specRequire.mjs";

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

  const radialLineSpec = requirePlainObject(
    o.radialLine,
    "spec.nowPointer.radialLine",
  );
  const labelSpec = requirePlainObject(o.label, "spec.nowPointer.label");
  const triangleSpec = requirePlainObject(
    o.triangle,
    "spec.nowPointer.triangle",
  );

  const parsedNow = parseCanonicalTimeOrThrow(
    spec.timeNow,
    "spec.timeNow",
  );
  if (parsedNow.isRightEndpoint) {
    throw new Error('spec.timeNow cannot be "24:00:00"');
  }
  const t = parsedNow.hours;

  const rInner = readRFramePx(spec, refRadius);
  const lineOuterK = requireFiniteNumber(
    radialLineSpec.outerRadius,
    "spec.nowPointer.radialLine.outerRadius",
  );
  const rOuter = Math.max(0, lineOuterK) * refRadius;
  if (rOuter <= rInner) return null;

  const theta = timeToTheta(t, thetaLeft, thetaRight);
  const start = polar(rInner, theta);
  const end = polar(rOuter, theta);

  const labelSizeK = requireFiniteNumber(
    labelSpec.size,
    "spec.nowPointer.label.size",
  );
  const fontSize = Math.max(0, labelSizeK) * refRadius;
  const mid = {
    x: 0.5 * (start.x + end.x),
    y: 0.5 * (start.y + end.y),
  };
  const normalOffsetK = requireFiniteNumber(
    labelSpec.normalOffset,
    "spec.nowPointer.label.normalOffset",
  );
  const nowLabelBranch = t <= 12 ? "A" : "B";

  const { anchor, baselineAngle } = nowLabelPlacement(nowLabelBranch, theta, mid, {
    normalOffsetK,
    refRadius,
  });

  const triangle = buildNowPointerTriangle(triangleSpec, { refRadius, theta });

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
 * @param {Record<string, unknown>} triangleSpec
 * @param {{ refRadius: number, theta: number }} ctx
 * @returns {{ v1: {x:number,y:number}, v2: {x:number,y:number}, v3: {x:number,y:number} }}
 */
function buildNowPointerTriangle(triangleSpec, ctx) {
  const { refRadius, theta } = ctx;

  const radiusK = requireFiniteNumber(
    triangleSpec.radius,
    "spec.nowPointer.triangle.radius",
  );
  const baseK = requireFiniteNumber(
    triangleSpec.baseLen,
    "spec.nowPointer.triangle.baseLen",
  );
  const heightK = requireFiniteNumber(
    triangleSpec.height,
    "spec.nowPointer.triangle.height",
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
