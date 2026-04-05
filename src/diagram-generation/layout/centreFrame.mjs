/**
 * centreFrame.mjs — RefArc-parallel arc at **R_frame** (diagram space).
 * Independent of TimeDelta layout; see docs/specs/tide-diagram.md §CentreFrame.
 *
 * Policies for {@link buildCentreFrameDiagramFromSpec}:
 * - Throws when `spec.centreFrame` is missing or not a plain object.
 * - Throws when `centreFrame.frameArcRadius` is not a finite number.
 */

import { refArcAngles } from "../model/tideDiagramModel.mjs";
import { requireFiniteNumber, requirePlainObject } from "./specRequire.mjs";

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
  const o = requirePlainObject(spec.centreFrame, "spec.centreFrame");
  const frameArcRadius = requireFiniteNumber(
    o.frameArcRadius,
    "spec.centreFrame.frameArcRadius",
  );
  return layoutCentreFrameDiagram(refRadius, sweepRad, frameArcRadius);
}
