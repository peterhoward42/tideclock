/**
 * Tunable layout for the Home tide diagram (`DiagramGenerationSpec` / diagram-generation).
 * Open this file to adjust geometry; assembly lives in `application/buildDiagramGenerationSpec`.
 */

/** One row in `tideMarks.markers` consumed by diagram-generation. */
export type DiagramTideMarkMarker = {
  readonly time: string;
  readonly heightText: string;
  readonly highOrLow: string;
};

/** Layout constants plus marker rows for the Home tide diagram `spec.tideMarks` object. */
export type HomeDiagramTideMarks = {
  readonly tideHeightLabelRadius: number;
  readonly tideTimeLabelRadius: number;
  readonly tideHeightLabelSize: number;
  readonly tideTimeLabelSize: number;
  readonly tideMarkArrowDivergence: number;
  readonly tideMarkArrowLineLen: number;
  readonly markers: readonly DiagramTideMarkMarker[];
};

/** Static subset of `spec.tideMarks` (geometry only; `markers` added when building the spec). */
export type HomeDiagramTideMarksDefaults = Omit<HomeDiagramTideMarks, 'markers'>;

type HomeTideDiagramLayoutBase = {
  readonly title: 'home-tide-diagram';
  readonly canvas: { readonly width: number; readonly height: number };
  readonly refRadius: number;
  readonly sweepRad: number;
  readonly tickLen: number;
  readonly tickLabelHours: readonly number[];
  readonly tickLabelSize: number;
  readonly tickLabelClearance: number;
  readonly nowPointer: {
    readonly radialLine: { readonly outerRadius: number };
    readonly label: { readonly size: number; readonly normalOffset: number };
    readonly triangle: { readonly subtendedAngleRad: number };
  };
  readonly nextPointer: {
    readonly radialLine: { readonly outerRadius: number };
  };
  readonly waitArc: {
    readonly radius: number;
    readonly arrow: {
      readonly lengthK: number;
      readonly widthK: number;
      readonly insetK: number;
      readonly style: 'filled';
      readonly scaleWithStroke: boolean;
    };
  };
  readonly timeNowLabel: {
    readonly fontHeight: number;
    /** k·RefRadius: date baseline is this far above (+Y) the clock baseline (tick-label-min Y). */
    readonly dateAboveTime: number;
  };
  readonly centreFrame: { readonly frameArcRadius: number };
  /** k·RefRadius; concentric arc inside RefArc, same angular span as RefArc. */
  readonly insideTrackRadius: number;
  readonly timeDelta: {
    /** Three stripes: location name, tide phase line, next-event line (see tide-diagram §TimeDelta). */
    readonly countdownLines: readonly {
      readonly belowOrigin: number;
      readonly fontHeight: number;
    }[];
    /** Baseline and font for **NoMoreTidesToday** when there is no next tide on the civil day. */
    readonly emptyMessage: { readonly belowOrigin: number; readonly fontHeight: number };
    readonly town: string;
    readonly tidePhasePair: 'out-low' | 'in-high';
  };
  readonly annularBand: { readonly annularBandWidth: number };
  readonly tideMarksDefaults: HomeDiagramTideMarksDefaults;
};

/** Static layout/geometry for the Home tide diagram (canonical values live in this object). */
export const homeTideDiagramLayoutBase: HomeTideDiagramLayoutBase = {
  title: 'home-tide-diagram',
  canvas: { width: 420, height: 320 },
  refRadius: 118,
  sweepRad: Math.PI,
  tickLen: 0.02,
  tickLabelHours: [0, 3, 6, 9, 12, 15, 18, 21],
  tickLabelSize: 0.04,
  tickLabelClearance: 0.07,
  nowPointer: {
    radialLine: { outerRadius: 0.68 },
    label: { size: 0.045, normalOffset: 0.02 },
    triangle: { subtendedAngleRad: Math.PI / 5 },
  },
  nextPointer: {
    radialLine: { outerRadius: 0.74 },
  },
  waitArc: {
    radius: 0.68,
    arrow: {
      lengthK: 24,
      widthK: 10,
      insetK: 0,
      style: 'filled',
      scaleWithStroke: true,
    },
  },
  timeNowLabel: { fontHeight: 0.045, dateAboveTime: 0.05 },
  centreFrame: { frameArcRadius: 0.45 },
  insideTrackRadius: 0.74,
  timeDelta: {
    countdownLines: [
      { belowOrigin: 0.15, fontHeight: 0.032 },
      { belowOrigin: 0.235, fontHeight: 0.03 },
      { belowOrigin: 0.32, fontHeight: 0.03 },
    ],
    emptyMessage: { belowOrigin: 0.08, fontHeight: 0.038 },
    town: 'Unset',
    tidePhasePair: 'out-low',
  },
  annularBand: { annularBandWidth: 0.05 },
  tideMarksDefaults: {
    tideHeightLabelRadius: 0.9,
    tideTimeLabelRadius: 0.821,
    tideHeightLabelSize: 0.045,
    tideTimeLabelSize: 0.045,
    tideMarkArrowDivergence: 0.8,
    tideMarkArrowLineLen: 0.045,
  },
};
