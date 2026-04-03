// NextPointer radial line in diagram space. See docs/specs/tide-diagram.md section NextPointer.
import { polar, timeToTheta } from "../model/tideDiagramModel.mjs";
import { parseCanonicalTimeOrThrow } from "../model/timeCanonical.mjs";
import {
  buildNowPointerFromSpec,
  readNowPointerLineInnerRadiusPx,
} from "./nowPointer.mjs";
import { computeNextTideEventCore } from "../model/tideEvents.mjs";

const DEFAULT_LINE_OUTER = 0.8;
const DEFAULT_CIRCLE_RADIUS = 0.04;

/**
 * @param {Record<string, unknown>} spec
 * @param {number} refRadius
 * @param {number} thetaLeft
 * @param {number} thetaRight
 * @returns {import('../model/tideDiagramModel.mjs').NextPointerDiagram | null}
 */
export function buildNextPointerFromSpec(
  spec,
  refRadius,
  thetaLeft,
  thetaRight,
) {
  const raw = spec.nextPointer;
  if (raw == null || typeof raw !== "object") return null;
  const o = /** @type {Record<string, unknown>} */ (raw);

  const radialLineSpec =
    o.radialLine && typeof o.radialLine === "object"
      ? /** @type {Record<string, unknown>} */ (o.radialLine)
      : o;

  const parsedNow = parseCanonicalTimeOrThrow(spec.timeNow, "spec.timeNow");
  if (parsedNow.isRightEndpoint) {
    throw new Error('spec.timeNow cannot be "24:00:00"');
  }

  const nowPointer = buildNowPointerFromSpec(
    spec,
    refRadius,
    thetaLeft,
    thetaRight,
  );
  if (nowPointer == null) return null;

  let rInner;
  if (nowPointer.radialLine != null) {
    rInner = Math.hypot(
      nowPointer.radialLine.start.x,
      nowPointer.radialLine.start.y,
    );
  } else {
    const fromSpec = readNowPointerLineInnerRadiusPx(spec, refRadius);
    if (fromSpec == null) return null;
    rInner = fromSpec;
  }

  const lineOuterK = numOr(
    radialLineSpec.outerRadius ??
      radialLineSpec.nextPointerLineOuterRadius ??
      o.nextPointerLineOuterRadius ??
      o.NextPointerLineOuterRadius,
    DEFAULT_LINE_OUTER,
  );
  const rOuter = Math.max(0, lineOuterK) * refRadius;
  if (rOuter <= rInner) return null;

  const core = computeNextTideEventCore(spec, parsedNow);
  if (core == null) {
    return null;
  }
  const tNextHours = core.seconds / 3600;

  const theta = timeToTheta(tNextHours, thetaLeft, thetaRight);
  const start = polar(rInner, theta);
  const end = polar(rOuter, theta);

  return {
    timeHours: tNextHours,
    theta,
    radialLine: { start, end },
    circle: buildNextPointerCircle(o, { refRadius, radialEnd: end }),
  };
}

/**
 * @param {unknown} v
 * @param {number} fallback
 */
function numOr(v, fallback) {
  return typeof v === "number" && Number.isFinite(v) ? v : fallback;
}

/**
 * @param {Record<string, unknown>} nextSpec
 * @param {{ refRadius: number, radialEnd: { x: number, y: number } }} ctx
 * @returns {{ center: { x: number, y: number }, radius: number }}
 */
function buildNextPointerCircle(nextSpec, ctx) {
  const { refRadius, radialEnd } = ctx;
  const circleSpec =
    nextSpec.circle && typeof nextSpec.circle === "object"
      ? /** @type {Record<string, unknown>} */ (nextSpec.circle)
      : nextSpec;

  const radiusK = numOr(
    circleSpec.radius ??
      circleSpec.nextPointerCircleRadius ??
      nextSpec.nextPointerCircleRadius ??
      nextSpec.NextPointerCircleRadius,
    DEFAULT_CIRCLE_RADIUS,
  );

  const radius = Math.max(0, radiusK) * refRadius;
  return {
    center: radialEnd,
    radius,
  };
}
