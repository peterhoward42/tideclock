// NextPointer radial line in diagram space. See docs/specs/tide-diagram.md §NextPointer.
import { polar, timeToTheta } from "./tideDiagramModel.mjs";
import { parseCanonicalTimeOrThrow } from "./timeCanonical.mjs";
import { buildNowPointerFromSpec } from "./nowPointer.mjs";
import { computeNextTideEventCore } from "./tideEvents.mjs";

const DEFAULT_LINE_OUTER = 0.8;

/**
 * @param {Record<string, unknown>} spec
 * @param {number} refRadius
 * @param {number} thetaLeft
 * @param {number} thetaRight
 * @returns {import('./tideDiagramModel.mjs').NextPointerDiagram | null}
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

  // Derive effective inner radius from NowPointer so NextPointer starts at the
  // same minimum radius. If NowPointer is absent or degenerate, omit
  // NextPointer as well.
  const nowPointer = buildNowPointerFromSpec(
    spec,
    refRadius,
    thetaLeft,
    thetaRight,
  );
  if (nowPointer == null) return null;

  const rInner = Math.hypot(
    nowPointer.radialLine.start.x,
    nowPointer.radialLine.start.y,
  );

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
  };
}

/**
 * @param {unknown} v
 * @param {number} fallback
 */
function numOr(v, fallback) {
  return typeof v === "number" && Number.isFinite(v) ? v : fallback;
}

