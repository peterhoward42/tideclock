/**
 * Tunable layout for the Home tide diagram (`DiagramSpec` / diagram-generation).
 * Open this preset to adjust geometry; assembly lives in `application/buildDiagramSpec`.
 */

import type { HomeLayoutBase } from "./homeLayout.types";

const tideMarksDefaults = {
  tideLabelRadius: 1.28,
  tideHeightLabelSize: 0.045,
  tideMarkArrowDivergence: 0.8,
  tideMarkArrowLineLen: 0.045,
  /** Negative k·R: inset tip from AnnularBand outer edge (clearance). */
  tideMarkOuterBandGap: 0.025,
} as const;

/** Static layout/geometry for the Home tide diagram (canonical values live in this object). */
export const homeLayoutBase = {
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
  brhcBundle: {
    fontHeight: 0.045,
    dateAboveTime: 0.02,
    locationAboveDate: 0.04,
  },
  hand: {
    bossCircleRadius: 0.1,
    /** k·RefRadius: arm outer end is this far inside the RefArc (0 = flush with RefArc). */
    armRefArcGap: 0.040,
    armTimeLabelFontHeight: 0.045,
    /** k·RefRadius: centered label inside the hand boss circle ("Tides"). */
    bossLabelFontHeight: 0.048,
    livePulse: {
      periodSeconds: 4,
      radiusRelativeAmplitude: 0.04,
      /**
       * Kept alongside geometry pulse settings (rather than style config) because the pulse is one
       * coherent animation envelope authored with radius behavior and consumed in scene construction.
       */
      opacityRelativeAmplitude: 0.40,
    },
  },
  paintOrder: {
    overrides: [{ name: "Hand", place: "before", relativeTo: "AnnularBand" }],
  },
  annularBand: { annularBandWidth: 0.14 },
  /** k·RefRadius: stroked arc concentric with RefArc, same sweep. */
  dividorArc: { radiusK: 1.32 },
  /** Bottom-left instrument chrome — each block has independent leftPadding / aboveBottom from B_left / B_bottom. */
  homeMenuTrigger: {
    diameter: 0.18,
    menuLeftPadding: 0,
    menuAboveBottom: 0.45,
    iconBarLength: 0.09,
    iconBarGap: 0.025,
  },
  brandQrSize: 0.2,
  brandQrPlateCornerRx: 0.014,
  brandQrLeftPadding: 0,
  brandQrAboveBottom: .20,
  homeLocationPanel: {
    leftPadding: 0.0,
    aboveBottom: 0,
    width: 0.38,
    height: 0.15,
    cornerRx: 0.014,
    labelFontHeight: 0.034,
    actionFontHeight: 0.045,
    label: "Location",
    shareLabel: "Share",
    changeLabel: "Change",
    separator: " · ",
    actionSeparatorLeading: 0.135,
    actionChangeLeading: 0.168,
    innerPadLeft: 0.018,
    innerPadBottom: 0.022,
    labelAboveActions: 0.028,
  },
  tideMarksDefaults,
} satisfies HomeLayoutBase;