/**
 * tideMarks.mjs — Tide mark rows (labels + time pointers) in diagram space from `spec.tideMarks`.
 * Kind: Pipeline stage (layout submodule). Does not derive next-tide semantics.
 *
 * See docs/specs/tide-diagram.md (TideMarks).
 *
 * Policies for {@link buildTideMarksFromSpec}:
 * - Returns `[]` when `tideMarks` is missing, not a plain object, `markers` missing, empty, or
 *   yields no usable rows (skips non-objects, non-string `heightText`, right-endpoint times).
 * - Throws from {@link parseCanonicalTimeOrThrow} on invalid marker times, and on duplicate
 *   canonical times after filtering.
 */

import { polar, timeToTheta } from "../model/tideDiagramModel.mjs";
import {
  formatCanonicalHHMM,
  parseCanonicalTimeOrThrow,
} from "../model/timeCanonical.mjs";

/**
 * One marker after spec parsing: fractional hour on the dial, display strings, canonical time key.
 *
 * @typedef {{
 *   t: number,
 *   canonicalTime: string,
 *   heightText: string,
 *   timeText: string,
 * }} LayoutTideMarkInput
 */

/**
 * @typedef {{
 *   refRadius: number,
 *   thetaLeft: number,
 *   thetaRight: number,
 *   tideHeightLabelRadius: number,
 *   tideTimeLabelRadius: number,
 *   heightLabelSizeK: number,
 *   timeLabelSizeK: number,
 *   tideMarkArrowDivergence: number,
 *   tideMarkArrowLineLen: number,
 *   markers: LayoutTideMarkInput[],
 * }} LayoutTideMarksParams
 */

/**
 * Pure layout: maps each marker to diagram-space labels and time pointer geometry.
 *
 * @param {LayoutTideMarksParams} params — `markers` is typically non-empty; an empty array returns `[]`.
 * @returns {import('../model/tideDiagramModel.mjs').TideMarkDiagram[]}
 */
export function layoutTideMarks(params) {
  const {
    refRadius,
    thetaLeft,
    thetaRight,
    tideHeightLabelRadius,
    tideTimeLabelRadius,
    heightLabelSizeK,
    timeLabelSizeK,
    tideMarkArrowDivergence,
    tideMarkArrowLineLen,
    markers,
  } = params;
  const R = refRadius;
  const halfAngle = 0.5 * tideMarkArrowDivergence;
  const offsetR = tideMarkArrowLineLen * R;

  /** @type {import('../model/tideDiagramModel.mjs').TideMarkDiagram[]} */
  const out = [];
  for (const m of markers) {
    const t = m.t;
    const theta = timeToTheta(t, thetaLeft, thetaRight);
    const baselineAngle = theta + Math.PI / 2;

    const rHeight = tideHeightLabelRadius * R;
    const rTime = tideTimeLabelRadius * R;
    const heightAnchor = polar(rHeight, theta);
    const timeAnchor = polar(rTime, theta);

    const v1 = polar(R, theta);
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
 * Intersection of lines through `v2` and `v3` perpendicular to `v1→v2` and `v1→v3` (triangle “normals”).
 * Used for the time-pointer incircle center.
 *
 * When the normals are parallel or the system is nearly singular, returns the midpoint of `v2`–`v3`
 * so layout still produces finite coordinates.
 *
 * @param {{ x: number, y: number }} v1
 * @param {{ x: number, y: number }} v2
 * @param {{ x: number, y: number }} v3
 * @returns {{ x: number, y: number }}
 */
function normalLineIntersection(v1, v2, v3) {
  const d1x = v2.x - v1.x;
  const d1y = v2.y - v1.y;
  const d2x = v3.x - v1.x;
  const d2y = v3.y - v1.y;

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
 * Read `spec.tideMarks` and lay out tide marks for the given ref arc angles.
 *
 * Numeric styling keys are optional on the spec object; defaults match historical diagram presets
 * (`tideLabelRadius` 0.82, height/time size K, arrow divergence 1.0 rad, arrow line len 0.1).
 * Accepts legacy aliases `TideMarkArrowDivergence` / `TideMarkArrowLineLen` and falls back height/time
 * radii to `tideLabelRadius` when the specific keys are absent.
 *
 * @param {Record<string, unknown>} spec
 * @param {number} refRadius
 * @param {number} thetaLeft
 * @param {number} thetaRight
 * @returns {import('../model/tideDiagramModel.mjs').TideMarkDiagram[]}
 * @throws {Error} invalid marker time (via {@link parseCanonicalTimeOrThrow}) or duplicate canonical time
 */
export function buildTideMarksFromSpec(spec, refRadius, thetaLeft, thetaRight) {
  const raw = spec.tideMarks;
  if (raw == null || typeof raw !== "object") return [];
  const o = /** @type {Record<string, unknown>} */ (raw);
  const markersRaw = o.markers;
  if (!Array.isArray(markersRaw) || markersRaw.length === 0) return [];

  const tideLabelRadiusLegacy = numOr(o.tideLabelRadius, 0.82);
  const tideHeightLabelRadius = numOr(
    o.tideHeightLabelRadius,
    tideLabelRadiusLegacy,
  );
  const tideTimeLabelRadius = numOr(
    o.tideTimeLabelRadius,
    tideLabelRadiusLegacy,
  );
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

  /** @type {LayoutTideMarkInput[]} */
  const markers = [];
  for (const row of markersRaw) {
    if (row == null || typeof row !== "object") continue;
    const r = /** @type {Record<string, unknown>} */ (row);
    const heightText = r.heightText;
    const canonicalTime = r.time;
    if (typeof heightText !== "string") continue;
    const parsed = parseCanonicalTimeOrThrow(
      canonicalTime,
      "tideMarks.markers[].time",
    );
    if (parsed.isRightEndpoint) continue;
    markers.push({
      t: parsed.hours,
      canonicalTime: parsed.canonical,
      heightText,
      timeText: formatCanonicalHHMM(parsed.canonical),
    });
  }

  if (markers.length === 0) return [];

  const seen = new Set();
  for (const marker of markers) {
    if (seen.has(marker.canonicalTime)) {
      throw new Error(
        `duplicate tideMarks marker time "${marker.canonicalTime}"`,
      );
    }
    seen.add(marker.canonicalTime);
  }

  return layoutTideMarks({
    refRadius,
    thetaLeft,
    thetaRight,
    tideHeightLabelRadius,
    tideTimeLabelRadius,
    heightLabelSizeK,
    timeLabelSizeK,
    tideMarkArrowDivergence,
    tideMarkArrowLineLen,
    markers,
  });
}

/**
 * @param {unknown} v
 * @param {number} fallback — used only when `v` is not a finite number (optional spec fields).
 * @returns {number}
 */
function numOr(v, fallback) {
  return typeof v === "number" && Number.isFinite(v) ? v : fallback;
}
