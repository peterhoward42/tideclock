// TideMarks layout in diagram space. See docs/specs/tide-diagram.md §TideMarks.
// TimePointer: filled triangle + filled circle derived from divergence & line length inputs.
// Triangle vertices are defined in the diagram by:
//   v1 = point on RefArc at time t
//   v2/v3 = polar offsets from v1 at angle theta(t) + PI +/- 0.5 * divergence
// Circle center is the intersection of normals drawn from v2 and v3:
//   line1 = segment v1->v2, line2 = segment v1->v3
//   radial1 = normal to line1 through v2
//   radial2 = normal to line2 through v3
//   center = intersection(radial1, radial2), radius = |center - v2|

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

    const circleCenter = normalLineIntersection(v1, v2, v3);
    const circleRadius = Math.hypot(circleCenter.x - v2.x, circleCenter.y - v2.y);

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
 * Intersect normals from v2 and v3 as specified for TimePointer in tide-diagram.md.
 * If the normal lines are near-parallel, fall back to midpoint(v2, v3).
 *
 * @param {{x:number,y:number}} v1
 * @param {{x:number,y:number}} v2
 * @param {{x:number,y:number}} v3
 * @returns {{x:number,y:number}}
 */
function normalLineIntersection(v1, v2, v3) {
  const d1x = v2.x - v1.x;
  const d1y = v2.y - v1.y;
  const d2x = v3.x - v1.x;
  const d2y = v3.y - v1.y;

  // Any 90deg rotation gives a valid normal direction.
  const n1x = -d1y;
  const n1y = d1x;
  const n2x = -d2y;
  const n2y = d2x;

  const denom = n1x * (-n2y) - n1y * (-n2x);
  if (!Number.isFinite(denom) || Math.abs(denom) < 1e-9) {
    return { x: 0.5 * (v2.x + v3.x), y: 0.5 * (v2.y + v3.y) };
  }

  const bx = v3.x - v2.x;
  const by = v3.y - v2.y;
  const t = (bx * (-n2y) - by * (-n2x)) / denom;
  return { x: v2.x + t * n1x, y: v2.y + t * n1y };
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
