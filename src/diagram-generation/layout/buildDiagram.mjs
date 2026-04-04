// Orchestrates layout modules into a TideDiagramDocument from an open spec object.
// See docs/specs/tide-diagram.md; spec keys mirror the open object passed from the app (diagramGenerationCollaborator.ts).
//
// Policies for {@link buildDiagram}:
// - Throws if `spec.contentBounds` is missing or not `{ left, right, above, below }` with finite values ≥ 0.
// - Canvas size, ref arc, and tick sizing: finite numbers win; non-finite or wrong-type values fall back to defaults below.
// - `spec.title` defaults to "tide diagram" when missing or not a string.
// - Tick labels: `spec.tickLabelHours` must be an array of integers in 0..24; invalid entries are skipped.
// - Sub-builders (`buildTideMarksFromSpec`, pointers, centre cluster, wait arc) enforce their own throw/return-null rules.
import { buildCentreClusterFromSpec } from "./centreCluster.mjs";
import { buildNowPointerFromSpec } from "./nowPointer.mjs";
import { buildNextPointerFromSpec } from "./nextPointer.mjs";
import { buildTideMarksFromSpec } from "./tideMarks.mjs";
import { parseCanonicalTimeOrThrow } from "../model/timeCanonical.mjs";
import {
  computeNextTideEventCore,
  shouldOmitNowWaitVisualsForNextPointerClearance,
} from "../model/tideEvents.mjs";
import {
  diagramBoxFromExtents,
  polar,
  refArcAngles,
  timeToTheta,
} from "../model/tideDiagramModel.mjs";

/** @type {number} px when canvas width is absent or not a finite number */
const DEFAULT_CANVAS_WIDTH = 400;
/** @type {number} px when canvas height is absent or not a finite number */
const DEFAULT_CANVAS_HEIGHT = 300;
/** @type {string} when `spec.title` is absent or not a string */
const DEFAULT_TITLE = "tide diagram";
/** @type {number} RefRadius units when `spec.refRadius` is absent or not a finite number */
const DEFAULT_REF_RADIUS = 100;
/** @type {number} radians when `spec.sweepRad` is absent or not a finite number */
const DEFAULT_SWEEP_RAD = Math.PI * 0.92;
/** @type {number} proportion of RefRadius for hour tick length when absent or not finite */
const DEFAULT_TICK_LEN = 0.08;

/**
 * @param {unknown} v
 * @param {number} fallback
 */
function numOr(v, fallback) {
  return typeof v === "number" && Number.isFinite(v) ? v : fallback;
}

/**
 * Root-level clock readout from `spec.timeNow` (canonical `HH:MM:SS` only). Optional `spec.timeNowLabel`:
 * `{ x?, fontHeight? }` as RefRadius multiples; default **x** = 0.8, **fontHeight** = 0.05; **y** = −**fontHeight**.
 *
 * @param {Record<string, unknown>} spec
 * @returns {import('../model/tideDiagramModel.mjs').DiagramTextInst | null}
 */
function buildTimeNowLabelFromSpec(spec) {
  const raw = spec.timeNowLabel;
  if (raw == null || typeof raw !== "object") return null;
  const o = /** @type {Record<string, unknown>} */ (raw);
  const refRadius =
    typeof spec.refRadius === "number" && Number.isFinite(spec.refRadius)
      ? spec.refRadius
      : 100;
  const xRaw = o.x;
  const xK =
    typeof xRaw === "number" && Number.isFinite(xRaw) ? xRaw : 0.8;
  const fhRaw = o.fontHeight;
  const fontHeightK =
    typeof fhRaw === "number" && Number.isFinite(fhRaw) ? fhRaw : 0.05;
  const parsedNow = parseCanonicalTimeOrThrow(spec.timeNow, "spec.timeNow");
  if (parsedNow.isRightEndpoint) {
    throw new Error('spec.timeNow cannot be "24:00:00"');
  }
  const yK = -fontHeightK;
  return {
    content: parsedNow.canonical,
    fontSize: fontHeightK * refRadius,
    anchor: { x: xK * refRadius, y: yK * refRadius },
    hAlign: "right",
  };
}

/**
 * @param {Record<string, unknown>} spec
 * @returns {import('../model/tideDiagramModel.mjs').TideDiagramDocument}
 */
export function buildDiagram(spec) {
  const canvasRaw = spec.canvas;
  const canvas =
    canvasRaw != null && typeof canvasRaw === "object"
      ? /** @type {Record<string, unknown>} */ (canvasRaw)
      : null;
  const width = numOr(canvas?.width, DEFAULT_CANVAS_WIDTH);
  const height = numOr(canvas?.height, DEFAULT_CANVAS_HEIGHT);
  const title = typeof spec.title === "string" ? spec.title : DEFAULT_TITLE;

  const refRadius = numOr(spec.refRadius, DEFAULT_REF_RADIUS);
  const sweepRad = numOr(spec.sweepRad, DEFAULT_SWEEP_RAD);
  const tickLen = numOr(spec.tickLen, DEFAULT_TICK_LEN);

  const tickLabelSize = numOr(spec.tickLabelSize, 1.5 * tickLen);
  const tickLabelClearance = numOr(spec.tickLabelClearance, 3 * tickLen);

  const { thetaLeft, thetaRight } = refArcAngles(sweepRad);
  const rInner = 1.0 * refRadius;
  const rOuter = (1.0 + tickLen) * refRadius;

  /** @type {import('../model/tideDiagramModel.mjs').TickMarkSpec[]} */
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
  /** @type {import('../model/tideDiagramModel.mjs').TickLabelSpec[]} */
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
  const timeNowLabel = buildTimeNowLabelFromSpec(spec);

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
    timeNowLabel,
    contentBounds,
  };
}

/**
 * @param {Record<string, unknown>} spec
 * @returns {import('../model/tideDiagramModel.mjs').ContentBoundsExtents}
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
      "spec.contentBounds must set left, right, above, below to finite numbers >= 0",
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
 * @param {Record<string, unknown>} spec
 * @param {number} refRadius
 * @param {number} thetaLeft
 * @param {number} thetaRight
 * @returns {import('../model/tideDiagramModel.mjs').WaitArcDiagram | null}
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
  if (shouldOmitNowWaitVisualsForNextPointerClearance(parsedNow, core)) {
    return null;
  }

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
