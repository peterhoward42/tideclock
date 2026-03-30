// NowPointer radial line in diagram space. See docs/specs/tide-diagram.md §NowPointer.
import { polar, timeToTheta } from "./tideDiagramModel.mjs";

const DEFAULT_LINE_INNER = 0.4;
const DEFAULT_LINE_OUTER = 0.6;
const DEFAULT_LABEL_SIZE = 0.04;

/**
 * @param {Record<string, unknown>} spec
 * @param {number} refRadius
 * @param {number} thetaLeft
 * @param {number} thetaRight
 * @returns {import('./tideDiagramModel.mjs').NowPointerDiagram | null}
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
  const t = o.t;
  if (typeof t !== "number" || !Number.isFinite(t) || t < 0 || t > 24) {
    return null;
  }

  const lineInnerK = numOr(
    o.nowPointerLineInnerRadius ?? o.NowPointerLineInnerRadius,
    DEFAULT_LINE_INNER,
  );
  const lineOuterK = numOr(
    o.nowPointerLineOuterRadius ?? o.NowPointerLineOuterRadius,
    DEFAULT_LINE_OUTER,
  );
  const rInner = Math.max(0, lineInnerK) * refRadius;
  const rOuter = Math.max(0, lineOuterK) * refRadius;
  if (rOuter <= rInner) return null;

  const theta = timeToTheta(t, thetaLeft, thetaRight);
  const start = polar(rInner, theta);
  const end = polar(rOuter, theta);

  const labelSizeK = numOr(
    o.nowPointerLabelSize ?? o.NowPointerLabelSize,
    DEFAULT_LABEL_SIZE,
  );
  const fontSize = Math.max(0, labelSizeK) * refRadius;
  const anchor = {
    x: 0.5 * (start.x + end.x),
    y: 0.5 * (start.y + end.y),
  };
  const baselineAngle = theta + Math.PI;

  return {
    timeHours: t,
    theta,
    radialLine: { start, end },
    nowLabel: {
      content: "now",
      fontSize,
      anchor,
      angleRad: baselineAngle,
    },
  };
}

/**
 * @param {unknown} v
 * @param {number} fallback
 */
function numOr(v, fallback) {
  return typeof v === "number" && Number.isFinite(v) ? v : fallback;
}
