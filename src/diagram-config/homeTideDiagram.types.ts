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
export type HomeDiagramTideMarksDefaults = Omit<HomeDiagramTideMarks, "markers">;

export type HomeTideDiagramLayoutBase = {
  readonly title: "home-tide-diagram";
  readonly canvas: { readonly width: number; readonly height: number };
  readonly refRadius: number;
  readonly sweepRad: number;
  readonly tickLen: number;
  readonly tickLabelHours: readonly number[];
  readonly tickLabelSize: number;
  readonly tickLabelClearance: number;
  readonly waitArc: {
    readonly radius: number;
    readonly arrow: {
      readonly lengthK: number;
      readonly widthK: number;
      readonly insetK: number;
      readonly style: "filled";
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
    /** Four stripes: location, phase, next-event interval, next-event clock (`at HH:MM`) (see tide-diagram §TimeDelta). */
    readonly countdownLines: readonly {
      readonly belowOrigin: number;
      readonly fontHeight: number;
    }[];
    /**
     * Required; `fontHeight` sizes the third centre line ("... tomorrow") when there is no next tide
     * today. `belowOrigin` is validated but layout uses `countdownLines[2].belowOrigin` for that baseline.
     */
    readonly emptyMessage: { readonly belowOrigin: number; readonly fontHeight: number };
    readonly town: string;
    readonly tidePhasePair: "out-low" | "in-high";
    /**
     * When true, countdown centre copy uses the atypical-pattern lines (see docs/planning/atypical-tide-story.md);
     * next/WaitArc behaviour unchanged. When false, typical phase + next-interval copy.
     */
    readonly atypicalTideSummary: boolean;
  };
  readonly annularBand: { readonly annularBandWidth: number };
  readonly homeMenuTrigger: {
    /** k·RefRadius: full width along +X. */
    readonly width: number;
    /** k·RefRadius: full height along +Y. */
    readonly height: number;
    /** k·RefRadius: SVG rx/ry; must be ≤ min(width,height)/2. */
    readonly cornerRadius: number;
    readonly labelSize: number;
    readonly label: "Menu";
  };
  readonly tideMarksDefaults: HomeDiagramTideMarksDefaults;
};
