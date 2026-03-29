// TideMarks layout in diagram space. See docs/specs/tide-diagram.md §TideMarks.
// TimePointer: local half-circle with arc midpoint at max-X (r,0); then placement;
// lines are pRef → arc endpoints only (derived from the final arc).

import { polar, timeToTheta } from "./tideDiagramModel.mjs";

/**
 * Rotate point CCW by `theta` (diagram space, y up).
 * @param {number} theta
 * @param {{ x: number, y: number }} p
 */
function rotPt(theta, p) {
  const c = Math.cos(theta);
  const s = Math.sin(theta);
  return { x: c * p.x - s * p.y, y: s * p.x + c * p.y };
}

/**
 * @param {number} theta
 * @param {{ x: number, y: number }} centre
 * @param {{ x: number, y: number }} pLocal
 * @returns {import('./tideDiagramModel.mjs').DiagramPoint}
 */
function localToWorld(theta, centre, pLocal) {
  const q = rotPt(theta, pLocal);
  return { x: q.x + centre.x, y: q.y + centre.y };
}

/**
 * @param {{
 *   refRadius: number,
 *   thetaLeft: number,
 *   thetaRight: number,
 *   tideLabelRadius: number,
 *   heightLabelSizeK: number,
 *   timeLabelSizeK: number,
 *   timePointerUniversalRadiusK: number,
 *   timePointerInset: number,
 *   markers: { t: number, heightText: string, timeText: string }[],
 * }} params
 * @returns {import('./tideDiagramModel.mjs').TideMarkDiagram[]}
 */
export function layoutTideMarks(params) {
  const {
    refRadius,
    thetaLeft,
    thetaRight,
    tideLabelRadius,
    heightLabelSizeK,
    timeLabelSizeK,
    timePointerUniversalRadiusK,
    timePointerInset,
    markers,
  } = params;
  const R = refRadius;
  const inset = clamp01(timePointerInset);
  const rU = timePointerUniversalRadiusK * R;

  /** Radial separation of height vs time anchors (spec gives one label radius for both). */
  const dk =
    0.45 * (heightLabelSizeK + timeLabelSizeK);

  /** @type {import('./tideDiagramModel.mjs').TideMarkDiagram[]} */
  const out = [];
  for (const m of markers) {
    const t = m.t;
    if (typeof t !== "number" || !Number.isFinite(t) || t < 0 || t > 24) {
      continue;
    }
    const theta = timeToTheta(t, thetaLeft, thetaRight);
    const baselineAngle = theta - Math.PI / 2;

    const rHeight = (tideLabelRadius + dk) * R;
    const rTime = (tideLabelRadius - dk) * R;
    const heightAnchor = polar(rHeight, theta);
    const timeAnchor = polar(rTime, theta);

    const centre = polar((1 - inset) * R, theta);
    const pRef = polar(R, theta);

    const startLocal = { x: 0, y: -rU };
    const arcStart = localToWorld(theta, centre, startLocal);
    const sweepRad = Math.PI;

    const line0 = { start: { ...pRef }, end: { ...arcStart } };
    const endLocal = { x: 0, y: rU };
    const arcEnd = localToWorld(theta, centre, endLocal);
    const line1 = { start: { ...pRef }, end: { ...arcEnd } };

    out.push({
      timeHours: t,
      theta,
      heightLabel: {
        content: m.heightText,
        fontSize: heightLabelSizeK * R,
        anchor: heightAnchor,
        angleRad: baselineAngle,
      },
      timeLabel: {
        content: m.timeText,
        fontSize: timeLabelSizeK * R,
        anchor: timeAnchor,
        angleRad: baselineAngle,
      },
      timePointer: {
        center: { ...centre },
        radius: rU,
        arcStart,
        sweepRad,
        lines: [line0, line1],
      },
    });
  }
  return out;
}

/**
 * @param {Record<string, unknown>} spec
 * @param {number} refRadius
 * @param {number} thetaLeft
 * @param {number} thetaRight
 * @returns {import('./tideDiagramModel.mjs').TideMarkDiagram[]}
 */
export function buildTideMarksFromSpec(spec, refRadius, thetaLeft, thetaRight) {
  const raw = spec.tideMarks;
  if (raw == null || typeof raw !== "object") return [];
  const o = /** @type {Record<string, unknown>} */ (raw);
  const markersRaw = o.markers;
  if (!Array.isArray(markersRaw) || markersRaw.length === 0) return [];

  const tideLabelRadius = numOr(o.tideLabelRadius, 0.82);
  const heightLabelSizeK = numOr(o.tideHeightLabelSize, 0.055);
  const timeLabelSizeK = numOr(o.tideTimeLabelSize, 0.048);
  const timePointerUniversalRadiusK = numOr(o.timePointerUniversalRadius, 0.06);
  const timePointerInset = numOr(o.timePointerInset, 0.12);

  /** @type {{ t: number, heightText: string, timeText: string }[]} */
  const markers = [];
  for (const row of markersRaw) {
    if (row == null || typeof row !== "object") continue;
    const r = /** @type {Record<string, unknown>} */ (row);
    const t = r.t;
    const heightText = r.heightText;
    const timeText = r.timeText;
    if (typeof t !== "number" || !Number.isFinite(t)) continue;
    if (typeof heightText !== "string" || typeof timeText !== "string") continue;
    markers.push({ t, heightText, timeText });
  }

  if (markers.length === 0) return [];

  return layoutTideMarks({
    refRadius,
    thetaLeft,
    thetaRight,
    tideLabelRadius,
    heightLabelSizeK,
    timeLabelSizeK,
    timePointerUniversalRadiusK,
    timePointerInset,
    markers,
  });
}

/**
 * @param {unknown} v
 * @param {number} fallback
 */
function numOr(v, fallback) {
  return typeof v === "number" && Number.isFinite(v) ? v : fallback;
}

/**
 * @param {number} x
 */
function clamp01(x) {
  if (!Number.isFinite(x)) return 0;
  return Math.min(1, Math.max(0, x));
}
