// NowPointer radial line in diagram space. See docs/specs/tide-diagram.md §NowPointer.
import { polar, timeToTheta } from "./tideDiagramModel.mjs";
import { parseCanonicalTimeOrThrow } from "./timeCanonical.mjs";

const DEFAULT_LINE_INNER = 0.4;
const DEFAULT_LINE_OUTER = 0.6;
const DEFAULT_LABEL_SIZE = 0.04;
const DEFAULT_LABEL_NORMAL_OFFSET = 0;

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
  const parsedNow = parseCanonicalTimeOrThrow(
    spec.timeNow,
    "spec.timeNow",
  );
  if (parsedNow.isRightEndpoint) {
    throw new Error('spec.timeNow cannot be "24:00:00"');
  }
  const t = parsedNow.hours;

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
  const mid = {
    x: 0.5 * (start.x + end.x),
    y: 0.5 * (start.y + end.y),
  };
  const normalOffsetK = numOr(
    o.nowPointerLabelNormalOffset ?? o.NowPointerLabelNormalOffset,
    DEFAULT_LABEL_NORMAL_OFFSET,
  );
  // Branch A: t ≤ 12; Branch B: t > 12. See docs/specs/tide-diagram.md §NowPointer (Now label).
  const nowLabelBranch = t <= 12 ? "A" : "B";

  const { anchor, baselineAngle } = nowLabelPlacement(nowLabelBranch, theta, mid, {
    normalOffsetK,
    refRadius,
  });

  return {
    timeHours: t,
    theta,
    nowLabelBranch,
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
 * Anchor and baseline for the "now" label: A = t≤12 (θ+π, −û_n), B = t>12 (θ+2π, +û_n).
 * @param {'A' | 'B'} branch
 * @param {number} theta
 * @param {{ x: number, y: number }} mid midpoint of the Now radial line
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
 * @param {unknown} v
 * @param {number} fallback
 */
function numOr(v, fallback) {
  return typeof v === "number" && Number.isFinite(v) ? v : fallback;
}
