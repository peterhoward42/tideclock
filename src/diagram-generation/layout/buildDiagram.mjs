/**
 * buildDiagram.mjs — Orchestrates layout submodules into a `TideDiagramDocument` from an open spec.
 * Fed by the app collaborator; downstream: `toScene` and SVG render. Kind: Orchestrator / coordinator.
 * Does not emit SVG strings.
 *
 * See docs/specs/tide-diagram.md; spec keys mirror the open object passed from the app (diagramGenerationCollaborator.ts).
 *
 * Policies for {@link buildDiagram}:
 * - Throws if `spec.title`, ref arc, and tick/tick-label sizing omit
 *   required fields or supply non-finite numbers (no silent defaults).
 * - `spec.tickLabelHours` must be an array of integers in 0..24; invalid entries throw.
 * - Sub-builders (`buildTideMarksFromSpec`) enforce their own throw rules.
 * - `**annularBand**` is required: plain object with finite `**annularBandWidth**` (**k·R**) **> 0**.
 * - Optional `**layoutBoundsBottomMargin**` (**k·R**, **>= 0**): pass 3 of global layout bounds; extends **B_bottom** downward; when omitted, **0**.
 * - Optional `**civilHalfDayLayout**`: `"auto"` | `"beforeNoon"` | `"afterNoon"`; when omitted, **`"auto"`**. Selects civil half-day **presentation** branches (e.g. **HandArmTimeLabel**) without changing **`timeNow`** or **θ_now** (see tide-diagram spec).
 * - `**dividorArc**` is required: plain object with finite `**radiusK**` (**> 0**, **k·R** arc radius).
 * - `**homeMenuTrigger**` is required: plain object with finite `**width`**, `**height`**, `**cornerRadius**` (all **k·R**; each strictly **> 0**; cornerRadius ≤ half the smaller of width and height), finite `**labelSize**` (**k·R**, **> 0**), finite `**gapAboveMainLabel**` (**k·R**, **>= 0**), and string `**label**`. Position is derived from global layout bounds + MainLabel: left edge at layout-bounds left, bottom edge above MainLabel top by the configured gap.
 * - **MainLabel** is horizontal text anchored from content bounds (leftmost tick-label bound and minimum tick-label-anchor **Y**), not curved arc text.
 * - `**blhcBundle**` is required (plain object with finite **fontHeight** and **dateAboveTime** as **k·R**); `**blhcDatePrefix**` is a required string (see spec).
 */
import { buildTideMarksFromSpec } from "./tideMarks.mjs";
import {
  requireFiniteNumber,
  requirePlainObject,
  requireString,
} from "./specRequire.mjs";
import {
  parseCivilHalfDayLayoutOrThrow,
  resolveCivilHalfDayIsBeforeNoon,
} from "../model/civilHalfDayLayout.mjs";
import { parseCanonicalTimeOrThrow } from "../model/timeCanonical.mjs";
import { computeNextTideEventFromSpec } from "../model/tideEvents.mjs";
import {
  annularBandBounds,
  polar,
  refArcAngles,
  timeToTheta,
} from "../model/tideDiagramModel.mjs";

/** Per-character scene width heuristic for monospace-ish labels; must match `0.6` in {@link expandBoundsByText} (`toScene.mjs`). */
const BLHC_LABEL_CHAR_WIDTH_EM = 0.6;
const BLHC_DATE_TIME_SEPARATOR_SPACES = 3;
// BLHCClock is emitted as `HH:MM` + `:` + `SS`; total mono-char count = 5 + 1 + 2 = 8.
const BLHC_CLOCK_TOTAL_CHARS = 8;
const TEXT_ASCENT_EM = 0.8;
const TEXT_DESCENT_EM = 0.2;

/**
 * **BLHCBundle**: **BLHCLocation** (current location name), and a single merged date+clock row:
 * **BLHCDate** (civil prefix) concatenated on the left of **BLHCClock** (`HH:MM` + `:` + `SS`), right-aligned
 * to global layout-bounds right; the clock row bottom edge aligns to global layout-bounds bottom (see spec).
 *
 * @param {Record<string, unknown>} spec
 * @param {number} refRadius
 * @param {number} layoutBoundsRightX diagram-space right edge of global layout bounds
 * @param {number} layoutBoundsBottomY diagram-space bottom edge of global layout bounds
 * @returns {{ blhcLocation: import('../model/tideDiagramModel.mjs').DiagramTextInst, blhcDate: import('../model/tideDiagramModel.mjs').DiagramTextInst, blhcClock: import('../model/tideDiagramModel.mjs').DiagramBlhcClockInst }}
 */
