/**
 * buildDiagram.mjs — Orchestrates layout submodules into a `TideDiagramDocument` from an open spec.
 * Fed by the app collaborator; downstream: `toScene` and SVG render. Kind: Orchestrator / coordinator.
 * Does not emit SVG strings.
 *
 * See docs/specs/tide-diagram.md; spec keys mirror the open object passed from the app (`diagramCollaborator.ts`).
 *
 * Policies for {@link buildDiagram}:
 * - Throws if `spec.title`, ref arc, and tick/tick-label sizing omit
 *   required fields or supply non-finite numbers (no silent defaults).
 * - `spec.tickLabelHours` must be an array of integers in 0..24; invalid entries throw.
 * - Sub-builders (`buildTideMarksFromSpec`) enforce their own throw rules.
 * - `**annularBand**` is required: plain object with finite `**annularBandWidth**` (**k·R**) **> 0**.
 * - Optional `**layoutBoundsBottomMargin**` (**k·R**, **>= 0**): pass 3 of global layout bounds; extends **B_bottom** downward; when omitted, **0**.
 * - Optional `**civilHalfDayLayout**`: `"auto"` | `"beforeNoon"` | `"afterNoon"`; when omitted, **`"auto"`**. Selects civil half-day **presentation** branches (e.g. **Hand.TimeReadout** placement) without changing **`timeNow`** or **θ_now** (see tide-diagram spec).
 * - `**dividorArc**` is required: plain object with finite `**radiusK**` (**> 0**, **k·R** arc radius).
 * - `**homeMenuTrigger**` is required: plain object with finite `**diameter**`, `**menuLeftPadding**`, `**menuAboveBottom**`, `**iconBarLength**`, and `**iconBarGap**` (all **k·R**; diameter and iconBarLength **> 0**; paddings and **iconBarGap** **>= 0**). Placed as a **top-level** scene sibling (**not** inside **BRHCBundle**): leading edge inset from **B_left** by **`menuLeftPadding·R`**; the **bottom** of the circular control lies **`menuAboveBottom·R`** above **B_bottom** (**Y** upward). Independent of **Brand** placement. Trigger bounds are **not** merged into `layoutBounds` (see tide-diagram.md §Global layout bounds).
 * - **MainLabel** is horizontal text inside **BRHCBundle**: **right**-justified to global **B_right** like other bundle rows; baseline **Y** is independent (see spec), not curved arc text.
 * - `**brhcBundle**` is required (plain object with finite **fontHeight** and **dateAboveTime** as **k·R**); `**brhcDatePrefix**` is a required string (see spec).
 * - `**brandFontHeight**` is required: finite **k·R** **> 0** for **BrandURL** font height (see tide-diagram spec §Brand).
 * - `**brandAboveBottom**` is required: finite **k·R** **>= 0**; **BrandURL** alphabetic baseline **`y = B_bottom + brandAboveBottom·R`**.
 * - `**brandQrGap**` is required: finite **k·R** **>= 0**; horizontal gap between URL text and **BrandQR**.
 * - `**brandQrSize**` is required: finite **k·R** **> 0**; **BrandQR** square side (independent of **`brandFontHeight`**).
 */
import { buildTideMarksFromSpec } from "./tideMarks.mjs";
import { encodeQrMatrix } from "../qr/encodeQrMatrix.mjs";
import {
  requireFiniteNumber,
  requirePlainObject,
  requireString,
} from "./specRequire.mjs";
import {
  parseCivilHalfDayLayoutOrThrow,
  resolveCivilHalfDayIsBeforeNoon,
} from "../model/civilHalfDayLayout.mjs";
import { handBossCircleMaxRadiusForLayout } from "./handBossLivePulse.mjs";
import { parseCanonicalTimeOrThrow } from "../model/timeCanonical.mjs";
import { computeNextTideEventFromSpec } from "../model/tideEvents.mjs";
import {
  annularBandBounds,
  polar,
  refArcAngles,
  timeToTheta,
} from "../model/tideDiagramModel.mjs";

/** Per-character scene width heuristic for monospace-ish labels; must match `0.6` in scene preview framing (`toScene.mjs`). */
const BRHC_LABEL_CHAR_WIDTH_EM = 0.6;
const TEXT_ASCENT_EM = 0.8;
const TEXT_DESCENT_EM = 0.2;
const HAND_NOW_TAG_TEXT = "time now";
const HAND_BOSS_LABEL_TEXT = "Tides";

