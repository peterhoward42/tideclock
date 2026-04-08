/**
 * nextPointer.mjs — Next-tide radial pointer layout in diagram space.
 * Depends on now-pointer geometry and tide-event core. Kind: Pipeline stage (layout submodule).
 *
 * See docs/specs/tide-diagram.md (NextPointer). Emits a NextPointerDiagram or `null` when layout cannot proceed.
 *
 * Policies for {@link buildNextPointerFromSpec}:
 * - `spec.nextPointer` is required (plain object) with nested `radialLine.outerRadius` finite **> 0** (**k·R**).
 * - Throws when **r_outer ≤ r_inner** (line end not outside **R_frame**).
 * - Throws from {@link parseCanonicalTimeOrThrow} when `spec.timeNow` is invalid or `24:00:00`.
 * - Returns `null` only when {@link computeNextTideEventCore} has no next tide at or after `timeNow` on the civil day.
 * - Circle radius is **σ·R_frame** (fixed **σ** in spec).
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
  const o = requirePlainObject(spec.nextPointer, "spec.nextPointer");

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
  if (!(lineOuterK > 0)) {
    throw new Error(
      "spec.nextPointer.radialLine.outerRadius must be a finite number greater than 0 (RefRadius multiple)",
    );
  }
  const rOuter = lineOuterK * refRadius;
  if (rOuter <= rInner) {
    throw new Error(
      "spec.nextPointer.radialLine.outerRadius must place the line end outside centreFrame.frameArcRadius (outer radius must exceed R_frame)",
    );
  }

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