function buildBlhcBundleFromSpec(spec, refRadius, layoutBoundsRightX, layoutBoundsBottomY) {
  const o = requirePlainObject(spec.blhcBundle, "spec.blhcBundle");
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
      "spec.blhcBundle requires finite numbers fontHeight and dateAboveTime (RefRadius multiples); dateAboveTime must be >= 0",
    );
  }
  const parsedNow = parseCanonicalTimeOrThrow(spec.timeNow, "spec.timeNow");
  if (parsedNow.isRightEndpoint) {
    throw new Error('spec.timeNow cannot be "24:00:00"');
  }
  if (typeof spec.blhcDatePrefix !== "string") {
    throw new Error("spec.blhcDatePrefix must be a string");
  }
  const datePrefix = spec.blhcDatePrefix.trim();
  if (typeof spec.blhcLocation !== "string") {
    throw new Error("spec.blhcLocation must be a string");
  }
  const locationName = spec.blhcLocation.trim();
  const fontSize = fontHeightK * refRadius;
  const ax = layoutBoundsRightX;
  const timeY = layoutBoundsBottomY + TEXT_DESCENT_EM * fontSize;
  // Date and clock share a baseline: the 2nd row in the BLHCBundle (above B_bottom).
  const dateY = timeY;
  // Baseline spacing is tuned to typography: location stays above the merged (date+clock) row.
  const locationY = dateY + dateAboveK * refRadius + fontSize;
  const canonical = parsedNow.canonical;
  const w = BLHC_LABEL_CHAR_WIDTH_EM * fontSize;
  const secondsWidth = 2 * w;
  const colonWidth = 1 * w;
  const clockTotalWidth = BLHC_CLOCK_TOTAL_CHARS * w;
  const separatorWidth = BLHC_DATE_TIME_SEPARATOR_SPACES * w;
  // BLHCDate is right-aligned so its right edge stops before the clock and separator.
  const dateX = ax - clockTotalWidth - separatorWidth;
  return {
    blhcLocation: {
      content: locationName,
      fontSize,
      anchor: { x: ax, y: locationY },
      hAlign: "right",
    },
    blhcDate: {
      content: datePrefix,
      fontSize,
      anchor: { x: dateX, y: dateY },
      hAlign: "right",
    },
    blhcClock: {
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

function emptyBounds() {
  return { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity };
}

function includePoint(bounds, p) {
  if (p.x < bounds.minX) bounds.minX = p.x;
  if (p.x > bounds.maxX) bounds.maxX = p.x;
  if (p.y < bounds.minY) bounds.minY = p.y;
  if (p.y > bounds.maxY) bounds.maxY = p.y;
}

function includeRect(bounds, minX, maxX, minY, maxY) {
  if (minX < bounds.minX) bounds.minX = minX;
  if (maxX > bounds.maxX) bounds.maxX = maxX;
  if (minY < bounds.minY) bounds.minY = minY;
  if (maxY > bounds.maxY) bounds.maxY = maxY;
}

function includeDiagramTextBounds(bounds, textInst) {
  const size = textInst.fontSize;
  const len = textInst.content.length;
  const width = len * size * BLHC_LABEL_CHAR_WIDTH_EM;
  let x0 = textInst.anchor.x;
  let x1 = textInst.anchor.x;
  if (textInst.hAlign === "left") {
    x1 = x0 + width;
  } else if (textInst.hAlign === "right") {
    x0 = x0 - width;
  } else {
    x0 = x0 - 0.5 * width;
    x1 = x1 + 0.5 * width;
  }
  let y0;
  let y1;
  if (textInst.dominantBaseline === "middle") {
    const halfEm = 0.52 * size;
    y0 = textInst.anchor.y - halfEm;
    y1 = textInst.anchor.y + halfEm;
  } else {
    y0 = textInst.anchor.y - TEXT_DESCENT_EM * size;
    y1 = textInst.anchor.y + TEXT_ASCENT_EM * size;
  }
  const angle = textInst.angleRad ?? 0;
  if (Math.abs(angle) < 1e-12) {
    includeRect(bounds, x0, x1, y0, y1);
    return;
  }
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  const ax = textInst.anchor.x;
  const ay = textInst.anchor.y;
  const corners = [
    { x: x0, y: y0 },
    { x: x1, y: y0 },
    { x: x1, y: y1 },
    { x: x0, y: y1 },
  ];
  for (const corner of corners) {
    const dx = corner.x - ax;
    const dy = corner.y - ay;
    includePoint(bounds, { x: ax + dx * c - dy * s, y: ay + dx * s + dy * c });
  }
}

function includeTideHeightLabelArcBounds(bounds, label) {
  const { anchor, arcCenter, arcSweepRad, fontSize, content } = label;
  const cx = arcCenter.x;
  const cy = arcCenter.y;
  const r = Math.hypot(anchor.x - cx, anchor.y - cy);
  const thetaStart = Math.atan2(anchor.y - cy, anchor.x - cx);
  const chars = Array.from(content);
  if (chars.length === 0) return;
  const glyphSweep = arcSweepRad / chars.length;
  for (let i = 0; i < chars.length; i += 1) {
    const theta = thetaStart + (i + 0.5) * glyphSweep;
    const p = {
      x: cx + r * Math.cos(theta),
      y: cy + r * Math.sin(theta),
    };
    includeDiagramTextBounds(bounds, {
      content: chars[i],
      fontSize,
      anchor: p,
      angleRad: theta + Math.PI / 2,
      hAlign: "center",
      dominantBaseline: "middle",
    });
  }
}

function extendBoundsByTideMarker(bounds, marker) {
  includeTideHeightLabelArcBounds(bounds, marker.heightLabel);
  includePoint(bounds, marker.timePointer.triangle.v1);
  includePoint(bounds, marker.timePointer.triangle.v2);
  includePoint(bounds, marker.timePointer.triangle.v3);
  const { center, radius } = marker.timePointer.circle;
  includeRect(
    bounds,
    center.x - radius,
    center.x + radius,
    center.y - radius,
    center.y + radius,
  );
}

/**
 * Optional `spec.semantic.atypicalTideSummary` switch for MainLabel copy.
 * - absent semantic / absent key => false (no override)
 * - present key must be boolean
 *
 * @param {Record<string, unknown>} spec
 * @returns {boolean}
 */
function readOptionalAtypicalTideSummary(spec) {
  const raw = spec.semantic;
  if (raw == null || typeof raw !== "object") return false;
  const semantic = /** @type {Record<string, unknown>} */ (raw);
  if (!Object.prototype.hasOwnProperty.call(semantic, "atypicalTideSummary")) {
    return false;
  }
  const value = semantic.atypicalTideSummary;
  if (typeof value !== "boolean") {
    throw new Error("spec.semantic.atypicalTideSummary must be boolean when provided");
  }
  return value;
}

/**
 * **Dividor** arc radius as dimensionless **k** (**k·RefRadius**).
 *
 * @param {Record<string, unknown>} spec
 * @returns {number}
 */
function readDividorArcRadiusKFromSpec(spec) {
  const o = requirePlainObject(spec.dividorArc, "spec.dividorArc");
  const radiusK = requireFiniteNumber(o.radiusK, "spec.dividorArc.radiusK");
  if (!(radiusK > 0)) {
    throw new Error("spec.dividorArc.radiusK must be greater than 0");
  }
  return radiusK;
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
  const armRefArcGapK = requireFiniteNumber(
    hand.armRefArcGap,
    "spec.hand.armRefArcGap",
  );
  if (!(armRefArcGapK >= 0)) {
    throw new Error("spec.hand.armRefArcGap must be >= 0");
  }
  const armTimeLabelFontHeightK = requireFiniteNumber(
    hand.armTimeLabelFontHeight,
    "spec.hand.armTimeLabelFontHeight",
  );
  if (!(armTimeLabelFontHeightK > 0)) {
    throw new Error("spec.hand.armTimeLabelFontHeight must be greater than 0");
  }
  const parsedNow = parseCanonicalTimeOrThrow(spec.timeNow, "spec.timeNow");
  if (parsedNow.isRightEndpoint) {
    throw new Error('spec.timeNow cannot be "24:00:00"');
  }
  const theta = timeToTheta(parsedNow.hours, thetaLeft, thetaRight);
  const unit = polar(1, theta);
  const rBoss = bossCircleRadiusK * refRadius;
  const rArmOuter = refRadius - armRefArcGapK * refRadius;
  if (!(rBoss < rArmOuter)) {
    throw new Error(
      "spec.hand radial ordering invalid: require r_boss < RefRadius − armRefArcGap·RefRadius",
    );
  }
  const armStart = { x: unit.x * rBoss, y: unit.y * rBoss };
  const armEnd = { x: unit.x * rArmOuter, y: unit.y * rArmOuter };
  const mid = {
    x: 0.5 * (armStart.x + armEnd.x),
    y: 0.5 * (armStart.y + armEnd.y),
  };
  const sinT = Math.sin(theta);
  const cosT = Math.cos(theta);
  /** Unit tangent along RefArc toward **earlier** time (decreasing θ). */
  const earlierAlongArcX = sinT;
  const earlierAlongArcY = -cosT;
  const offsetR = 0.05 * refRadius;
  const halfDayMode = parseCivilHalfDayLayoutOrThrow(spec.civilHalfDayLayout);
  const beforeNoon = resolveCivilHalfDayIsBeforeNoon(halfDayMode, parsedNow.hours);
  const offX = beforeNoon
    ? earlierAlongArcX * offsetR
    : -earlierAlongArcX * offsetR;
  const offY = beforeNoon
    ? earlierAlongArcY * offsetR
    : -earlierAlongArcY * offsetR;
  /** Inline axis toward origin (a.m.) vs outward (p.m.); see tide-diagram Hand arm label. */
  const angleRad = beforeNoon ? theta + Math.PI : theta;
  return {
    timeHours: parsedNow.hours,
    theta,
    bossCircle: { center: { x: 0, y: 0 }, radius: rBoss },
    arm: { start: armStart, end: armEnd },
    armTimeLabel: {
      content: /** @type {string} */ (spec.timeNow),
      fontSize: armTimeLabelFontHeightK * refRadius,
      anchor: { x: mid.x + offX, y: mid.y + offY },
      angleRad,
    },
  };
}

/**
 * @param {Record<string, unknown>} spec
 * @returns {import('../model/tideDiagramModel.mjs').TideDiagramDocument}
 */
export function buildDiagram(spec) {
  const title = requireString(spec.title, "spec.title");

  const refRadius = requireFiniteNumber(spec.refRadius, "spec.refRadius");
  const sweepRad = requireFiniteNumber(spec.sweepRad, "spec.sweepRad");
  const tickLabelTickLen = requireFiniteNumber(
    spec.tickLabelTickLen,
    "spec.tickLabelTickLen",
  );
  const tickLabelSize = requireFiniteNumber(
    spec.tickLabelSize,
    "spec.tickLabelSize",
  );
  const tickLabelClearance = requireFiniteNumber(
    spec.tickLabelClearance,
    "spec.tickLabelClearance",
  );

  const { thetaLeft, thetaRight } = refArcAngles(sweepRad);
  const dividorArcRadiusK = readDividorArcRadiusKFromSpec(spec);
  const annularBand = buildAnnularBandFromSpec(
    spec,
    refRadius,
    thetaLeft,
    sweepRad,
  );
  const annularBandTickLen = (annularBand.rOuter - annularBand.rInner) / refRadius;
  if (tickLabelTickLen <= 0 || tickLabelTickLen >= annularBandTickLen) {
    throw new Error(
      "spec.tickLabelTickLen must be greater than 0 and shorter than annularBand width (k·RefRadius)",
    );
  }

  const labelHours = readTickLabelHours(spec);
  const tickLabelHoursSet = new Set(labelHours);
  const rInner = 1.0 * refRadius;
  const rBandOuter = annularBand.rOuter;

  /** @type {import('../model/tideDiagramModel.mjs').TickMarkSpec[]} */
  const tickMarks = [];
  for (let h = 0; h <= 24; h += 1) {
    const theta = timeToTheta(h, thetaLeft, thetaRight);
    const tickLen = tickLabelHoursSet.has(h) ? tickLabelTickLen : annularBandTickLen;
    const rOuter = (1.0 + tickLen) * refRadius;
    const deltaR = tickLen * refRadius;
    tickMarks.push({
      hour: h,
      theta,
      start: polar(rInner, theta),
      end: polar(rOuter, theta),
      bandOuterInward: {
        start: polar(rBandOuter, theta),
        end: polar(rBandOuter - deltaR, theta),
      },
    });
  }

  const byHour = new Map(tickMarks.map((tm) => [tm.hour, tm]));
  /** @type {import('../model/tideDiagramModel.mjs').TickLabelSpec[]} */
  const tickLabels = [];
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

  const tideMarks = buildTideMarksFromSpec(
    spec,
    refRadius,
    thetaLeft,
    thetaRight,
  );
  const hand = buildHandFromSpec(spec, refRadius, thetaLeft, thetaRight);
  const annularBounds = annularBandBounds(annularBand);
  const layoutBounds = emptyBounds();
  includeRect(
    layoutBounds,
    annularBounds.minX,
    annularBounds.maxX,
    annularBounds.minY,
    annularBounds.maxY,
  );
  includePoint(layoutBounds, { x: 0, y: hand.bossCircle.radius });
  for (const marker of tideMarks) {
    extendBoundsByTideMarker(layoutBounds, marker);
  }
  const layoutBoundsBottomMarginK = readLayoutBoundsBottomMarginKFromSpec(spec);
  layoutBounds.minY -= layoutBoundsBottomMarginK * refRadius;
  if (tickLabels.length === 0) {
    throw new Error(
      "spec.tickLabelHours must list at least one hour: BLHCBundle clock row uses the minimum Y among tick label anchors",
    );
  }
  const tickLabelMinAnchorY = Math.min(...tickLabels.map((tl) => tl.anchor.y));
  const { blhcLocation, blhcDate, blhcClock } = buildBlhcBundleFromSpec(
    spec,
    refRadius,
    layoutBounds.maxX,
    layoutBounds.minY,
  );
  const leftmostTickLabelX = Math.min(
    ...tickLabels.map((tl) =>
      tl.anchor.x -
      0.5 * tl.content.length * BLHC_LABEL_CHAR_WIDTH_EM * tl.fontSize,
    ),
  );

  const parsedNowForMainLabel = parseCanonicalTimeOrThrow(spec.timeNow, "spec.timeNow");
  if (parsedNowForMainLabel.isRightEndpoint) {
    throw new Error('spec.timeNow cannot be "24:00:00"');
  }
  const nextEventForMainLabel = computeNextTideEventFromSpec(spec, parsedNowForMainLabel);
  const atypicalTideSummary = readOptionalAtypicalTideSummary(spec);
  let mainLabelContent = "";
  if (nextEventForMainLabel == null) {
    mainLabelContent = "Next tide extreme tomorrow";
  } else if (atypicalTideSummary) {
    mainLabelContent = "Tricky tides today";
  } else {
    mainLabelContent = `${nextEventForMainLabel.kind} tide at ${formatEventClockHHMM(nextEventForMainLabel.seconds)}`;
  }
  const mainLabel = buildMainLabel(leftmostTickLabelX, layoutBounds.minY, refRadius, mainLabelContent);
  const mainLabelTopY = mainLabel.anchor.y + TEXT_ASCENT_EM * mainLabel.fontSize;
  const homeMenuTriggerGap = readHomeMenuTriggerGapFromSpec(spec, refRadius);
  const homeMenuTrigger = buildHomeMenuTriggerFromSpec(
    spec,
    refRadius,
    layoutBounds.minX,
    mainLabelTopY + homeMenuTriggerGap,
  );

  return {
    version: 1,
    meta: { title },
    paintOrder: spec.paintOrder,
    refArc: {
      center: { x: 0, y: 0 },
      refRadius,
      sweepRad,
      thetaLeft,
      thetaRight,
    },
    dividorArc: { radiusK: dividorArcRadiusK },
    mainLabel,
    tickMarks,
    tickLabels,
    tideMarks,
    annularBand,
    homeMenuTrigger,
    hand,
    blhcLocation,
    blhcDate,
    blhcClock,
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
 * @param {number} anchorX
 * @param {number} bottomEdgeY
 * @param {number} refRadius
 * @param {string} content
 * @returns {import('../model/tideDiagramModel.mjs').MainLabelDiagram}
 */
function buildMainLabel(anchorX, bottomEdgeY, refRadius, content) {
  const fontSize = 0.045 * refRadius;
  return {
    content,
    fontSize,
    anchor: { x: anchorX, y: bottomEdgeY + TEXT_DESCENT_EM * fontSize },
    hAlign: "left",
  };
}

/**
 * @param {Record<string, unknown>} spec
 * @param {number} refRadius
 * @returns {number}
 */
/**
 * Optional **k·R** margin extending global layout **B_bottom** downward (see tide-diagram spec pass 3).
 *
 * @param {Record<string, unknown>} spec
 * @returns {number} dimensionless k (multiply by refRadius for model units)
 */
function readLayoutBoundsBottomMarginKFromSpec(spec) {
  const raw = spec.layoutBoundsBottomMargin;
  if (raw === undefined || raw === null) {
    return 0;
  }
  const k = requireFiniteNumber(raw, "spec.layoutBoundsBottomMargin");
  if (k < 0) {
    throw new Error("spec.layoutBoundsBottomMargin must be >= 0");
  }
  return k;
}

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