/** Fixed **BrandURL** display copy. */
const BRAND_URL = "thetidedial.page";
/** Fixed **BrandQR** scannable payload (full URL). */
const BRAND_QR_PAYLOAD = "https://thetidedial.page";

/**
 * **BRHCBundle**: **MainLabel** (tide summary, bottom row), **BRHCDate**, **BRHCLocation** — each row **right**-justified to **B_right**;
 * **Y** baselines are independent per row (see spec).
 *
 * @param {Record<string, unknown>} spec
 * @param {number} refRadius
 * @param {number} layoutBoundsRightX diagram-space **B_right** (global layout bounds after diagram-wide extent pass; see spec)
 * @param {number} layoutBoundsBottomY diagram-space bottom edge of global layout bounds
 * @param {string} mainLabelContent synthesized **MainLabel** line
 * @returns {{
 *   mainLabel: import('../model/tideDiagramModel.mjs').MainLabelDiagram,
 *   brhcLocation: import('../model/tideDiagramModel.mjs').DiagramTextInst,
 *   brhcDate: import('../model/tideDiagramModel.mjs').DiagramTextInst,
 * }}
 */
function buildBrhcBundleFromSpec(
  spec,
  refRadius,
  layoutBoundsRightX,
  layoutBoundsBottomY,
  mainLabelContent,
) {
  const o = requirePlainObject(spec.brhcBundle, "spec.brhcBundle");
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
      "spec.brhcBundle requires finite numbers fontHeight and dateAboveTime (RefRadius multiples); dateAboveTime must be >= 0",
    );
  }
  if (typeof spec.brhcDatePrefix !== "string") {
    throw new Error("spec.brhcDatePrefix must be a string");
  }
  const datePrefix = spec.brhcDatePrefix.trim();
  if (typeof spec.brhcLocation !== "string") {
    throw new Error("spec.brhcLocation must be a string");
  }
  const locationName = spec.brhcLocation.trim();
  const fontSize = fontHeightK * refRadius;
  const ax = layoutBoundsRightX;
  // **MainLabel** bottom row: baseline aligns so the row sits on **B_bottom** (see spec).
  const mainLabelBaselineY = layoutBoundsBottomY + TEXT_DESCENT_EM * fontSize;
  const dateY = mainLabelBaselineY + dateAboveK * refRadius + fontSize;
  const locationY = dateY + dateAboveK * refRadius + fontSize;
  const mainLabel = buildMainLabel(ax, mainLabelBaselineY, fontSize, mainLabelContent);
  return {
    mainLabel,
    brhcLocation: {
      content: locationName,
      fontSize,
      anchor: { x: ax, y: locationY },
      hAlign: "right",
    },
    brhcDate: {
      content: datePrefix,
      fontSize,
      anchor: { x: ax, y: dateY },
      hAlign: "right",
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

/**
 * Axis-aligned extrema of a circular arc centred at **(cx, cy)** with radius **r** from **thetaLeft** CCW by **sweepRad**.
 * Matches the sampling policy of {@link annularBandBounds} (endpoints plus interior cardinal angles).
 *
 * @param {{ minX: number, maxX: number, minY: number, maxY: number }} bounds
 * @param {number} cx
 * @param {number} cy
 * @param {number} r
 * @param {number} thetaLeft
 * @param {number} sweepRad
 */
function includeArcSweepAxisBounds(bounds, cx, cy, r, thetaLeft, sweepRad) {
  const thetaRight = thetaLeft + sweepRad;
  const lo = Math.min(thetaLeft, thetaRight);
  const hi = Math.max(thetaLeft, thetaRight);
  const consider = (theta) => {
    includePoint(bounds, { x: cx + r * Math.cos(theta), y: cy + r * Math.sin(theta) });
  };
  consider(thetaLeft);
  consider(thetaRight);
  for (let n = -12; n <= 12; n += 1) {
    const th = n * Math.PI;
    if (th > lo && th < hi) consider(th);
  }
}

/**
 * Expands **bounds** so **B_right** (and other edges) reflect diagram-wide geometry used for **BRHCBundle** alignment,
 * excluding **BRHCBundle** itself.
 *
 * @param {{ minX: number, maxX: number, minY: number, maxY: number }} bounds
 * @param {{
 *   tickLabels: import('../model/tideDiagramModel.mjs').TickLabelSpec[],
 *   armTimeReadout: import('../model/tideDiagramModel.mjs').HandTimeReadoutPartDiagram,
 *   refRadius: number,
 *   dividorRadius: number,
 *   thetaLeft: number,
 *   sweepRad: number,
 * }} p
 */
function extendLayoutBoundsForDiagramExtent(bounds, p) {
  for (const tl of p.tickLabels) {
    includeDiagramTextBounds(bounds, {
      content: tl.content,
      fontSize: tl.fontSize,
      anchor: tl.anchor,
      hAlign: "center",
    });
  }
  includeArcSweepAxisBounds(bounds, 0, 0, p.refRadius, p.thetaLeft, p.sweepRad);
  includeArcSweepAxisBounds(bounds, 0, 0, p.dividorRadius, p.thetaLeft, p.sweepRad);
  const ar = p.armTimeReadout;
  includeDiagramTextBounds(bounds, {
    content: `${ar.nowTagContent} ${ar.timeContent}`,
    fontSize: ar.fontSize,
    anchor: ar.anchor,
    hAlign: "center",
    angleRad: ar.angleRad,
    dominantBaseline: "middle",
  });
}

function includeDiagramTextBounds(bounds, textInst) {
  const size = textInst.fontSize;
  const len = textInst.content.length;
  const width = len * size * BRHC_LABEL_CHAR_WIDTH_EM;
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
  const bossLabelFontHeightK = requireFiniteNumber(
    hand.bossLabelFontHeight,
    "spec.hand.bossLabelFontHeight",
  );
  if (!(bossLabelFontHeightK > 0)) {
    throw new Error("spec.hand.bossLabelFontHeight must be greater than 0");
  }
  const livePulse = requirePlainObject(hand.livePulse, "spec.hand.livePulse");
  const livePulsePeriodSeconds = requireFiniteNumber(
    livePulse.periodSeconds,
    "spec.hand.livePulse.periodSeconds",
  );
  if (!(livePulsePeriodSeconds > 0)) {
    throw new Error("spec.hand.livePulse.periodSeconds must be greater than 0");
  }
  const livePulseRadiusRelativeAmplitude = requireFiniteNumber(
    livePulse.radiusRelativeAmplitude,
    "spec.hand.livePulse.radiusRelativeAmplitude",
  );
  if (!(livePulseRadiusRelativeAmplitude >= 0)) {
    throw new Error("spec.hand.livePulse.radiusRelativeAmplitude must be >= 0");
  }
  const livePulseOpacityRelativeAmplitude = requireFiniteNumber(
    livePulse.opacityRelativeAmplitude,
    "spec.hand.livePulse.opacityRelativeAmplitude",
  );
  if (!(livePulseOpacityRelativeAmplitude >= 0)) {
    throw new Error("spec.hand.livePulse.opacityRelativeAmplitude must be >= 0");
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
  const timeNow = /** @type {string} */ (spec.timeNow);
  const fontSize = armTimeLabelFontHeightK * refRadius;
  const ax = mid.x + offX;
  const ay = mid.y + offY;
  return {
    timeHours: parsedNow.hours,
    theta,
    bossCircle: { center: { x: 0, y: 0 }, radius: rBoss },
    livePulse: {
      periodSeconds: livePulsePeriodSeconds,
      radiusRelativeAmplitude: livePulseRadiusRelativeAmplitude,
      opacityRelativeAmplitude: livePulseOpacityRelativeAmplitude,
    },
    bossLabel: {
      content: HAND_BOSS_LABEL_TEXT,
      fontSize: bossLabelFontHeightK * refRadius,
      anchor: { x: 0, y: 0 },
    },
    arm: { start: armStart, end: armEnd },
    armTimeReadout: {
      timeContent: timeNow.slice(0, 5),
      nowTagContent: HAND_NOW_TAG_TEXT,
      fontSize,
      anchor: { x: ax, y: ay },
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
  includePoint(layoutBounds, {
    x: 0,
    y: handBossCircleMaxRadiusForLayout(
      hand.bossCircle.radius,
      hand.livePulse.radiusRelativeAmplitude,
    ),
  });
  for (const marker of tideMarks) {
    extendBoundsByTideMarker(layoutBounds, marker);
  }
  const layoutBoundsBottomMarginK = readLayoutBoundsBottomMarginKFromSpec(spec);
  layoutBounds.minY -= layoutBoundsBottomMarginK * refRadius;
  if (tickLabels.length === 0) {
    throw new Error(
      "spec.tickLabelHours must list at least one hour (reference product lists 1..23)",
    );
  }

  extendLayoutBoundsForDiagramExtent(layoutBounds, {
    tickLabels,
    armTimeReadout: hand.armTimeReadout,
    refRadius,
    dividorRadius: dividorArcRadiusK * refRadius,
    thetaLeft,
    sweepRad,
  });

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

  const { mainLabel, brhcLocation, brhcDate } = buildBrhcBundleFromSpec(
    spec,
    refRadius,
    layoutBounds.maxX,
    layoutBounds.minY,
    mainLabelContent,
  );
  includeDiagramTextBounds(layoutBounds, {
    content: mainLabel.content,
    fontSize: mainLabel.fontSize,
    anchor: mainLabel.anchor,
    hAlign: "right",
  });

  const brandFontHeightK = readBrandFontHeightKFromSpec(spec);
  const brandAboveBottomK = readBrandAboveBottomKFromSpec(spec);
  const brandQrGapK = readBrandQrGapKFromSpec(spec);
  const brandQrSizeK = readBrandQrSizeKFromSpec(spec);
  const brandFontSize = brandFontHeightK * refRadius;
  const brandBaselineY = layoutBounds.minY + brandAboveBottomK * refRadius;
  const brandLeadingX = layoutBounds.minX;
  const brandUrlTextWidth = BRAND_URL.length * brandFontSize * BRHC_LABEL_CHAR_WIDTH_EM;
  const brandQrGap = brandQrGapK * refRadius;
  const brandQrSide = brandQrSizeK * refRadius;
  const textEmCenterY =
    brandBaselineY + 0.5 * (TEXT_ASCENT_EM - TEXT_DESCENT_EM) * brandFontSize;
  const qrEncoded = encodeQrMatrix(BRAND_QR_PAYLOAD);
  const brandQrOrigin = {
    x: brandLeadingX + brandUrlTextWidth + brandQrGap,
    y: textEmCenterY - 0.5 * brandQrSide,
  };
  const brandQrModuleSize = brandQrSide / qrEncoded.moduleCount;
  const brand = {
    brandUrl: {
      content: BRAND_URL,
      fontSize: brandFontSize,
      anchor: { x: brandLeadingX, y: brandBaselineY },
      hAlign: /** @type {const} */ ("left"),
    },
    brandQr: {
      payload: BRAND_QR_PAYLOAD,
      origin: brandQrOrigin,
      moduleSize: brandQrModuleSize,
      moduleCount: qrEncoded.moduleCount,
      cells: qrEncoded.cells,
    },
  };
  const homeMenuTrigger = buildHomeMenuTriggerFromSpec(
    spec,
    refRadius,
    layoutBounds.minX,
    layoutBounds.minY,
  );
  // Intentionally omit homeMenuTrigger from layoutBounds — spec: menu geometry must not expand B_*.
  includeDiagramTextBounds(layoutBounds, {
    content: brand.brandUrl.content,
    fontSize: brand.brandUrl.fontSize,
    anchor: brand.brandUrl.anchor,
    hAlign: brand.brandUrl.hAlign,
  });
  includeQrMatrixBounds(layoutBounds, brand.brandQr);

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
    brhcLocation,
    brhcDate,
    brand,
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
 * @param {number} anchorRightX trailing edge **B_right**
 * @param {number} baselineY text baseline in diagram space
 * @param {number} fontSize diagram-space **FontHeight** (**`brhcBundle.fontHeight·RefRadius`**)
 * @param {string} content
 * @returns {import('../model/tideDiagramModel.mjs').MainLabelDiagram}
 */
function buildMainLabel(anchorRightX, baselineY, fontSize, content) {
  return {
    content,
    fontSize,
    anchor: { x: anchorRightX, y: baselineY },
    hAlign: "right",
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

/**
 * **k·R** font height for **Brand** (fixed URL line; see tide-diagram spec).
 *
 * @param {Record<string, unknown>} spec
 * @returns {number} dimensionless k
 */
function readBrandFontHeightKFromSpec(spec) {
  const k = requireFiniteNumber(spec.brandFontHeight, "spec.brandFontHeight");
  if (!(k > 0)) {
    throw new Error("spec.brandFontHeight must be greater than 0");
  }
  return k;
}

/**
 * **k·R** offset from **B_bottom** to **Brand** alphabetic baseline (see tide-diagram spec §Brand).
 *
 * @param {Record<string, unknown>} spec
 * @returns {number} dimensionless k
 */
function readBrandAboveBottomKFromSpec(spec) {
  const k = requireFiniteNumber(spec.brandAboveBottom, "spec.brandAboveBottom");
  if (k < 0) {
    throw new Error("spec.brandAboveBottom must be >= 0");
  }
  return k;
}

/**
 * **k·R** horizontal gap between **BrandURL** text and **BrandQR** (see tide-diagram spec §Brand).
 *
 * @param {Record<string, unknown>} spec
 */
function readBrandQrGapKFromSpec(spec) {
  const k = requireFiniteNumber(spec.brandQrGap, "spec.brandQrGap");
  if (k < 0) {
    throw new Error("spec.brandQrGap must be >= 0");
  }
  return k;
}

/**
 * **k·R** **BrandQR** square side (see tide-diagram spec §Brand).
 *
 * @param {Record<string, unknown>} spec
 */
function readBrandQrSizeKFromSpec(spec) {
  const k = requireFiniteNumber(spec.brandQrSize, "spec.brandQrSize");
  if (!(k > 0)) {
    throw new Error("spec.brandQrSize must be greater than 0");
  }
  return k;
}

/**
 * @param {{ minX: number, maxX: number, minY: number, maxY: number }} bounds
 * @param {import('../model/tideDiagramModel.mjs').BrandQrDiagram} qr
 */
function includeQrMatrixBounds(bounds, qr) {
  const side = qr.moduleCount * qr.moduleSize;
  includeRect(bounds, qr.origin.x, qr.origin.x + side, qr.origin.y, qr.origin.y + side);
}

/**
 * @param {Record<string, unknown>} spec
 * @param {number} refRadius
 * @param {number} leftEdgeX **B_left** (inset reference for the circular control)
 * @param {number} bBottom **B_bottom** (global layout min **Y**)
 * @returns {import('../model/tideDiagramModel.mjs').HomeMenuTriggerDiagram}
 */
function buildHomeMenuTriggerFromSpec(spec, refRadius, leftEdgeX, bBottom) {
  const o = requirePlainObject(spec.homeMenuTrigger, "spec.homeMenuTrigger");
  const diameterK = requireFiniteNumber(o.diameter, "spec.homeMenuTrigger.diameter");
  const menuLeftPaddingK = requireFiniteNumber(
    o.menuLeftPadding,
    "spec.homeMenuTrigger.menuLeftPadding",
  );
  const menuAboveBottomK = requireFiniteNumber(
    o.menuAboveBottom,
    "spec.homeMenuTrigger.menuAboveBottom",
  );
  const iconBarLengthK = requireFiniteNumber(
    o.iconBarLength,
    "spec.homeMenuTrigger.iconBarLength",
  );
  const iconBarGapK = requireFiniteNumber(o.iconBarGap, "spec.homeMenuTrigger.iconBarGap");
  if (!(diameterK > 0)) {
    throw new Error("spec.homeMenuTrigger.diameter must be greater than 0");
  }
  if (menuLeftPaddingK < 0) {
    throw new Error("spec.homeMenuTrigger.menuLeftPadding must be >= 0");
  }
  if (menuAboveBottomK < 0) {
    throw new Error("spec.homeMenuTrigger.menuAboveBottom must be >= 0");
  }
  if (!(iconBarLengthK > 0)) {
    throw new Error("spec.homeMenuTrigger.iconBarLength must be greater than 0");
  }
  if (iconBarGapK < 0) {
    throw new Error("spec.homeMenuTrigger.iconBarGap must be >= 0");
  }
  const diameter = diameterK * refRadius;
  const menuBottomY = bBottom + menuAboveBottomK * refRadius;
  const centerY = menuBottomY + 0.5 * diameter;
  const centerX = leftEdgeX + menuLeftPaddingK * refRadius + 0.5 * diameter;
  return {
    center: { x: centerX, y: centerY },
    diameter,
    iconBarHalfLength: 0.5 * iconBarLengthK * refRadius,
    iconBarCenterSpacing: iconBarGapK * refRadius,
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
