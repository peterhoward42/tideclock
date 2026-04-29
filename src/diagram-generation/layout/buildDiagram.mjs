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
 * - `**mainLabelRadius**` is required: finite **k·R** multiplier **> 0**; arcuate label radius for **MainLabel**.
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
const MAIN_LABEL_CHAR_WIDTH_EM = 0.6;
const TIME_NOW_DATE_TIME_SEPARATOR_SPACES = 3;
// TimeNowClock is emitted as `HH:MM` + `:` + `SS`; total mono-char count = 5 + 1 + 2 = 8.
const TIME_NOW_CLOCK_TOTAL_CHARS = 8;

/**
 * Build one-line MainLabel copy from the currently resolved TimeDelta stripes.
 * TimeDelta is hidden in scene mapping for now, but remains the source of truth for dynamic copy.
 *
 * @param {import('../model/tideDiagramModel.mjs').TimeDeltaDiagram} timeDeltaDiagram
 * @returns {string}
 */
function synthesizeMainLabelContentFromTimeDelta(timeDeltaDiagram) {
  const stripes =
    timeDeltaDiagram.countdownStripes ?? timeDeltaDiagram.timeDeltaEmptyStripes ?? [];
  return stripes
    .map((stripe) => stripe.content.trim())
    .filter((line) => !line.startsWith("at "))
    .filter((line) => line.length > 0)
    .join(" ");
}

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

