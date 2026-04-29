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
  tickLen: 0.02,
  tickLabelHours: [0, 3, 6, 9, 12, 15, 18, 21],
  tickLabelSize: 0.04,
  tickLabelClearance: 0.07,
  timeNowLabel: { fontHeight: 0.045, dateAboveTime: 0.02 },
  insideTrackRadius: 0.74,
  mainLabelRadius: 0.59,
  mainLabelTimeOffsetHours: 1.2,
  hand: {
    bossCircleRadius: 0.08,
    smallCircleRadius: 0.012,
    pointerPipScale: 2.5,
    pointerTipInset: 0.3,
  },
  paintOrder: {
    overrides: [{ name: "Hand", place: "before", relativeTo: "AnnularBand" }],
  },
  annularBand: { annularBandWidth: 0.05 },
  homeMenuTrigger: {
    width: 0.2,
    height: 0.13,
    cornerRadius: 0.038,
    labelSize: 0.042,
    label: "Menu",
  },
  tideMarksDefaults: {
    tideHeightLabelRadius: 0.9,
    tideTimeLabelRadius: 0.821,
    tideHeightLabelSize: 0.045,
    tideTimeLabelSize: 0.045,
    tideMarkArrowDivergence: 0.8,
    tideMarkArrowLineLen: 0.045,
  },
} satisfies HomeTideDiagramLayoutBase;
