/**
 * Tunable layout for the Home tide diagram (`DiagramGenerationSpec` / diagram-generation).
 * Open this preset to adjust geometry; assembly lives in `application/buildDiagramGenerationSpec`.
 */

import type { HomeTideDiagramLayoutBase } from "./homeTideDiagram.types";

/** Static layout/geometry for the Home tide diagram (canonical values live in this object). */
export const homeTideDiagramLayoutBase = {
  title: "home-tide-diagram",
  canvas: { width: 420, height: 320 },
  refRadius: 118,
  sweepRad: Math.PI,
  tickLabelTickLen: 0.02,
  /** Every integer hour on the dial except the 24:00 endpoint (labels 00–23). */
  tickLabelHours: Array.from({ length: 24 }, (_, h) => h),
  tickLabelSize: 0.04,
  tickLabelClearance: 0.023,
  timeNowLabel: { fontHeight: 0.045, dateAboveTime: 0.02 },
  hand: {
    bossCircleRadius: 0.05,
    /** k·RefRadius: arm outer end is this far inside the RefArc (0 = flush with RefArc). */
    armRefArcGap: 0.015,
  },
  paintOrder: {
    overrides: [{ name: "Hand", place: "before", relativeTo: "AnnularBand" }],
  },
  annularBand: { annularBandWidth: 0.08 },
  homeMenuTrigger: {
    width: 0.2,
    height: 0.13,
    gapAboveMainLabel: 0.07,
    cornerRadius: 0.038,
    labelSize: 0.042,
    label: "Menu",
  },
  tideMarksDefaults: {
    tideLabelRadius: 1.17,
    tideHeightLabelSize: 0.045,
    tideMarkArrowDivergence: 0.8,
    tideMarkArrowLineLen: 0.045,
  },
} satisfies HomeTideDiagramLayoutBase;
