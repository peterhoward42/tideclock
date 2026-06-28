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
  layoutBoundsTopMargin: 0.00,
  layoutBoundsBottomMargin: 0.05,
  sweepRad: Math.PI,
  tickLabelTickLen: 0.025,
  tickLabelHours: Array.from({ length: 23 }, (_, i) => i + 1),
  tickLabelSize: 0.04,
  tickLabelClearance: 0.042,
  brhcBundle: {
    fontHeight: 0.045,
    dateAboveTime: 0.02,
  },
  locationPlacement: {
    fontHeight: 0.060,
    maxSegmentLength: 21,
    lineGap: 0.07,
    tidesForGap: 0.10,
    ranges: [
      {
        from: "18:00:00",
        to: "24:00:00",
        justification: "centre",
        belowOrigin: 0.50,
        offsetRight: 0,
      },
      {
        from: "00:00:00",
        to: "04:00:00",
        justification: "centre",
        belowOrigin: 0.50,
        offsetRight: 0,
      },
      {
        from: "04:00:00",
        to: "12:00:00",
        justification: "centre",
        belowOrigin: 0.3,
        offsetRight: 0.5,
      },
      {
        from: "12:00:00",
        to: "18:00:00",
        justification: "centre",
        belowOrigin: .30,
        offsetRight: -0.5,
      },
    ],
  },
  hand: {
    bossCircleRadius: 0.15,
    /** k·RefRadius: arm outer end is this far inside the RefArc (0 = flush with RefArc). */
    armRefArcGap: 0.040,
    armTimeLabelFontHeight: 0.045,
  },
  paintOrder: {
    overrides: [{ name: "Hand", place: "before", relativeTo: "AnnularBand" }],
  },
  annularBand: { annularBandWidth: 0.14 },
  /** k·RefRadius: stroked arc concentric with RefArc, same sweep. */
  dividorArc: { radiusK: 1.32 },
  /** Instrument chrome — each block has independent offsets from layout bounds (see tide-diagram spec). */
  homeMenuTrigger: {
    diameter: 0.18,
    menuRightPadding: 0,
    menuAboveBottom: 0.20,
    iconBarLength: 0.09,
    iconBarGap: 0.025,
  },
  homeInstrumentIcons: {
    offsetDownFromTop: 0.0,
    hitSize: 0.14,
    iconHalfSize: 0.032,
    fullScreen: {
      offsetInFromSideEdge: .6,
      rootSegmentLength: 1 / 3,
      tipStrokeReach: 1 / 3,
    },
    keepAwake: {
      offsetInFromSideEdge: 0.4,
      zzz: {
        label: "Zzz",
        fontHeight: .046,
      },
    },
  },
  brandQrSize: 0.2,
  brandQrPlateCornerRx: 0.014,
  brandQrLeftPadding: 0,
  brandQrAboveBottom: .20,
  homeLocationPanel: {
    leftPadding: 0.0,
    aboveBottom: 0,
    width: 0.40,
    height: 0.16,
    cornerRx: 0.014,
    labelFontHeight: 0.045,
    actionFontHeight: 0.045,
    label: "Location",
    shareLabel: "Share",
    changeLabel: "Change",
    gapBeforeSeparator: 0.02,
    gapAfterSeparator: 0.02,
    innerPadLeft: 0.018,
    innerPadBottom: 0.022,
    labelAboveActions: 0.028,
  },
  tideMarksDefaults,
} satisfies HomeLayoutBase;