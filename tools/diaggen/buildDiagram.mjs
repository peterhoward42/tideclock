// `buildDiagram` reads the same shape of inputs as scenegen’s spec (`title`, `canvas`, plus
// diagram fields like `refRadius`) and returns a tide diagram document; `gen.mjs` then passes
// that to `toScene.mjs` for the shared HTML preview.
import { buildCentreClusterFromSpec } from "./centreCluster.mjs";
import { buildNowPointerFromSpec } from "./nowPointer.mjs";
import { buildNextPointerFromSpec } from "./nextPointer.mjs";
import { buildTideMarksFromSpec } from "./tideMarks.mjs";
import { parseCanonicalTimeOrThrow } from "./timeCanonical.mjs";
import { computeNextTideEventCore } from "./tideEvents.mjs";
import {
  diagramBoxFromExtents,
  polar,
  refArcAngles,
  timeToTheta,
} from "./tideDiagramModel.mjs";

/**
 * @param {Record<string, unknown>} spec
 * @returns {import('./tideDiagramModel.mjs').TideDiagramDocument}
 */
export function buildDiagram(spec) {
  const width =
    typeof spec.canvas?.width === "number" ? spec.canvas.width : 400;
  const height =
    typeof spec.canvas?.height === "number" ? spec.canvas.height : 300;
  const title =
    typeof spec.title === "string" ? spec.title : "tide diagram";

  const refRadius =
    typeof spec.refRadius === "number" ? spec.refRadius : 100;
  const sweepRad =
    typeof spec.sweepRad === "number"
      ? spec.sweepRad
      : Math.PI * 0.92;
  const tickLen =
    typeof spec.tickLen === "number" ? spec.tickLen : 0.08;

  const tickLabelSize =
    typeof spec.tickLabelSize === "number"
      ? spec.tickLabelSize
      : 1.5 * tickLen;
  const tickLabelClearance =
    typeof spec.tickLabelClearance === "number"
      ? spec.tickLabelClearance
      : 3 * tickLen;

  const { thetaLeft, thetaRight } = refArcAngles(sweepRad);
  const rInner = 1.0 * refRadius;
  const rOuter = (1.0 + tickLen) * refRadius;

  /** @type {import('./tideDiagramModel.mjs').TickMarkSpec[]} */
  const tickMarks = [];
  for (let h = 0; h <= 24; h += 1) {
    const theta = timeToTheta(h, thetaLeft, thetaRight);
    tickMarks.push({
      hour: h,
      theta,
      start: polar(rInner, theta),
      end: polar(rOuter, theta),
    });
  }

  const byHour = new Map(tickMarks.map((tm) => [tm.hour, tm]));
  /** @type {import('./tideDiagramModel.mjs').TickLabelSpec[]} */
  const tickLabels = [];
  const labelHours = readTickLabelHours(spec);
  for (const h of labelHours) {
    const tm = byHour.get(h);
    if (!tm) continue;
    const fontSize = tickLabelSize * refRadius;
    const outward = polar(tickLabelClearance * refRadius, tm.theta);
    const anchor = {
      x: tm.end.x + outward.x,
      y: tm.end.y + outward.y - 0.5 * fontSize,
    };
    tickLabels.push({
      hour: h,
      theta: tm.theta,
      content: formatHourDigits(h),
      fontSize,
      anchor,
    });
  }

  const extents = requireContentBoundsExtents(spec);
  const rect = diagramBoxFromExtents(
    extents.left,
    extents.right,
    extents.above,
    extents.below,
    refRadius,
  );
  const contentBounds = { extents, rect };

  const centreCluster = buildCentreClusterFromSpec(spec);

  const tideMarks = buildTideMarksFromSpec(
    spec,
    refRadius,
    thetaLeft,
    thetaRight,
  );

  const nowPointer = buildNowPointerFromSpec(
    spec,
    refRadius,
    thetaLeft,
    thetaRight,
  );

  const nextPointer = buildNextPointerFromSpec(
    spec,
    refRadius,
    thetaLeft,
    thetaRight,
  );
  const waitArc = buildWaitArcFromSpec(spec, refRadius, thetaLeft, thetaRight);

  return {
    version: 1,
    meta: { title, width, height },
    refArc: {
      center: { x: 0, y: 0 },
      refRadius,
      sweepRad,
      thetaLeft,
      thetaRight,
    },
    tickMarks,
    tickLabels,
    tideMarks,
    nowPointer,
    nextPointer,
    waitArc,
    centreCluster,
    contentBounds,
  };
}

