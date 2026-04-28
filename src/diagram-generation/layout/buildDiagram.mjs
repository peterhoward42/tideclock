/**
 * buildDiagram.mjs — Orchestrates layout submodules into a `TideDiagramDocument` from an open spec.
 * Fed by the app collaborator; downstream: `toScene` and SVG render. Kind: Orchestrator / coordinator.
 * Does not emit SVG strings.
 *
 * See docs/specs/tide-diagram.md; spec keys mirror the open object passed from the app (diagramGenerationCollaborator.ts).
 *
 * Policies for {@link buildDiagram}:
 * - Throws if `spec.canvas`, `spec.title`, ref arc, and tick sizing/tick label sizing omit
 *   required fields or supply non-finite numbers (no silent defaults).
 * - `spec.tickLabelHours` must be an array of integers in 0..24; invalid entries throw.
 * - Sub-builders (`buildTideMarksFromSpec`, **timeDelta** / **centreFrame**) enforce their own throw rules; `**timeDelta**` and `**centreFrame**` are required objects on the spec.
 * - `**annularBand**` is required: plain object with finite `**annularBandWidth**` (**k·R**) **> 0**.
 * - `**homeMenuTrigger**` is required: plain object with finite `**width`**, `**height`**, `**cornerRadius**` (all **k·R**; each strictly **> 0**; cornerRadius ≤ half the smaller of width and height), finite `**labelSize**` (**k·R**, **> 0**), and string `**label**`. Position is derived from diagram bounds: left edge at the leftmost tick-label bound, bottom edge at the minimum tick-label-anchor **Y**.
 * - `**insideTrackRadius**` is required: finite **k·R** multiplier **> 0**; arc radius **k·RefRadius**, concentric with RefArc, same sweep.
 * - `**timeNowLabel**` is required (plain object with finite **fontHeight** and **dateAboveTime** as **k·R**); `**timeNowDatePrefix**` is a required string (see spec).
 */
import { buildCentreFrameDiagramFromSpec } from "./centreFrame.mjs";
import { buildTimeDeltaDiagramFromSpec } from "./timeDeltaDiagram.mjs";
import { buildTideMarksFromSpec } from "./tideMarks.mjs";
import {
  requireFiniteNumber,
  requirePlainObject,
  requireString,
} from "./specRequire.mjs";
import { parseCanonicalTimeOrThrow } from "../model/timeCanonical.mjs";
import {
  annularBandMaxX,
  polar,
  refArcAngles,
  timeToTheta,
} from "../model/tideDiagramModel.mjs";

/** Per-character scene width heuristic; must match {@link expandBoundsByText} in `toScene.mjs`. */
const TIME_NOW_LABEL_CHAR_WIDTH_EM = 0.6;

/**
 * Time-now readout: **TimeNowDate** (civil prefix) and **TimeNowClock** (`HH:MM` + `:` + `SS`), right-aligned
 * to {@link annularBandMaxX}; clock baseline **Y** matches the minimum **Y** among **TickLabels** (see spec).
 *
 * @param {Record<string, unknown>} spec
 * @param {number} refRadius
 * @param {number} annularMaxX diagram-space maximum **X** of **AnnularBand**
 * @param {number} clockBaselineY diagram-space **Y** shared by all three clock fragments (tick-label-min rule)
 * @returns {{ timeNowDate: import('../model/tideDiagramModel.mjs').DiagramTextInst, timeNowClock: import('../model/tideDiagramModel.mjs').DiagramTimeNowClockInst }}
 */
