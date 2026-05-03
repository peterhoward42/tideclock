/**
 * Tunable layout for the Home tide diagram (`DiagramGenerationSpec` / diagram-generation).
 * Open this preset to adjust geometry; assembly lives in `application/buildDiagramGenerationSpec`.
 */

import type { HomeTideDiagramLayoutBase } from "./homeTideDiagram.types";

const tideMarksDefaults = {
  tideLabelRadius: 1.28,
  tideHeightLabelSize: 0.045,
  tideMarkArrowDivergence: 0.8,
  tideMarkArrowLineLen: 0.045,
  /** Negative k·R: inset tip from AnnularBand outer edge (clearance). */
  tideMarkOuterBandGap: 0.025,
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
  tickLabelTickLen: 0.025,
  tickLabelHours: Array.from({ length: 23 }, (_, i) => i + 1),
  tickLabelSize: 0.04,
  tickLabelClearance: 0.042,
  blhcBundle: { fontHeight: 0.045, dateAboveTime: 0.02 },
  /** k·RefRadius: bottom-left brand line (`thetideclock.page`). */
  brandFontHeight: 0.04,
  hand: {
    bossCircleRadius: 0.05,
    /** k·RefRadius: arm outer end is this far inside the RefArc (0 = flush with RefArc). */
    armRefArcGap: 0.040,
    armTimeLabelFontHeight: 0.045,
  },
  paintOrder: {
    overrides: [{ name: "Hand", place: "before", relativeTo: "AnnularBand" }],
  },
  annularBand: { annularBandWidth: 0.14 },
  /** k·refRadius: stroked arc concentric with RefArc, same sweep. */
  dividorArc: { radiusK: 1.32 },
  homeMenuTrigger: {
    diameter: 0.18,
    gapAboveLocation: 0.070,
    iconBarLength: 0.09,
    iconBarGap: 0.025,
  },
  tideMarksDefaults,
} satisfies HomeTideDiagramLayoutBase;