/**
 * Required `contentBounds` on the spec: four non-negative RefRadius multiples (diagram model space).
 * @param {Record<string, unknown>} spec
 * @returns {import('./tideDiagramModel.mjs').ContentBoundsExtents}
 */
function requireContentBoundsExtents(spec) {
  const raw = spec.contentBounds;
  if (raw == null || typeof raw !== "object") {
    throw new Error(
      "spec.contentBounds is required: object { left, right, above, below } (non-negative RefRadius multiples)",
    );
  }
  const o = /** @type {Record<string, unknown>} */ (raw);
  const left = o.left;
  const right = o.right;
  const above = o.above;
  const below = o.below;
  if (
    ![left, right, above, below].every(
      (v) => typeof v === "number" && Number.isFinite(v) && v >= 0,
    )
  ) {
    throw new Error(
      "spec.contentBounds must set left, right, above, below to finite numbers ≥ 0",
    );
  }
  return {
    left: /** @type {number} */ (left),
    right: /** @type {number} */ (right),
    above: /** @type {number} */ (above),
    below: /** @type {number} */ (below),
  };
}

/**
 * @param {Record<string, unknown>} spec
 * @returns {number[]}
 */
function readTickLabelHours(spec) {
  const raw = spec.tickLabelHours;
  if (!Array.isArray(raw)) return [];
  /** @type {number[]} */
  const out = [];
  for (const v of raw) {
    if (typeof v !== "number" || !Number.isInteger(v) || v < 0 || v > 24) {
      continue;
    }
    out.push(v);
  }
  return out;
}

/**
 * @param {number} h hour 0..24
 */
function formatHourDigits(h) {
  return String(h).padStart(2, "0");
}

/**
 * WaitArc: concentric to RefArc, sweeps CCW from now to next tide event.
 * Arrowhead is renderer-owned; diagram only carries metadata intent.
 *
 * @param {Record<string, unknown>} spec
 * @param {number} refRadius
 * @param {number} thetaLeft
 * @param {number} thetaRight
 * @returns {import('./tideDiagramModel.mjs').WaitArcDiagram | null}
 */
function buildWaitArcFromSpec(spec, refRadius, thetaLeft, thetaRight) {
  const raw = spec.waitArc;
  const o = raw != null && typeof raw === "object"
    ? /** @type {Record<string, unknown>} */ (raw)
    : {};

  const radiusK = numOr(
    o.radius ?? o.waitArcRadius ?? spec.waitArcRadius ?? spec.WaitArcRadius,
    1.0,
  );
  const radius = Math.max(0, radiusK) * refRadius;
  if (radius <= 0) return null;

  const parsedNow = parseCanonicalTimeOrThrow(spec.timeNow, "spec.timeNow");
  if (parsedNow.isRightEndpoint) {
    throw new Error('spec.timeNow cannot be "24:00:00"');
  }
  const core = computeNextTideEventCore(spec, parsedNow);
  if (core == null) return null;

  const nowTheta = timeToTheta(parsedNow.hours, thetaLeft, thetaRight);
  const nextTheta = timeToTheta(core.seconds / 3600, thetaLeft, thetaRight);

  return {
    center: { x: 0, y: 0 },
    radius,
    thetaStart: nowTheta,
    sweepRad: Math.max(0, nextTheta - nowTheta),
    arrow: {
      at: "end",
      lengthK: numOr(o.arrow?.lengthK, 7),
      widthK: numOr(o.arrow?.widthK, 5),
      insetK: numOr(o.arrow?.insetK, 0),
      style: o.arrow?.style === "open" ? "open" : "filled",
      scaleWithStroke: o.arrow?.scaleWithStroke !== false,
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
