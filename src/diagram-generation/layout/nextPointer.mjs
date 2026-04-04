/**
 * nextPointer.mjs — Next-tide radial pointer layout in diagram space.
 * Depends on now-pointer geometry and tide-event core. Kind: Pipeline stage (layout submodule).
 *
 * See docs/specs/tide-diagram.md (NextPointer). Emits a NextPointerDiagram or `null` when layout cannot proceed.
 *
 * Policies for {@link buildNextPointerFromSpec}:
 * - Returns `null` when `nextPointer` is missing or not a plain object.
 * - Throws from {@link parseCanonicalTimeOrThrow} when `spec.timeNow` is invalid; throws when `timeNow` is `24:00:00`.
 * - Returns `null` when {@link buildNowPointerFromSpec} is `null`, when inner radius cannot be resolved, when
 *   outer ≤ inner along the next radial, or when {@link computeNextTideEventCore} has no next event.
 * - Numeric styling keys are optional; defaults match historical presets (`DEFAULT_LINE_OUTER`, `DEFAULT_CIRCLE_RADIUS`).
 */

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
 * Nested `radialLine` when present, else root carries line keys (legacy flat shape).
 *
 * @param {Record<string, unknown>} nextPointerRoot
 * @returns {Record<string, unknown>}
 */
function radialLineFieldsFrom(nextPointerRoot) {
  const nested = nextPointerRoot.radialLine;
  return nested && typeof nested === "object"
    ? /** @type {Record<string, unknown>} */ (nested)
    : nextPointerRoot;
}

/**
 * @param {Record<string, unknown>} spec
 * @param {number} refRadius
 * @param {number} thetaLeft — dial arc start (radians)
 * @param {number} thetaRight — dial arc end (radians)
 * @returns {import('../model/tideDiagramModel.mjs').NextPointerDiagram | null}
 * @throws {Error} invalid `spec.timeNow`, or `24:00:00` (right endpoint)
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

  const radialLineSpec = radialLineFieldsFrom(o);

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
 * @param {number} fallback — used only when `v` is not a finite number (optional spec fields).
 * @returns {number}
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
  const nested = nextSpec.circle;
  const circleSpec =
    nested && typeof nested === "object"
      ? /** @type {Record<string, unknown>} */ (nested)
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
