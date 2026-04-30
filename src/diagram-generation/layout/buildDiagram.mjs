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
 * - Sub-builders (`buildTideMarksFromSpec`) enforce their own throw rules.
 * - `**annularBand**` is required: plain object with finite `**annularBandWidth**` (**k·R**) **> 0**.
 * - `**homeMenuTrigger**` is required: plain object with finite `**width`**, `**height`**, `**cornerRadius**` (all **k·R**; each strictly **> 0**; cornerRadius ≤ half the smaller of width and height), finite `**labelSize**` (**k·R**, **> 0**), and string `**label**`. Position is derived from diagram bounds: left edge at the leftmost tick-label bound, bottom edge above **MainLabel** top.
 * - `**insideTrackRadius**` is required: finite **k·R** multiplier **> 0**; arc radius **k·RefRadius**, concentric with RefArc, same sweep.
 * - **MainLabel** is horizontal text anchored from content bounds (leftmost tick-label bound and minimum tick-label-anchor **Y**), not curved arc text.
 * - `**timeNowLabel**` is required (plain object with finite **fontHeight** and **dateAboveTime** as **k·R**); `**timeNowDatePrefix**` is a required string (see spec).
 */
import { buildTideMarksFromSpec } from "./tideMarks.mjs";
import {
  requireFiniteNumber,
  requirePlainObject,
  requireString,
} from "./specRequire.mjs";
import { parseCanonicalTimeOrThrow } from "../model/timeCanonical.mjs";
import { computeNextTideEventFromSpec } from "../model/tideEvents.mjs";
import {
  annularBandMaxX,
  polar,
  refArcAngles,
  timeToTheta,
} from "../model/tideDiagramModel.mjs";

/** Per-character scene width heuristic; must match {@link expandBoundsByText} in `toScene.mjs`. */
const TIME_NOW_LABEL_CHAR_WIDTH_EM = 0.6;
const TIME_NOW_DATE_TIME_SEPARATOR_SPACES = 3;
// TimeNowClock is emitted as `HH:MM` + `:` + `SS`; total mono-char count = 5 + 1 + 2 = 8.
const TIME_NOW_CLOCK_TOTAL_CHARS = 8;

