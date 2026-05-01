/**
 * tideMarks.mjs — Tide mark rows (labels + time pointers) in diagram space from `spec.tideMarks`.
 * Kind: Pipeline stage (layout submodule). Does not derive next-tide semantics.
 *
 * See docs/specs/tide-diagram.md (TideMarks).
 *
 * Policies for {@link buildTideMarksFromSpec}:
 * - `spec.tideMarks` is required (plain object); `markers` must be a non-empty array.
 * - Each marker row must be an object with string `heightText`, `highOrLow` ∈ {`High`,`Low`}, and `time` in strict
 *   canonical `HH:MM:SS` other than `24:00:00` (that sentinel is invalid for tide markers).
 * - Numeric layout keys on `tideMarks` are required (finite numbers; see spec).
 * - Duplicate canonical marker times throw.
 */

import { polar, timeToTheta } from "../model/tideDiagramModel.mjs";
import { parseCanonicalTimeOrThrow } from "../model/timeCanonical.mjs";
import { requireFiniteNumber, requirePlainObject, requireString } from "./specRequire.mjs";

/**
 * One marker after spec parsing: fractional hour on the dial, display strings, canonical time key.
 *
 * @typedef {{
 *   t: number,
 *   canonicalTime: string,
 *   heightText: string,
 *   isFuture: boolean,
 * }} LayoutTideMarkInput
 */

/**
 * @typedef {{
 *   refRadius: number,
 *   annularBandWidth: number,
 *   thetaLeft: number,
 *   thetaRight: number,
 *   tideLabelRadius: number,
 *   heightLabelSizeK: number,
 *   tideMarkArrowDivergence: number,
 *   tideMarkArrowLineLen: number,
 *   markers: LayoutTideMarkInput[],
 * }} LayoutTideMarksParams
 */

/**
 * Pure layout: maps each marker to diagram-space labels and time pointer geometry.
 *
 * @param {LayoutTideMarksParams} params — `markers` must be non-empty (callers validate via {@link parseTideMarksMarkerRowsOrThrow}).
 * @returns {import('../model/tideDiagramModel.mjs').TideMarkDiagram[]}
 */