function buildTimeNowReadoutFromSpec(spec, refRadius, annularMaxX, clockBaselineY) {
  const o = requirePlainObject(spec.timeNowLabel, "spec.timeNowLabel");
  const fontHeightK = o.fontHeight;
  const dateAboveK = o.dateAboveTime;
  if (
    typeof fontHeightK !== "number" ||
    !Number.isFinite(fontHeightK) ||
    typeof dateAboveK !== "number" ||
    !Number.isFinite(dateAboveK) ||
    dateAboveK < 0
  ) {
    throw new Error(
      "spec.timeNowLabel requires finite numbers fontHeight and dateAboveTime (RefRadius multiples); dateAboveTime must be >= 0",
    );
  }
  const parsedNow = parseCanonicalTimeOrThrow(spec.timeNow, "spec.timeNow");
  if (parsedNow.isRightEndpoint) {
    throw new Error('spec.timeNow cannot be "24:00:00"');
  }
  if (typeof spec.timeNowDatePrefix !== "string") {
    throw new Error("spec.timeNowDatePrefix must be a string");
  }
  const datePrefix = spec.timeNowDatePrefix.trim();
  const fontSize = fontHeightK * refRadius;
  const ax = annularMaxX;
  const timeY = clockBaselineY;
  const dateY = timeY + dateAboveK * refRadius;
  const canonical = parsedNow.canonical;
  const w = TIME_NOW_LABEL_CHAR_WIDTH_EM * fontSize;
  const secondsWidth = 2 * w;
  const colonWidth = 1 * w;
  return {
    timeNowDate: {
      content: datePrefix,
      fontSize,
      anchor: { x: ax, y: dateY },
      hAlign: "right",
    },
    timeNowClock: {
      hhmm: {
        content: canonical.slice(0, 5),
        fontSize,
        anchor: { x: ax - secondsWidth - colonWidth, y: timeY },
        hAlign: "right",
      },
      secondsColon: {
        content: canonical.slice(5, 6),
        fontSize,
        anchor: { x: ax - secondsWidth, y: timeY },
        hAlign: "right",
      },
      seconds: {
        content: canonical.slice(6),
        fontSize,
        anchor: { x: ax, y: timeY },
        hAlign: "right",
      },
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

  const annularBand = buildAnnularBandFromSpec(
    spec,
    refRadius,
    thetaLeft,
    sweepRad,
  );
  const annularMaxX = annularBandMaxX(annularBand);
  if (tickLabels.length === 0) {
    throw new Error(
      "spec.tickLabelHours must list at least one hour: time-now clock uses the minimum Y among tick label anchors",
    );
  }
  const clockBaselineY = Math.min(...tickLabels.map((tl) => tl.anchor.y));
  const { timeNowDate, timeNowClock } = buildTimeNowReadoutFromSpec(
    spec,
    refRadius,
    annularMaxX,
    clockBaselineY,
  );
  const leftmostTickLabelX = Math.min(
    ...tickLabels.map((tl) =>
      tl.anchor.x -
      0.5 * tl.content.length * TIME_NOW_LABEL_CHAR_WIDTH_EM * tl.fontSize,
    ),
  );
  const homeMenuTrigger = buildHomeMenuTriggerFromSpec(
    spec,
    refRadius,
    leftmostTickLabelX,
    clockBaselineY,
  );

  const tideMarks = buildTideMarksFromSpec(
    spec,
    refRadius,
    thetaLeft,
    thetaRight,
  );

  const insideTrack = buildInsideTrackFromSpec(
    spec,
    refRadius,
    thetaLeft,
    sweepRad,
  );

  return {
    version: 1,
    meta: { title, width, height },
    paintOrder: spec.paintOrder,
    refArc: {
      center: { x: 0, y: 0 },
      refRadius,
      sweepRad,
      thetaLeft,
      thetaRight,
    },
    insideTrack,
    tickMarks,
    tickLabels,
    tideMarks,
    annularBand,
    homeMenuTrigger,
    timeDeltaDiagram,
    centreFrameDiagram,
    timeNowDate,
    timeNowClock,
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
/**
 * @param {Record<string, unknown>} spec
 * @param {number} refRadius
 * @param {number} thetaLeft
 * @param {number} sweepRad same subtended angle as RefArc (radians)
 * @returns {import('../model/tideDiagramModel.mjs').InsideTrackDiagram}
 */
function buildInsideTrackFromSpec(spec, refRadius, thetaLeft, sweepRad) {
  const k = requireFiniteNumber(
    spec.insideTrackRadius,
    "spec.insideTrackRadius",
  );
  if (k <= 0) {
    throw new Error(
      "spec.insideTrackRadius must be a finite number greater than 0",
    );
  }
  return {
    center: { x: 0, y: 0 },
    radius: k * refRadius,
    thetaLeft,
    sweepRad,
  };
}

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
 * @param {number} leftEdgeX
 * @param {number} bottomEdgeY
 * @returns {import('../model/tideDiagramModel.mjs').HomeMenuTriggerDiagram}
 */
function buildHomeMenuTriggerFromSpec(spec, refRadius, leftEdgeX, bottomEdgeY) {
  const o = requirePlainObject(spec.homeMenuTrigger, "spec.homeMenuTrigger");
  const widthK = requireFiniteNumber(
    o.width,
    "spec.homeMenuTrigger.width",
  );
  const heightK = requireFiniteNumber(
    o.height,
    "spec.homeMenuTrigger.height",
  );
  const cornerRadiusK = requireFiniteNumber(
    o.cornerRadius,
    "spec.homeMenuTrigger.cornerRadius",
  );
  const labelSizeK = requireFiniteNumber(
    o.labelSize,
    "spec.homeMenuTrigger.labelSize",
  );
  const label = requireString(o.label, "spec.homeMenuTrigger.label");
  if (!(widthK > 0)) {
    throw new Error("spec.homeMenuTrigger.width must be greater than 0");
  }
  if (!(heightK > 0)) {
    throw new Error("spec.homeMenuTrigger.height must be greater than 0");
  }
  if (!(cornerRadiusK > 0)) {
    throw new Error("spec.homeMenuTrigger.cornerRadius must be greater than 0");
  }
  const maxCornerK = 0.5 * Math.min(widthK, heightK);
  if (cornerRadiusK > maxCornerK + 1e-9) {
    throw new Error(
      "spec.homeMenuTrigger.cornerRadius must not exceed half the smaller of width and height (k·R)",
    );
  }
  if (labelSizeK <= 0) {
    throw new Error("spec.homeMenuTrigger.labelSize must be greater than 0");
  }
  const width = widthK * refRadius;
  const height = heightK * refRadius;
  return {
    center: { x: leftEdgeX + 0.5 * width, y: bottomEdgeY + 0.5 * height },
    width,
    height,
    cornerRadius: cornerRadiusK * refRadius,
    labelSize: labelSizeK * refRadius,
    label,
  };
}

