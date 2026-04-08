/**
 * nowPointer.mjs — “Now” radial pointer layout in diagram space.
 * Kind: Pipeline stage (layout submodule). Does not compute next-tide geometry alone.
 *
 * See docs/specs/tide-diagram.md (NowPointer).
 *
 * Policies for {@link buildNowPointerFromSpec}:
 * - `spec.nowPointer` is required (plain object). `radialLine`, `label`, and `triangle` and their numeric fields are required (finite numbers; see spec).
 * - Throws when `spec.nowPointer.radialLine.outerRadius` is not **> 0** (**k·R**) or when **r_outer ≤ r_inner** (outer line end not outside **R_frame**).
 * - Throws from {@link parseCanonicalTimeOrThrow} when `spec.timeNow` is invalid or `24:00:00`.
 * - Radial **inner** radius is **R_frame** from `spec.centreFrame.frameArcRadius` (not on `radialLine`).
 * - The Now **triangle** uses `spec.annularBand.annularBandWidth` (same rules as **AnnularBand**): required finite **> 0**.
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
 * @param {{ x: number, y: number }} origin
 * @param {{ x: number, y: number }} dirUnit
 * @param {{ x: number, y: number }} circleCenter
 * @param {number} rCircle
 * @returns {{ x: number, y: number } | null}
 */
function rayCircleForwardIntersect(origin, dirUnit, circleCenter, rCircle) {
  const wx = origin.x - circleCenter.x;
  const wy = origin.y - circleCenter.y;
  const dvd = wx * dirUnit.x + wy * dirUnit.y;
  const rSq = rCircle * rCircle;
  const vLenSq = wx * wx + wy * wy;
  const disc = dvd * dvd - vLenSq + rSq;
  if (disc < 0 || !Number.isFinite(disc)) return null;
  const s = Math.sqrt(disc);
  const t0 = -dvd - s;
  const t1 = -dvd + s;
  const hits = [t0, t1].filter((u) => Number.isFinite(u) && u > 1e-12);
  if (hits.length === 0) return null;
  const t = Math.min(...hits);
  return {
    x: origin.x + t * dirUnit.x,
    y: origin.y + t * dirUnit.y,
  };
}

/**
 * Signed CCW sweep along the circle centred at **center** from **pFrom** to **pAlongMinor** (minor arc).
 *
 * @param {{ x: number, y: number }} center
 * @param {{ x: number, y: number }} pFrom
 * @param {{ x: number, y: number }} pTo
 */
function minorArcSweepRadCCW(center, pFrom, pTo) {
  const b1 = Math.atan2(pFrom.y - center.y, pFrom.x - center.x);
  const b2 = Math.atan2(pTo.y - center.y, pTo.x - center.x);
  let d = b2 - b1;
  while (d > Math.PI) d -= 2 * Math.PI;
  while (d < -Math.PI) d += 2 * Math.PI;
  return d;
}

/**
 * @param {Record<string, unknown>} spec
 * @param {number} refRadius
 * @param {number} thetaLeft — dial arc start (radians)
 * @param {number} thetaRight — dial arc end (radians)
 * @returns {import('../model/tideDiagramModel.mjs').NowPointerDiagram}
 * @throws {Error} invalid `spec.timeNow`, `24:00:00`, missing `nowPointer`, or degenerate radii
 */
export function buildNowPointerFromSpec(
  spec,
  refRadius,
  thetaLeft,
  thetaRight,
) {
  const o = requirePlainObject(spec.nowPointer, "spec.nowPointer");

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
  if (!(lineOuterK > 0)) {
    throw new Error(
      "spec.nowPointer.radialLine.outerRadius must be a finite number greater than 0 (RefRadius multiple)",
    );
  }
  const rOuter = lineOuterK * refRadius;
  if (rOuter <= rInner) {
    throw new Error(
      "spec.nowPointer.radialLine.outerRadius must place the line end outside centreFrame.frameArcRadius (outer radius must exceed R_frame)",
    );
  }

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

  const annularRaw = requirePlainObject(spec.annularBand, "spec.annularBand");
  const wK = requireFiniteNumber(
    annularRaw.annularBandWidth,
    "spec.annularBand.annularBandWidth",
  );
  if (wK <= 0) {
    throw new Error(
      "spec.annularBand.annularBandWidth must be a finite number greater than 0",
    );
  }
  const rAnnularOuter = refRadius * (1 + wK);

  const triangle = buildNowPointerTriangle(triangleSpec, {
    refRadius,
    theta,
    rAnnularOuter,
  });

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
 * Now “triangle”: vertex on RefArc toward **O**, two straight sides to **rAnnularOuter**, cap = minor outer arc.
 *
 * @param {Record<string, unknown>} triangleSpec
 * @param {{ refRadius: number, theta: number, rAnnularOuter: number }} ctx
 * @returns {import('../model/tideDiagramModel.mjs').NowPointerTriangleDiagram}
 */
function buildNowPointerTriangle(triangleSpec, ctx) {
  const { refRadius, theta, rAnnularOuter } = ctx;

  const phi = requireFiniteNumber(
    triangleSpec.subtendedAngleRad,
    "spec.nowPointer.triangle.subtendedAngleRad",
  );
  if (!(phi > 0 && phi < Math.PI)) {
    throw new Error(
      "spec.nowPointer.triangle.subtendedAngleRad must be strictly between 0 and π radians",
    );
  }

  const R = refRadius;
  if (!(rAnnularOuter > R)) {
    throw new Error(
      "Now triangle requires annulus outer radius greater than RefRadius",
    );
  }

  const center = { x: 0, y: 0 };
  const vertex = polar(R, theta);

  // Outward along the time-now radial (into the annulus), not inward toward O:
  // θ+π±φ/2 hits the outer circle on the far side and inverts the wedge.
  const alpha1 = theta - 0.5 * phi;
  const alpha2 = theta + 0.5 * phi;
  const d1 = { x: Math.cos(alpha1), y: Math.sin(alpha1) };
  const d2 = { x: Math.cos(alpha2), y: Math.sin(alpha2) };

  const p1 = rayCircleForwardIntersect(vertex, d1, center, rAnnularOuter);
  const p2 = rayCircleForwardIntersect(vertex, d2, center, rAnnularOuter);
  if (p1 == null || p2 == null) {
    throw new Error("Now triangle: ray did not meet annulus outer circle");
  }

  const outerArcSweepRad = minorArcSweepRadCCW(center, p1, p2);

  return {
    center,
    vertex,
    outerArcStart: p1,
    outerArcSweepRad,
  };
}
