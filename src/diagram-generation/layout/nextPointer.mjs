/**
 * nextPointer.mjs — Next-tide radial pointer layout in diagram space.
 * Depends on now-pointer geometry and tide-event core. Kind: Pipeline stage (layout submodule).
 *
 * See docs/specs/tide-diagram.md (NextPointer). Emits a NextPointerDiagram or `null` when layout cannot proceed.
 *
 * Policies for {@link buildNextPointerFromSpec}:
 * - Returns `null` when `nextPointer` is missing or not a plain object.
 * - Throws from {@link parseCanonicalTimeOrThrow} when `spec.timeNow` is invalid; throws when `timeNow` is `24:00:00`.
 * - Returns `null` when {@link buildNowPointerFromSpec} is `null`, when
 *   outer ≤ inner along the next radial, or when {@link computeNextTideEventCore} has no next event.
 * - When `nextPointer` is present, `radialLine.outerRadius` is required (finite number). Circle radius is **σ·R_frame** (fixed **σ** in spec).
 */

import { polar, timeToTheta } from "../model/tideDiagramModel.mjs";
import { parseCanonicalTimeOrThrow } from "../model/timeCanonical.mjs";
import { readRFramePx } from "./centreFrame.mjs";
import { buildNowPointerFromSpec } from "./nowPointer.mjs";
import { computeNextTideEventCore } from "../model/tideEvents.mjs";
import { requireFiniteNumber, requirePlainObject } from "./specRequire.mjs";

/** @see docs/specs/tide-diagram.md — NextPointer (σ for r_circle = σ·R_frame) */
const NEXT_POINTER_CIRCLE_FRAME_SCALE = 1 / 35;

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

  const radialLineSpec = requirePlainObject(
    o.radialLine,
    "spec.nextPointer.radialLine",
  );

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
    rInner = readRFramePx(spec, refRadius);
  }

  const lineOuterK = requireFiniteNumber(
    radialLineSpec.outerRadius,
    "spec.nextPointer.radialLine.outerRadius",
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
  const rCircle = NEXT_POINTER_CIRCLE_FRAME_SCALE * readRFramePx(spec, refRadius);

  return {
    timeHours: tNextHours,
    theta,
    radialLine: { start, end },
    circle: { center: end, radius: rCircle },
  };
}