export function layoutTideMarks(params) {
  const {
    refRadius,
    annularBandWidth,
    thetaLeft,
    thetaRight,
    tideLabelRadius,
    heightLabelSizeK,
    tideMarkArrowDivergence,
    tideMarkArrowLineLen,
    markers,
  } = params;
  const R = refRadius;
  const outerBandRadius = R * (1 + annularBandWidth);
  const halfAngle = 0.5 * tideMarkArrowDivergence;
  const offsetR = tideMarkArrowLineLen * R;

  /** @type {import('../model/tideDiagramModel.mjs').TideMarkDiagram[]} */
  const out = [];
  for (const m of markers) {
    const t = m.t;
    const theta = timeToTheta(t, thetaLeft, thetaRight);
    const rLabel = tideLabelRadius * R;
    const arcCenter = { x: 0, y: 0 };
    const charW = 0.6;
    const estChord =
      Math.max(1, m.heightText.length) * heightLabelSizeK * R * charW;
    const arcSweepRad = Math.max(0.12, Math.min(1.15, estChord / rLabel));
    const heightThetaStart = theta - 0.5 * arcSweepRad;
    const heightAnchor = polar(rLabel, heightThetaStart);

    const v1 = polar(outerBandRadius, theta);
    const v2Offset = polar(offsetR, theta + halfAngle);
    const v3Offset = polar(offsetR, theta - halfAngle);
    const v2 = { x: v1.x + v2Offset.x, y: v1.y + v2Offset.y };
    const v3 = { x: v1.x + v3Offset.x, y: v1.y + v3Offset.y };

    const circleCenter = normalLineIntersection(v1, v2, v3);
    const circleRadius = Math.hypot(circleCenter.x - v2.x, circleCenter.y - v2.y);

    out.push({
      timeHours: t,
      theta,
      temporalClass: m.isFuture ? "future" : "past",
      heightLabel: {
        content: m.heightText,
        fontSize: heightLabelSizeK * R,
        anchor: heightAnchor,
        arcCenter,
        arcSweepRad,
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
 * Parse and validate `spec.tideMarks.markers` for layout and next-tide logic (shared rules).
 *
 * @param {unknown} markersRaw
 * @returns {Array<{ seconds: number, hours: number, canonicalTime: string, heightText: string, kind: string }>}
 */
export function parseTideMarksMarkerRowsOrThrow(markersRaw) {
  if (!Array.isArray(markersRaw)) {
    throw new Error("spec.tideMarks.markers must be an array");
  }
  if (markersRaw.length === 0) {
    throw new Error("spec.tideMarks.markers must be non-empty");
  }

  /** @type {Array<{ seconds: number, hours: number, canonicalTime: string, heightText: string, kind: string }>} */
  const out = [];
  for (let i = 0; i < markersRaw.length; i += 1) {
    const row = markersRaw[i];
    if (row == null || typeof row !== "object") {
      throw new Error(`spec.tideMarks.markers[${i}] must be an object`);
    }
    const r = /** @type {Record<string, unknown>} */ (row);
    const heightText = requireString(
      r.heightText,
      `spec.tideMarks.markers[${i}].heightText`,
    );
    const kind = requireString(
      r.highOrLow,
      `spec.tideMarks.markers[${i}].highOrLow`,
    );
    if (kind !== "High" && kind !== "Low") {
      throw new Error(
        `spec.tideMarks.markers[${i}].highOrLow must be "High" or "Low"`,
      );
    }
    const parsed = parseCanonicalTimeOrThrow(
      r.time,
      `spec.tideMarks.markers[${i}].time`,
    );
    if (parsed.isRightEndpoint) {
      throw new Error(
        `spec.tideMarks.markers[${i}].time must not be "24:00:00" (tide markers use 00:00:00–23:59:59 only)`,
      );
    }
    out.push({
      seconds: parsed.seconds,
      hours: parsed.hours,
      canonicalTime: parsed.canonical,
      heightText,
      kind,
    });
  }

  const seen = new Set();
  for (const marker of out) {
    if (seen.has(marker.canonicalTime)) {
      throw new Error(
        `duplicate tideMarks marker time "${marker.canonicalTime}"`,
      );
    }
    seen.add(marker.canonicalTime);
  }

  return out;
}

/**
 * Read `spec.tideMarks` and lay out tide marks for the given ref arc angles.
 *
 * @param {Record<string, unknown>} spec
 * @param {number} refRadius
 * @param {number} thetaLeft
 * @param {number} thetaRight
 * @returns {import('../model/tideDiagramModel.mjs').TideMarkDiagram[]}
 * @throws {Error} invalid marker rows, duplicate times, or missing layout keys
 */
export function buildTideMarksFromSpec(spec, refRadius, thetaLeft, thetaRight) {
  const o = requirePlainObject(spec.tideMarks, "spec.tideMarks");
  const annularBand = requirePlainObject(spec.annularBand, "spec.annularBand");
  const parsedRows = parseTideMarksMarkerRowsOrThrow(o.markers);
  const parsedNow = parseCanonicalTimeOrThrow(spec.timeNow, "spec.timeNow");
  if (parsedNow.isRightEndpoint) {
    throw new Error('spec.timeNow cannot be "24:00:00"');
  }

  const tideLabelRadius = requireFiniteNumber(
    o.tideLabelRadius,
    "spec.tideMarks.tideLabelRadius",
  );
  const heightLabelSizeK = requireFiniteNumber(
    o.tideHeightLabelSize,
    "spec.tideMarks.tideHeightLabelSize",
  );
  const tideMarkArrowDivergence = Math.max(
    0,
    requireFiniteNumber(
      o.tideMarkArrowDivergence,
      "spec.tideMarks.tideMarkArrowDivergence",
    ),
  );
  const tideMarkArrowLineLen = Math.max(
    0,
    requireFiniteNumber(
      o.tideMarkArrowLineLen,
      "spec.tideMarks.tideMarkArrowLineLen",
    ),
  );
  const annularBandWidth = requireFiniteNumber(
    annularBand.annularBandWidth,
    "spec.annularBand.annularBandWidth",
  );

  const semanticRaw = spec.semantic;
  const semantic =
    semanticRaw != null && typeof semanticRaw === "object"
      ? /** @type {Record<string, unknown>} */ (semanticRaw)
      : null;
  const hasExplicitNoNextTide =
    semantic != null &&
    Object.prototype.hasOwnProperty.call(semantic, "nextTide") &&
    semantic.nextTide === null;
  const hasAnyMarkerAtOrAfterNow = parsedRows.some(
    (row) => row.seconds >= parsedNow.seconds,
  );
  const shouldForceAllFuture = hasExplicitNoNextTide || !hasAnyMarkerAtOrAfterNow;

  /** @type {LayoutTideMarkInput[]} */
  const markers = parsedRows.map((row) => ({
    t: row.hours,
    canonicalTime: row.canonicalTime,
    heightText: row.heightText,
    isFuture: shouldForceAllFuture || row.seconds >= parsedNow.seconds,
  }));

  return layoutTideMarks({
    refRadius,
    annularBandWidth,
    thetaLeft,
    thetaRight,
    tideLabelRadius,
    heightLabelSizeK,
    tideMarkArrowDivergence,
    tideMarkArrowLineLen,
    markers,
  });
}
