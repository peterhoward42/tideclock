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

/**
 * Which civil half-day presentation branch to use for layout tied to “before noon” vs “after noon”.
 * Does not change `timeNow` or hand angle; see tide-diagram spec §Global civil half-day layout.
 */
export type CivilHalfDayLayoutMode = "auto" | "beforeNoon" | "afterNoon";

export type HomeTideDiagramLayoutBase = {
  readonly title: "home-tide-diagram";
  readonly refRadius: number;
  /**
   * When `"auto"`, branches follow **t_now** (`t_now ≤ 12` vs `> 12`). Otherwise forces that branch
   * for all spec-defined half-day presentation (e.g. **Hand.TimeReadout** offset and baseline rotation).
   */
  readonly civilHalfDayLayout: CivilHalfDayLayoutMode;
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
  readonly brhcBundle: {
    readonly fontHeight: number;
    /** k·RefRadius: date baseline is this far above (+Y) the clock baseline (tick-label-min Y). */
    readonly dateAboveTime: number;
  };
  /** k·RefRadius: **Brand** uniform font height (BrandTitle + BrandURL; see tide-diagram spec). */
  readonly brandFontHeight: number;
  /** k·RefRadius: **Brand** alphabetic baseline offset upward from **B_bottom** (see tide-diagram spec §Brand). */
  readonly brandAboveBottom: number;
  readonly annularBand: { readonly annularBandWidth: number };
  /** Stroked arc concentric with RefArc, same sweep; radius is **radiusK·refRadius** (see tide-diagram spec §Sizing). */
  readonly dividorArc: { readonly radiusK: number };
  readonly hand: {
    readonly bossCircleRadius: number;
    /** k·RefRadius inset from RefArc; arm outer radius is RefRadius minus this. */
    readonly armRefArcGap: number;
    /** k·RefRadius: **Hand** arm time readout font height (independent of tick-label sizing). */
    readonly armTimeLabelFontHeight: number;
    /** k·RefRadius: centered **Hand.BossLabel** font height. */
    readonly bossLabelFontHeight: number;
    /**
     * Tunables for subtle **Hand.Boss** pulse animation.
     * Kept in diagram layout config because these values affect scene geometry and bounds.
     */
    readonly livePulse: {
      /** Wall-clock seconds for one full pulse cycle. */
      readonly periodSeconds: number;
      /** Fractional radius deviation from the nominal boss radius. */
      readonly radiusRelativeAmplitude: number;
      /** Fractional opacity deviation from base style opacity. */
      readonly opacityRelativeAmplitude: number;
    };
  };
  readonly paintOrder: {
    readonly overrides: readonly {
      readonly name: string;
      readonly place: "before" | "after";
      readonly relativeTo: string;
    }[];
  };
  readonly homeMenuTrigger: {
    /** k·RefRadius: circular control diameter. */
    readonly diameter: number;
    /** k·RefRadius: inset from **B_left** to the leading (left) edge of the circular control. */
    readonly menuLeftPadding: number;
    /** k·RefRadius: distance from **B_bottom** up to the bottom of the circular control (see tide-diagram spec §HomeMenuTrigger). */
    readonly menuAboveBottom: number;
    /** k·RefRadius: full width of each hamburger bar. */
    readonly iconBarLength: number;
    /** k·RefRadius: distance between adjacent bar centerlines (middle bar is on trigger centre). */
    readonly iconBarGap: number;
  };
  readonly tideMarksDefaults: HomeDiagramTideMarksDefaults;
};
