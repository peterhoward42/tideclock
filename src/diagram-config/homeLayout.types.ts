/** One row in `tideMarks.markers` consumed by diagram-generation. */
export type TideMarkMarker = {
  readonly time: string;
  readonly heightText: string;
  readonly highOrLow: string;
};

/** Layout constants plus marker rows for the Home tide diagram `spec.tideMarks` object. */
export type HomeTideMarks = {
  readonly tideLabelRadius: number;
  readonly tideHeightLabelSize: number;
  readonly tideMarkArrowDivergence: number;
  readonly tideMarkArrowLineLen: number;
  /**
   * k·RefRadius: signed radial offset added to AnnularBand outer radius for TimePointer tip.
   * Negative insets (clearance from outer edge); positive extends past the outer boundary.
   */
  readonly tideMarkOuterBandGap: number;
  readonly markers: readonly TideMarkMarker[];
};

/** Static subset of `spec.tideMarks` (geometry only; `markers` added when building the spec). */
export type HomeTideMarksDefaults = Omit<HomeTideMarks, "markers">;

/**
 * Which civil half-day presentation branch to use for layout tied to “before noon” vs “after noon”.
 * Does not change `timeNow` or hand angle; see tide-diagram spec §Global civil half-day layout.
 */
export type CivilHalfDayLayoutMode = "auto" | "beforeNoon" | "afterNoon";

export type LocationPlacementRange = {
  readonly from: string;
  readonly to: string;
  readonly justification: "left" | "right" | "centre";
  readonly belowOrigin: number;
  readonly offsetRight: number;
};

export type LocationPlacement = {
  readonly fontHeight: number;
  /** Maximum character count per **LocationLabel** line (word-wrap). */
  readonly maxSegmentLength: number;
  /** k·RefRadius: downward baseline step between consecutive place-name lines. */
  readonly lineGap: number;
  /** k·RefRadius: downward baseline gap from **LocationLabel.TidesFor** to **LocationLabel.Line0**. */
  readonly tidesForGap: number;
  readonly ranges: readonly LocationPlacementRange[];
};

