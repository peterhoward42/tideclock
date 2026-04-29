/**
 * centreFrame.mjs — **R_frame** from `spec.centreFrame.frameArcRadius` for the CentreFrame arc in diagram space.
 * Independent of TimeDelta layout; see docs/specs/tide-diagram.md §CentreFrame.
 *
 * Policies for {@link buildCentreFrameDiagramFromSpec}:
 * - Throws when `spec.centreFrame` is missing or not a plain object.
 * - Throws when `centreFrame.frameArcRadius` is not a finite number.
 */

import { refArcAngles } from "../model/tideDiagramModel.mjs";
import { requireFiniteNumber, requirePlainObject } from "./specRequire.mjs";

/**
 * @param {Record<string, unknown>} spec
 * @returns {number} proportion **k** for **R_frame** = **k·R** (**§Sizing**)
 */
function readFrameArcRadiusK(spec) {
  const o = requirePlainObject(spec.centreFrame, "spec.centreFrame");
  return requireFiniteNumber(o.frameArcRadius, "spec.centreFrame.frameArcRadius");
}

/**
 * **R_frame** in px: same **k·R** as the CentreFrame arc.
 *
 * @param {Record<string, unknown>} spec
 * @param {number} refRadius
 * @returns {number}
 */
export function readRFramePx(spec, refRadius) {
  const k = readFrameArcRadiusK(spec);
  return Math.max(0, k) * refRadius;
}

/**
 * @param {number} refRadius
 * @param {number} sweepRad same subtended angle as RefArc (radians)
 * @param {number} frameArcRadius proportion of RefRadius (CentreFrame arc radius)
 * @returns {import('../model/tideDiagramModel.mjs').CentreFrameDiagram}
 */
export function layoutCentreFrameDiagram(refRadius, sweepRad, frameArcRadius) {
  const R = refRadius;
  const { thetaLeft, thetaRight } = refArcAngles(sweepRad);
  const rFrame = frameArcRadius * R;
  return {
    frameArc: {
      center: { x: 0, y: 0 },
      radius: rFrame,
      sweepRad,
      thetaLeft,
      thetaRight,
    },
  };
}

/**
 * @param {Record<string, unknown>} spec
 * @param {number} refRadius
 * @param {number} sweepRad
 * @returns {import('../model/tideDiagramModel.mjs').CentreFrameDiagram}
 */
export function buildCentreFrameDiagramFromSpec(spec, refRadius, sweepRad) {
  const frameArcRadius = readFrameArcRadiusK(spec);
  return layoutCentreFrameDiagram(refRadius, sweepRad, frameArcRadius);
}
