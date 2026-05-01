/** One row in `tideMarks.markers` consumed by diagram-generation. */
export type DiagramTideMarkMarker = {
  readonly time: string;
  readonly heightText: string;
  readonly highOrLow: string;
};

/** Layout constants plus marker rows for the Home tide diagram `spec.tideMarks` object. */
export type HomeDiagramTideMarks = {
  readonly tideLabelRadius: number;
  readonly tideHeightLabelSize: number;
  readonly tideMarkArrowDivergence: number;
  readonly tideMarkArrowLineLen: number;
  /**
   * k·RefRadius: signed radial offset added to AnnularBand outer radius for TimePointer tip.
   * Negative insets (clearance from outer edge); positive extends past the outer boundary.
   */
  readonly tideMarkOuterBandGap: number;
  readonly markers: readonly DiagramTideMarkMarker[];
};

/** Static subset of `spec.tideMarks` (geometry only; `markers` added when building the spec). */
export type HomeDiagramTideMarksDefaults = Omit<HomeDiagramTideMarks, "markers">;

export type HomeTideDiagramLayoutBase = {
  readonly title: "home-tide-diagram";
  readonly canvas: { readonly width: number; readonly height: number };
  readonly refRadius: number;
  readonly sweepRad: number;
  /** k·RefRadius for ticks at hours that also emit TickLabel; must be shorter than annularBandWidth. */
  readonly tickLabelTickLen: number;
  readonly tickLabelHours: readonly number[];
  readonly tickLabelSize: number;
  readonly tickLabelClearance: number;
  /**
   * Optional k·RefRadius: pass 3 global layout bounds — extends B_bottom downward; omit for 0.
   */
  readonly layoutBoundsBottomMargin?: number;
  readonly timeNowLabel: {
    readonly fontHeight: number;
    /** k·RefRadius: date baseline is this far above (+Y) the clock baseline (tick-label-min Y). */
    readonly dateAboveTime: number;
  };
  readonly annularBand: { readonly annularBandWidth: number };
  readonly hand: {
    readonly bossCircleRadius: number;
    /** k·RefRadius inset from RefArc; arm outer radius is RefRadius minus this. */
    readonly armRefArcGap: number;
  };
  readonly paintOrder: {
    readonly overrides: readonly {
      readonly name: string;
      readonly place: "before" | "after";
      readonly relativeTo: string;
    }[];
  };
  readonly homeMenuTrigger: {
    /** k·RefRadius: full width along +X. */
    readonly width: number;
    /** k·RefRadius: full height along +Y. */
    readonly height: number;
    /** k·RefRadius: vertical gap from MainLabel top to trigger bottom. */
    readonly gapAboveMainLabel: number;
    /** k·RefRadius: SVG rx/ry; must be ≤ min(width,height)/2. */
    readonly cornerRadius: number;
    readonly labelSize: number;
    readonly label: "Menu";
  };
  readonly tideMarksDefaults: HomeDiagramTideMarksDefaults;
};