/**
 * Time-now readout: **TimeNowLocation** (current location name), and a single merged date+clock row:
 * **TimeNowDate** (civil prefix) concatenated on the left of **TimeNowClock** (`HH:MM` + `:` + `SS`), right-aligned
 * to {@link annularBandMaxX}; clock baseline **Y** matches the minimum **Y** among **TickLabels** (see spec).
 *
 * @param {Record<string, unknown>} spec
 * @param {number} refRadius
 * @param {number} annularMaxX diagram-space maximum **X** of **AnnularBand**
 * @param {number} clockBaselineY diagram-space **Y** shared by all three clock fragments (tick-label-min rule)
 * @returns {{ timeNowLocation: import('../model/tideDiagramModel.mjs').DiagramTextInst, timeNowDate: import('../model/tideDiagramModel.mjs').DiagramTextInst, timeNowClock: import('../model/tideDiagramModel.mjs').DiagramTimeNowClockInst }}
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
  if (typeof spec.timeNowLocation !== "string") {
    throw new Error("spec.timeNowLocation must be a string");
  }
  const locationName = spec.timeNowLocation.trim();
  const fontSize = fontHeightK * refRadius;
  const ax = annularMaxX;
  const timeY = clockBaselineY;
  // Date and clock share a baseline: the 2nd row in the merged time-now readout.
  const dateY = timeY;
  // Baseline spacing is tuned to typography: location stays above the merged (date+clock) row.
  const locationY = dateY + dateAboveK * refRadius + fontSize;
  const canonical = parsedNow.canonical;
  const w = TIME_NOW_LABEL_CHAR_WIDTH_EM * fontSize;
  const secondsWidth = 2 * w;
  const colonWidth = 1 * w;
  const clockTotalWidth = TIME_NOW_CLOCK_TOTAL_CHARS * w;
  const separatorWidth = TIME_NOW_DATE_TIME_SEPARATOR_SPACES * w;
  // TimeNowDate is right-aligned so its right edge stops before the clock and separator.
  const dateX = ax - clockTotalWidth - separatorWidth;
  return {
    timeNowLocation: {
      content: locationName,
      fontSize,
      anchor: { x: ax, y: locationY },
      hAlign: "right",
    },
    timeNowDate: {
      content: datePrefix,
      fontSize,
      anchor: { x: dateX, y: dateY },
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

function buildHandFromSpec(spec, refRadius, thetaLeft, thetaRight) {
  const hand = requirePlainObject(spec.hand, "spec.hand");
  const bossCircleRadiusK = requireFiniteNumber(
    hand.bossCircleRadius,
    "spec.hand.bossCircleRadius",
  );
  if (!(bossCircleRadiusK > 0)) {
    throw new Error("spec.hand.bossCircleRadius must be greater than 0");
  }
  const insideTrackRadiusK = requireFiniteNumber(
    spec.insideTrackRadius,
    "spec.insideTrackRadius",
  );
  if (!(insideTrackRadiusK > 0)) {
    throw new Error("spec.insideTrackRadius must be greater than 0");
  }
  const parsedNow = parseCanonicalTimeOrThrow(spec.timeNow, "spec.timeNow");
  if (parsedNow.isRightEndpoint) {
    throw new Error('spec.timeNow cannot be "24:00:00"');
  }
  const theta = timeToTheta(parsedNow.hours, thetaLeft, thetaRight);
  const unit = polar(1, theta);
  const rTrack = insideTrackRadiusK * refRadius;
  const rBoss = bossCircleRadiusK * refRadius;
  if (!(rBoss < rTrack)) {
    throw new Error(
      "spec.hand radial ordering invalid: require r_boss < r_track",
    );
  }
  return {
    timeHours: parsedNow.hours,
    theta,
    bossCircle: { center: { x: 0, y: 0 }, radius: rBoss },
    arm: {
      start: { x: unit.x * rBoss, y: unit.y * rBoss },
      end: { x: unit.x * rTrack, y: unit.y * rTrack },
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
  const { timeNowLocation, timeNowDate, timeNowClock } = buildTimeNowReadoutFromSpec(
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
  const parsedNowForMainLabel = parseCanonicalTimeOrThrow(spec.timeNow, "spec.timeNow");
  if (parsedNowForMainLabel.isRightEndpoint) {
    throw new Error('spec.timeNow cannot be "24:00:00"');
  }
  const nextEventForMainLabel = computeNextTideEventFromSpec(spec, parsedNowForMainLabel);
  const mainLabelContent =
    nextEventForMainLabel == null
      ? ""
      : `${nextEventForMainLabel.kind} tide at ${formatEventClockHHMM(nextEventForMainLabel.seconds)}`;
  const mainLabel = buildMainLabel(leftmostTickLabelX, clockBaselineY, refRadius, mainLabelContent);
  const mainLabelTopY = mainLabel.anchor.y + 0.8 * mainLabel.fontSize;
  const homeMenuTriggerGap = readHomeMenuTriggerGapFromSpec(spec, refRadius);
  const homeMenuTrigger = buildHomeMenuTriggerFromSpec(
    spec,
    refRadius,
    leftmostTickLabelX,
    mainLabelTopY + homeMenuTriggerGap,
  );
  const hand = buildHandFromSpec(spec, refRadius, thetaLeft, thetaRight);

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
    mainLabel,
    tickMarks,
    tickLabels,
    tideMarks,
    annularBand,
    homeMenuTrigger,
    hand,
    timeNowLocation,
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
 * @param {number} secondsSinceMidnight
 * @returns {string}
 */
function formatEventClockHHMM(secondsSinceMidnight) {
  const clampedSeconds = Math.max(0, Math.min(24 * 3600 - 1, Math.floor(secondsSinceMidnight)));
  const hours = Math.floor(clampedSeconds / 3600);
  const minutes = Math.floor((clampedSeconds % 3600) / 60);
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
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

/**
 * @param {number} anchorX
 * @param {number} anchorY
 * @param {number} refRadius
 * @param {string} content
 * @returns {import('../model/tideDiagramModel.mjs').MainLabelDiagram}
 */
function buildMainLabel(anchorX, anchorY, refRadius, content) {
  const fontSize = 0.045 * refRadius;
  return {
    content,
    fontSize,
    anchor: { x: anchorX, y: anchorY },
    hAlign: "left",
  };
}

/**
 * @param {Record<string, unknown>} spec
 * @param {number} refRadius
 * @returns {number}
 */
function readHomeMenuTriggerGapFromSpec(spec, refRadius) {
  const o = requirePlainObject(spec.homeMenuTrigger, "spec.homeMenuTrigger");
  const gapK = requireFiniteNumber(
    o.gapAboveMainLabel,
    "spec.homeMenuTrigger.gapAboveMainLabel",
  );
  if (gapK < 0) {
    throw new Error("spec.homeMenuTrigger.gapAboveMainLabel must be >= 0");
  }
  return gapK * refRadius;
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