function buildHandFromSpec(spec, refRadius, thetaLeft, thetaRight) {
  const hand = requirePlainObject(spec.hand, "spec.hand");
  const bossCircleRadiusK = requireFiniteNumber(
    hand.bossCircleRadius,
    "spec.hand.bossCircleRadius",
  );
  const smallCircleRadiusK = requireFiniteNumber(
    hand.smallCircleRadius,
    "spec.hand.smallCircleRadius",
  );
  const pointerPipScale = requireFiniteNumber(
    hand.pointerPipScale,
    "spec.hand.pointerPipScale",
  );
  const pointerTipInsetK = requireFiniteNumber(
    hand.pointerTipInset,
    "spec.hand.pointerTipInset",
  );
  if (!(bossCircleRadiusK > 0)) {
    throw new Error("spec.hand.bossCircleRadius must be greater than 0");
  }
  if (!(smallCircleRadiusK > 0)) {
    throw new Error("spec.hand.smallCircleRadius must be greater than 0");
  }
  if (!(pointerPipScale > 0)) {
    throw new Error("spec.hand.pointerPipScale must be greater than 0");
  }
  if (!(pointerTipInsetK >= 0)) {
    throw new Error("spec.hand.pointerTipInset must be greater than or equal to 0");
  }
  const tideMarks = requirePlainObject(spec.tideMarks, "spec.tideMarks");
  const tideMarkArrowDivergence = Math.max(
    0,
    requireFiniteNumber(
      tideMarks.tideMarkArrowDivergence,
      "spec.tideMarks.tideMarkArrowDivergence",
    ),
  );
  const tideMarkArrowLineLen = Math.max(
    0,
    requireFiniteNumber(
      tideMarks.tideMarkArrowLineLen,
      "spec.tideMarks.tideMarkArrowLineLen",
    ),
  );
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
  const rRef = refRadius;
  const rTrack = insideTrackRadiusK * refRadius;
  const rTip = rRef - pointerTipInsetK * refRadius;
  const pointerOffsetR = tideMarkArrowLineLen * refRadius * pointerPipScale;
  const halfAngle = 0.5 * tideMarkArrowDivergence;
  const v1 = { x: unit.x * rTip, y: unit.y * rTip };
  const v2Offset = polar(pointerOffsetR, theta + Math.PI + halfAngle);
  const v3Offset = polar(pointerOffsetR, theta + Math.PI - halfAngle);
  const v2 = { x: v1.x + v2Offset.x, y: v1.y + v2Offset.y };
  const v3 = { x: v1.x + v3Offset.x, y: v1.y + v3Offset.y };
  const pointerHeadCenter = normalLineIntersection(v1, v2, v3);
  const pointerHeadRadius = Math.hypot(
    pointerHeadCenter.x - v2.x,
    pointerHeadCenter.y - v2.y,
  );
  const smallCircleRadius = smallCircleRadiusK * refRadius;
  const headToSmallCenter = pointerHeadRadius + smallCircleRadius;
  const smallCircleCenterOutward = {
    x: pointerHeadCenter.x + unit.x * headToSmallCenter,
    y: pointerHeadCenter.y + unit.y * headToSmallCenter,
  };
  const smallCircleCenterInward = {
    x: pointerHeadCenter.x - unit.x * headToSmallCenter,
    y: pointerHeadCenter.y - unit.y * headToSmallCenter,
  };
  const smallCircleCenter =
    Math.hypot(smallCircleCenterInward.x, smallCircleCenterInward.y) <=
    Math.hypot(smallCircleCenterOutward.x, smallCircleCenterOutward.y)
      ? smallCircleCenterInward
      : smallCircleCenterOutward;
  const rSmallCenter = Math.hypot(smallCircleCenter.x, smallCircleCenter.y);
  const rSmallInner = rSmallCenter - smallCircleRadius;
  const rBoss = bossCircleRadiusK * refRadius;
  if (!(rTip < rTrack && rTrack < rRef)) {
    throw new Error(
      "spec.hand radial ordering invalid: require r_tip < r_track < r_ref",
    );
  }
  if (!(rBoss < rSmallInner)) {
    throw new Error(
      "spec.hand radial ordering invalid: require r_boss < r_small_inner",
    );
  }
  return {
    timeHours: parsedNow.hours,
    theta,
    bossCircle: { center: { x: 0, y: 0 }, radius: rBoss },
    smallCircle: { center: smallCircleCenter, radius: smallCircleRadius },
    extension: {
      start: { x: unit.x * rTip, y: unit.y * rTip },
      end: { x: unit.x * rTrack, y: unit.y * rTrack },
    },
    projection: {
      start: { x: unit.x * rTrack, y: unit.y * rTrack },
      end: { x: unit.x * rRef, y: unit.y * rRef },
    },
    arm: {
      start: { x: unit.x * rBoss, y: unit.y * rBoss },
      end: { x: unit.x * rSmallInner, y: unit.y * rSmallInner },
    },
    pointerPip: {
      triangle: { v1, v2, v3 },
      circle: { center: pointerHeadCenter, radius: pointerHeadRadius },
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
  const parsedNowForMainLabel = parseCanonicalTimeOrThrow(
    spec.timeNow,
    "spec.timeNow",
  );
  if (parsedNowForMainLabel.isRightEndpoint) {
    throw new Error('spec.timeNow cannot be "24:00:00"');
  }
  const mainLabelCenterHours =
    parsedNowForMainLabel.hours < 12
      ? (parsedNowForMainLabel.hours + 24) / 2
      : parsedNowForMainLabel.hours / 2;
  const mainLabel = buildMainLabel(
    spec,
    refRadius,
    timeToTheta(mainLabelCenterHours, thetaLeft, thetaRight),
    synthesizeMainLabelContentFromTimeDelta(timeDeltaDiagram),
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
    timeDeltaDiagram,
    centreFrameDiagram,
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
 * @param {Record<string, unknown>} spec
 * @param {number} refRadius
 * @param {number} thetaZeroHour
 * @param {string} content
 * @returns {import('../model/tideDiagramModel.mjs').MainLabelDiagram}
 */
function buildMainLabel(spec, refRadius, thetaZeroHour, content) {
  const mainLabelRadiusK = requireFiniteNumber(
    spec.mainLabelRadius,
    "spec.mainLabelRadius",
  );
  if (!(mainLabelRadiusK > 0)) {
    throw new Error("spec.mainLabelRadius must be a finite number greater than 0");
  }
  const radius = mainLabelRadiusK * refRadius;
  const fontSize = 0.045 * refRadius;
  const arcLength = content.length * fontSize * MAIN_LABEL_CHAR_WIDTH_EM;
  const sweepRad = arcLength / radius;
  return {
    content,
    fontSize,
    center: { x: 0, y: 0 },
    radius,
    thetaStart: thetaZeroHour - 0.5 * sweepRad,
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

