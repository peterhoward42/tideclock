/**
 * Tunable layout for the Home tide diagram (`DiagramGenerationSpec` / diagram-generation).
 * Open this preset to adjust geometry; assembly lives in `application/buildDiagramGenerationSpec`.
 */

import type { HomeTideDiagramLayoutBase } from "./homeTideDiagram.types";

const tideMarksDefaults = {
  tideLabelRadius: 1.22,
  tideHeightLabelSize: 0.045,
  tideMarkArrowDivergence: 0.8,
  tideMarkArrowLineLen: 0.045,
  /** Negative k·R: inset tip from AnnularBand outer edge (clearance). */
  tideMarkOuterBandGap: 0.012,
} as const;

/** Static layout/geometry for the Home tide diagram (canonical values live in this object). */
export const homeTideDiagramLayoutBase = {
  title: "home-tide-diagram",
  /** Defaults to auto. Or cite beforeNoon, afterNoon to force one or the other for testing.
   */
  civilHalfDayLayout: "auto",
  refRadius: 118,
  layoutBoundsBottomMargin: 0.05,
  sweepRad: Math.PI,
  tickLabelTickLen: 0.02,
  /** Every integer hour on the dial except midnight and the 24:00 endpoint (labels 01–23). */
  tickLabelHours: Array.from({ length: 23 }, (_, i) => i + 1),
  tickLabelSize: 0.04,
  tickLabelClearance: 0.023,
  timeNowLabel: { fontHeight: 0.045, dateAboveTime: 0.02 },
  hand: {
    bossCircleRadius: 0.05,
    /** k·RefRadius: arm outer end is this far inside the RefArc (0 = flush with RefArc). */
    armRefArcGap: 0.020,
    /** k·RefRadius: font height for **HandArmTimeLabel** (canonical `timeNow` along the arm). */
    armTimeLabelFontHeight: 0.04,
  },
  paintOrder: {
    overrides: [{ name: "Hand", place: "before", relativeTo: "AnnularBand" }],
  },
  annularBand: { annularBandWidth: 0.10 },
  /** k·refRadius: stroked arc concentric with RefArc, same sweep. */
  dividorArc: { radiusK: 1.25 },
  homeMenuTrigger: {
    width: 0.2,
    height: 0.13,
    gapAboveMainLabel: 0.07,
    cornerRadius: 0.038,
    labelSize: 0.042,
    label: "Menu",
  },
  tideMarksDefaults,
} satisfies HomeTideDiagramLayoutBase;
