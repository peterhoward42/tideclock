/**
 * buildDiagram.mjs — Orchestrates layout submodules into a `TideDiagramDocument` from an open spec.
 * Fed by the app collaborator; downstream: `toScene` and SVG render. Kind: Orchestrator / coordinator.
 * Does not emit SVG strings.
 *
 * See docs/specs/tide-diagram.md; spec keys mirror the open object passed from the app (diagramGenerationCollaborator.ts).
 *
 * Policies for {@link buildDiagram}:
 * - Throws if `spec.canvas`, `spec.title`, ref arc, tick sizing, tick label sizing, or `spec.waitArc` omit
 *   required fields or supply non-finite numbers (no silent defaults).
 * - `spec.tickLabelHours` must be an array of integers in 0..24; invalid entries throw.
 * - Sub-builders (`buildTideMarksFromSpec`, pointers, **timeDelta** / **centreFrame**) enforce their own throw rules; `**timeDelta**` and `**centreFrame**` are required objects on the spec.
 * - `**annularBand**` is required: plain object with finite `**annularBandWidth**` (**k·R**) **> 0** (defines the Now **triangle** outer radius together with **RefRadius**).
 * - When `**nowPointer**` is present, `**nowPointer.triangle.subtendedAngleRad**` is required: literal radians, strictly between **0** and **π** (see spec).
 */
import { buildCentreFrameDiagramFromSpec } from "./centreFrame.mjs";
import { buildTimeDeltaDiagramFromSpec } from "./timeDeltaDiagram.mjs";
import { buildNowPointerFromSpec } from "./nowPointer.mjs";
import { buildNextPointerFromSpec } from "./nextPointer.mjs";
import { buildTideMarksFromSpec } from "./tideMarks.mjs";
import {
  requireBoolean,
  requireFiniteNumber,
  requirePlainObject,
  requireString,
  requireWaitArcArrowStyle,
} from "./specRequire.mjs";
import { parseCanonicalTimeOrThrow } from "../model/timeCanonical.mjs";
import {
  computeNextTideEventCore,
  shouldOmitNowWaitVisualsForNextPointerClearance,
} from "../model/tideEvents.mjs";
import {
  polar,
  refArcAngles,
  timeToTheta,
} from "../model/tideDiagramModel.mjs";

/** Per-character scene width heuristic; must match {@link expandBoundsByText} in `toScene.mjs`. */
const TIME_NOW_LABEL_CHAR_WIDTH_EM = 0.6;

/**
 * Root-level clock readout from `spec.timeNow` (canonical `HH:MM:SS` only). Optional `spec.timeNowLabel`:
 * `{ x, fontHeight, y }` as RefRadius multiples (all required when the object is present);
 * **y** is proportion **k**; baseline **Y = −k·R** (subtract **k·R** from **Y = 0**), unlike signed `timeDelta.y`.
 * HH:MM, the colon before seconds, and SS are separate {@link DiagramTextInst}s so each can bind a distinct scene style name.
 *
 * @param {Record<string, unknown>} spec
 * @param {number} refRadius
 * @returns {import('../model/tideDiagramModel.mjs').DiagramTimeNowLabelInst | null}
 */
function buildTimeNowLabelFromSpec(spec, refRadius) {
  const raw = spec.timeNowLabel;
  if (raw == null || typeof raw !== "object") return null;
  const o = /** @type {Record<string, unknown>} */ (raw);
  const xK = o.x;
  const fontHeightK = o.fontHeight;
  const yK = o.y;
  if (
    typeof xK !== "number" ||
    !Number.isFinite(xK) ||
    typeof fontHeightK !== "number" ||
    !Number.isFinite(fontHeightK) ||
    typeof yK !== "number" ||
    !Number.isFinite(yK)
  ) {
    throw new Error(
      "spec.timeNowLabel requires finite numbers x, fontHeight, and y (RefRadius multiples)",
    );
  }
  const parsedNow = parseCanonicalTimeOrThrow(spec.timeNow, "spec.timeNow");
  if (parsedNow.isRightEndpoint) {
    throw new Error('spec.timeNow cannot be "24:00:00"');
  }
  const fontSize = fontHeightK * refRadius;
  const ax = xK * refRadius;
  const ay = -yK * refRadius;
  const canonical = parsedNow.canonical;
  const w = TIME_NOW_LABEL_CHAR_WIDTH_EM * fontSize;
  const secondsWidth = 2 * w;
  const colonWidth = 1 * w;
  return {
    hhmm: {
      content: canonical.slice(0, 5),
      fontSize,
      anchor: { x: ax - secondsWidth - colonWidth, y: ay },
      hAlign: "right",
    },
    secondsColon: {
      content: canonical.slice(5, 6),
      fontSize,
      anchor: { x: ax - secondsWidth, y: ay },
      hAlign: "right",
    },
    seconds: {
      content: canonical.slice(6),
      fontSize,
      anchor: { x: ax, y: ay },
      hAlign: "right",
    },
  };
}