export type HomeLayoutBase = {
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
  /** k·RefRadius: after diagram-wide extent — extends B_top upward. */
  readonly layoutBoundsTopMargin: number;
  /** k·RefRadius: pass 3 global layout bounds — extends B_bottom downward. */
  readonly layoutBoundsBottomMargin: number;
  /**
   * Bottom-right text stack (**BRHCBundle** rows).
   * Each `*Above*` value is k·RefRadius gap upward from the row below (same convention throughout).
   * Stack bottom → top: **MainLabel** → **BRHCDate**.
   */
  readonly brhcBundle: {
    /** k·RefRadius: **FontHeight** for **MainLabel** and **BRHCDate**. */
    readonly fontHeight: number;
    /** k·RefRadius: gap above **MainLabel** baseline to **BRHCDate** baseline. */
    readonly dateAboveTime: number;
  };
  /**
   * Dial-interior **LocationLabel** preset anchors keyed by **t_now** (see tide-diagram spec §LocationLabel).
   */
  readonly locationPlacement: LocationPlacement;
  /** k·RefRadius: **BrandQR** square side. */
  readonly brandQrSize: number;
  /** k·RefRadius: **BrandQRPlate** corner radius. */
  readonly brandQrPlateCornerRx: number;
  /** k·RefRadius: inset from **B_left** to **BrandQR** leading edge. */
  readonly brandQrLeftPadding: number;
  /** k·RefRadius: inset from **B_bottom** up to **BrandQR** bottom edge. */
  readonly brandQrAboveBottom: number;
  readonly annularBand: { readonly annularBandWidth: number };
  /** Stroked arc concentric with RefArc, same sweep; radius is **radiusK·refRadius** (see tide-diagram spec §Sizing). */
  readonly dividorArc: { readonly radiusK: number };
  readonly hand: {
    readonly bossCircleRadius: number;
    /** k·RefRadius inset from RefArc; arm outer radius is RefRadius minus this. */
    readonly armRefArcGap: number;
    /** k·RefRadius: **Hand** arm time readout font height (independent of tick-label sizing). */
    readonly armTimeLabelFontHeight: number;
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
    /** k·RefRadius: inset from **B_right** to the trailing (right) edge of the circular control. */
    readonly menuRightPadding: number;
    /** k·RefRadius: distance from **B_bottom** up to the bottom of the circular control (see tide-diagram spec §HomeMenuTrigger). */
    readonly menuAboveBottom: number;
    /** k·RefRadius: full width of each hamburger bar. */
    readonly iconBarLength: number;
    /** k·RefRadius: distance between adjacent bar centerlines (middle bar is on trigger centre). */
    readonly iconBarGap: number;
  };
  /**
   * Bottom-left **Location** panel: plate + heading + **Share** / **Change** actions.
   * Positioned independently via **leftPadding** / **aboveBottom** from **B_left** / **B_bottom**.
   */
  readonly homeLocationPanel: {
    /** k·RefRadius: inset from **B_left** to panel leading edge. */
    readonly leftPadding: number;
    /** k·RefRadius: inset from **B_bottom** up to panel bottom edge. */
    readonly aboveBottom: number;
    /** k·RefRadius: panel width. */
    readonly width: number;
    /** k·RefRadius: panel height. */
    readonly height: number;
    /** k·RefRadius: **HomeLocationPanelPlate** corner radius. */
    readonly cornerRx: number;
    /** k·RefRadius: **Location** heading font height. */
    readonly labelFontHeight: number;
    /** k·RefRadius: **Share** / **Change** font height. */
    readonly actionFontHeight: number;
    /** Heading copy, e.g. `Location`. */
    readonly label: string;
    /** Share action copy. */
    readonly shareLabel: string;
    /** Change-location action copy. */
    readonly changeLabel: string;
    /** k·RefRadius: horizontal gap after **Change** trailing edge before the middle dot. */
    readonly gapBeforeSeparator: number;
    /** k·RefRadius: horizontal gap after the middle dot before **Share** leading edge. */
    readonly gapAfterSeparator: number;
    /** k·RefRadius: inset from panel leading edge to text. */
    readonly innerPadLeft: number;
    /** k·RefRadius: inset from **B_bottom** to action em-box bottom. */
    readonly innerPadBottom: number;
    /** k·RefRadius: gap from action baseline up to heading baseline. */
    readonly labelAboveActions: number;
  };
  /**
   * Top instrument toggles (**FullScreenIcon**, **KeepAwakeIcon**); see tide-diagram spec.
   */
  readonly homeInstrumentIcons: {
    /** k·RefRadius: shared square hit-frame side length. */
    readonly hitSize: number;
    /** k·RefRadius: half-width of the glyph square inside the hit frame. */
    readonly iconHalfSize: number;
    readonly fullScreen: {
      /** k·RefRadius: offset from **B_left** to hit-frame leading edge. */
      readonly offsetFromLeft: number;
      /** k·RefRadius: offset from **B_bottom** to hit-frame bottom edge. */
      readonly aboveBottom: number;
      /** Dimensionless × |leading diagonal|; see tide-diagram spec §FullScreenIcon glyph. */
      readonly rootSegmentLength: number;
      /** Dimensionless × glyph square edge; see tide-diagram spec §FullScreenIcon glyph. */
      readonly tipStrokeReach: number;
    };
    readonly keepAwake: {
      /** k·RefRadius: offset from **B_left** to hit-frame leading edge. */
      readonly offsetFromLeft: number;
      /** k·RefRadius: offset from **B_bottom** to hit-frame bottom edge. */
      readonly aboveBottom: number;
      /** Sleep-label (**Zzz**) glyph tuning; see tide-diagram spec §KeepAwakeIcon glyph. */
      readonly zzz: {
        /** Label string (e.g. `"Zzz"`). */
        readonly label: string;
        /** k·RefRadius: uniform label **FontHeight** (§Sizing). */
        readonly fontHeight: number;
      };
    };
  };
  readonly tideMarksDefaults: HomeTideMarksDefaults;
};
