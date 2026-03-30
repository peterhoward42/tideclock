// TideMarks layout in diagram space. See docs/specs/tide-diagram.md §TideMarks.
// TimePointer: filled triangle + filled circle derived from divergence & line length inputs.
// Triangle vertices are defined in the diagram by:
//   v1 = point on RefArc at time t
//   v2/v3 = polar offsets from v1 at angle theta(t) + PI +/- 0.5 * divergence
// Circle is centered at the midpoint of v2 -> v3 with radius 0.5 * |v2 - v3|.

import { polar, timeToTheta } from "./tideDiagramModel.mjs";

/**
 * @param {{
 *   refRadius: number,
 *   thetaLeft: number,
 *   thetaRight: number,
 *   tideLabelRadius: number,
 *   heightLabelSizeK: number,
 *   timeLabelSizeK: number,
 *   tideMarkArrowDivergence: number,
 *   tideMarkArrowLineLen: number,
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
    tideMarkArrowDivergence,
    tideMarkArrowLineLen,
    markers,
  } = params;
  const R = refRadius;
  const halfAngle = 0.5 * tideMarkArrowDivergence;
  const offsetR = tideMarkArrowLineLen * R;

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

    const v1 = polar(R, theta); // Vertex1 is on the RefArc at time t.
    const v2Offset = polar(offsetR, theta + Math.PI + halfAngle);
    const v3Offset = polar(offsetR, theta + Math.PI - halfAngle);
    const v2 = { x: v1.x + v2Offset.x, y: v1.y + v2Offset.y };
    const v3 = { x: v1.x + v3Offset.x, y: v1.y + v3Offset.y };

    const diaDx = v3.x - v2.x;
    const diaDy = v3.y - v2.y;
    const diaLen = Math.hypot(diaDx, diaDy);
    const circleRadius = 0.5 * diaLen;
    const circleCenter = {
      x: 0.5 * (v2.x + v3.x),
      y: 0.5 * (v2.y + v3.y),
    };

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
        triangle: { v1, v2, v3 },
        circle: { center: circleCenter, radius: circleRadius },
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
  const tideMarkArrowDivergence = Math.max(
    0,
    numOr(
    o.tideMarkArrowDivergence ?? o.TideMarkArrowDivergence,
    1.0,
  ),
  );
  const tideMarkArrowLineLen = Math.max(
    0,
    numOr(
    o.tideMarkArrowLineLen ?? o.TideMarkArrowLineLen,
    0.1,
  ),
  );

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
    tideMarkArrowDivergence,
    tideMarkArrowLineLen,
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