/**
 * @param {Record<string, unknown>} spec
 * @returns {import('../model/tideDiagramModel.mjs').TideDiagramDocument}
 */
export function buildDiagram(spec) {
  const canvas = requirePlainObject(spec.canvas, "spec.canvas");
  const width = requireFiniteNumber(canvas.width, "spec.canvas.width");
  const height = requireFiniteNumber(canvas.height, "spec.canvas.height");
  const title = requireString(spec.title, "spec.title");

  const refRadius = requireFiniteNumber(spec.refRadius, "spec.refRadius");
  const sweepRad = requireFiniteNumber(spec.sweepRad, "spec.sweepRad");
  const tickLen = requireFiniteNumber(spec.tickLen, "spec.tickLen");
  const tickLabelSize = requireFiniteNumber(
    spec.tickLabelSize,
    "spec.tickLabelSize",
  );
  const tickLabelClearance = requireFiniteNumber(
    spec.tickLabelClearance,
    "spec.tickLabelClearance",
  );

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

  const timeDeltaDiagram = buildTimeDeltaDiagramFromSpec(spec, refRadius);
  const centreFrameDiagram = buildCentreFrameDiagramFromSpec(
    spec,
    refRadius,
    sweepRad,
  );
  const timeNowLabel = buildTimeNowLabelFromSpec(spec, refRadius);

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
  const annularBand = buildAnnularBandFromSpec(
    spec,
    refRadius,
    thetaLeft,
    sweepRad,
  );

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
    annularBand,
    timeDeltaDiagram,
    centreFrameDiagram,
    timeNowLabel,
  };
}

/**
 * @param {Record<string, unknown>} spec
 * @returns {number[]}
 */
function readTickLabelHours(spec) {
  const raw = spec.tickLabelHours;
  if (!Array.isArray(raw)) {
    throw new Error("spec.tickLabelHours must be an array of integers in 0..24");
  }
  /** @type {number[]} */
  const out = [];
  for (let i = 0; i < raw.length; i += 1) {
    const v = raw[i];
    if (typeof v !== "number" || !Number.isInteger(v) || v < 0 || v > 24) {
      throw new Error(
        `spec.tickLabelHours[${i}] must be an integer from 0 to 24 inclusive`,
      );
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
 * @param {number} sweepRad same subtended angle as RefArc (radians)
 * @returns {import('../model/tideDiagramModel.mjs').AnnularBandDiagram}
 */
function buildAnnularBandFromSpec(spec, refRadius, thetaLeft, sweepRad) {
  const o = requirePlainObject(spec.annularBand, "spec.annularBand");
  const wK = requireFiniteNumber(
    o.annularBandWidth,
    "spec.annularBand.annularBandWidth",
  );
  if (wK <= 0) {
    throw new Error(
      "spec.annularBand.annularBandWidth must be a finite number greater than 0",
    );
  }
  const w = wK * refRadius;
  return {
    center: { x: 0, y: 0 },
    rInner: refRadius,
    rOuter: refRadius + w,
    thetaLeft,
    sweepRad,
  };
}

/**
 * @param {Record<string, unknown>} spec
 * @param {number} refRadius
 * @param {number} thetaLeft
 * @param {number} thetaRight
 * @returns {import('../model/tideDiagramModel.mjs').WaitArcDiagram | null}
 */
function buildWaitArcFromSpec(spec, refRadius, thetaLeft, thetaRight) {
  const raw = requirePlainObject(spec.waitArc, "spec.waitArc");
  const radiusK = requireFiniteNumber(raw.radius, "spec.waitArc.radius");
  const radius = Math.max(0, radiusK) * refRadius;
  if (radius <= 0) return null;

  const arrowRaw = requirePlainObject(raw.arrow, "spec.waitArc.arrow");
  const lengthK = requireFiniteNumber(arrowRaw.lengthK, "spec.waitArc.arrow.lengthK");
  const widthK = requireFiniteNumber(arrowRaw.widthK, "spec.waitArc.arrow.widthK");
  const insetK = requireFiniteNumber(arrowRaw.insetK, "spec.waitArc.arrow.insetK");
  const style = requireWaitArcArrowStyle(
    arrowRaw.style,
    "spec.waitArc.arrow.style",
  );
  const scaleWithStroke = requireBoolean(
    arrowRaw.scaleWithStroke,
    "spec.waitArc.arrow.scaleWithStroke",
  );

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
      lengthK,
      widthK,
      insetK,
      style,
      scaleWithStroke,
    },
  };
}
