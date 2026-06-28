import { describe, expect, it } from 'vitest';
import {
  buildDiagram,
  type DiagramSpec,
  type TideDiagramDocument,
} from './diagramCollaborator';
import { deriveNextTideSemantics } from './nextTideSemantics';

/**
 * These tests pin the seam between application-layer {@link deriveNextTideSemantics} and
 * diagram-generation {@link buildDiagram}: when `spec.semantic.nextTide` matches the derived value,
 * layout output is identical to letting layout scan `tideMarks` itself. The fixture type is
 * stricter than {@link DiagramSpec}; it is cast only at the diagram-generation boundary.
 */

type SemanticInjectionTideMark = {
  readonly time: string;
  readonly heightText: string;
  readonly highOrLow: string;
};

/**
 * Layout + marker data for parity checks; structurally satisfies `deriveNextTideSemantics` input
 * (`timeNow` + `tideMarks.markers`).
 */
type SemanticInjectionDiagramSpec = {
  readonly title: string;
  readonly refRadius: number;
  readonly sweepRad: number;
  readonly tickLabelTickLen: number;
  readonly tickLabelHours: readonly number[];
  readonly tickLabelSize: number;
  readonly tickLabelClearance: number;
  readonly timeNow: string;
  readonly brhcDatePrefix: string;
  readonly locationName: string;
  readonly locationPlacement: {
    readonly fontHeight: number;
    readonly maxSegmentLength: number;
    readonly lineGap: number;
    readonly ranges: readonly {
      readonly from: string;
      readonly to: string;
      readonly justification: 'left' | 'right' | 'centre';
      readonly belowOrigin: number;
      readonly offsetRight: number;
    }[];
  };
  readonly tideMarks: {
    readonly tideLabelRadius: number;
    readonly tideHeightLabelSize: number;
    readonly tideMarkArrowDivergence: number;
    readonly tideMarkArrowLineLen: number;
    readonly markers: readonly SemanticInjectionTideMark[];
  };
  readonly brhcBundle: {
    readonly fontHeight: number;
    readonly dateAboveTime: number;
  };
  readonly brandQrLeftPadding: number;
  readonly brandQrAboveBottom: number;
  readonly brandQrSize: number;
  readonly brandQrPlateCornerRx: number;
  readonly annularBand: { readonly annularBandWidth: number };
  readonly dividorArc: { readonly radiusK: number };
  readonly hand: {
    readonly bossCircleRadius: number;
    readonly armRefArcGap: number;
    readonly armTimeLabelFontHeight: number;
  };
  readonly homeMenuTrigger: {
    readonly diameter: number;
    readonly menuRightPadding: number;
    readonly menuAboveBottom: number;
    readonly iconBarLength: number;
    readonly iconBarGap: number;
  };
  readonly homeInstrumentIcons: {
    readonly iconHalfSize: number;
    readonly fullScreen: {
      readonly offsetFromLeft: number;
      readonly aboveBottom: number;
      readonly boxPad: number;
      readonly rootSegmentLength: number;
      readonly tipStrokeReach: number;
    };
    readonly keepAwake: {
      readonly offsetFromLeft: number;
      readonly aboveBottom: number;
      readonly label: string;
      readonly fontHeight: number;
      readonly checkboxSize: number;
      readonly gapBeforeCheckbox: number;
    };
  };
  readonly homeLocationPanel: {
    readonly leftPadding: number;
    readonly aboveBottom: number;
    readonly width: number;
    readonly height: number;
    readonly cornerRx: number;
    readonly labelFontHeight: number;
    readonly actionFontHeight: number;
    readonly label: string;
    readonly shareLabel: string;
    readonly changeLabel: string;
    readonly gapBeforeSeparator: number;
    readonly gapAfterSeparator: number;
    readonly innerPadLeft: number;
    readonly innerPadBottom: number;
    readonly labelAboveActions: number;
  };
  readonly shareUrl: string;
};

/** `buildDiagram` is implemented in `.mjs`; align returns with {@link TideDiagramDocument}. */
function buildDiagramFromSpec(spec: DiagramSpec): TideDiagramDocument {
  return buildDiagram(spec) as TideDiagramDocument;
}

/** Minimal spec with tide markers and required geometry. */
function sampleTideDiagramSpec(): SemanticInjectionDiagramSpec {
  return {
    title: 'semantic-injection',
    refRadius: 118,
    sweepRad: 2.75,
    tickLabelTickLen: 0.03,
    tickLabelHours: Array.from({ length: 23 }, (_, i) => i + 1),
    tickLabelSize: 0.04,
    tickLabelClearance: 0.07,
    timeNow: '19:20:03',
    brhcDatePrefix: 'Mon 23 Mar',
    locationName: 'Lymington',
    tideMarks: {
      tideLabelRadius: 0.84,
      tideHeightLabelSize: 0.046,
      tideMarkArrowDivergence: 1.0,
      tideMarkArrowLineLen: 0.05,
      markers: [
        { time: '04:15:00', heightText: '0.94 m', highOrLow: 'Low' },
        { time: '10:45:00', heightText: '4.70 m', highOrLow: 'High' },
        { time: '16:59:24', heightText: '0.89 m', highOrLow: 'Low' },
        { time: '23:06:00', heightText: '4.80 m', highOrLow: 'High' },
      ],
    },
    brhcBundle: {
      fontHeight: 0.05,
      dateAboveTime: 0.05,
    },
    locationPlacement: {
      fontHeight: 0.045,
      maxSegmentLength: 21,
      lineGap: 0.05,
      tidesForGap: 0.05,
      ranges: [
        {
          from: '00:00:00',
          to: '08:00:00',
          justification: 'left',
          belowOrigin: 0.06,
          offsetRight: -0.10,
        },
        {
          from: '08:00:00',
          to: '16:00:00',
          justification: 'centre',
          belowOrigin: 0.08,
          offsetRight: 0,
        },
        {
          from: '16:00:00',
          to: '24:00:00',
          justification: 'right',
          belowOrigin: 0.06,
          offsetRight: 0.10,
        },
      ],
    },
    brandQrLeftPadding: 0,
    brandQrAboveBottom: 0,
    brandQrSize: 0.11,
    brandQrPlateCornerRx: 0.01,
    annularBand: { annularBandWidth: 0.05 },
    dividorArc: { radiusK: 0.8653 },
    hand: {
      bossCircleRadius: 0.08,
      armRefArcGap: 0.01,
      armTimeLabelFontHeight: 0.0288,
    },
    homeMenuTrigger: {
      diameter: 0.11,
      menuRightPadding: 0,
      menuAboveBottom: 0.068,
      iconBarLength: 0.048,
      iconBarGap: 0.015,
    },
    homeInstrumentIcons: {
      iconHalfSize: 0.028,
      fullScreen: {
        offsetFromLeft: 0,
        aboveBottom: 0,
        boxPad: 0.01,
        rootSegmentLength: 1 / 3,
        tipStrokeReach: 1 / 3,
      },
      keepAwake: {
        offsetFromLeft: 0.11,
        aboveBottom: 0,
        label: "Keep awake",
        fontHeight: 0.045,
        checkboxSize: 0.04,
        gapBeforeCheckbox: 0.01,
      },
    },
    homeLocationPanel: {
      leftPadding: 0.12,
      aboveBottom: 0,
      width: 0.34,
      height: 0.12,
      cornerRx: 0.01,
      labelFontHeight: 0.03,
      actionFontHeight: 0.04,
      label: 'Location',
      shareLabel: 'Share',
      changeLabel: 'Change',
      gapBeforeSeparator: 0.01,
      gapAfterSeparator: 0.01,
      innerPadLeft: 0.015,
      innerPadBottom: 0.018,
      labelAboveActions: 0.024,
    },
    shareUrl: 'https://thetidedial.page/?place=Lymington&county=Hampshire',
  };
}

describe('spec.semantic.nextTide injection', () => {
  it('matches buildDiagram output when derived via deriveNextTideSemantics', () => {
    const spec = sampleTideDiagramSpec();
    const baseline = buildDiagramFromSpec(spec as DiagramSpec);
    const { nextTide } = deriveNextTideSemantics(spec);
    expect(nextTide).not.toBeNull();
    const withSemantic = buildDiagramFromSpec({
      ...spec,
      semantic: { nextTide },
    } as DiagramSpec);
    expect(withSemantic).toEqual(baseline);
  });

  it('matches when semantic.nextTide is null (no qualifying marker)', () => {
    const spec = { ...sampleTideDiagramSpec(), timeNow: '23:59:00' };
    const baseline = buildDiagramFromSpec(spec as DiagramSpec);
    const { nextTide } = deriveNextTideSemantics(spec);
    expect(nextTide).toBeNull();
    const withSemantic = buildDiagramFromSpec({
      ...spec,
      semantic: { nextTide: null },
    } as DiagramSpec);
    expect(withSemantic).toEqual(baseline);
  });

  it('after last tide still renders BRHCBundle text and LocationLabel', () => {
    const spec = { ...sampleTideDiagramSpec(), timeNow: '23:59:00' };
    const diagram = buildDiagramFromSpec(spec as DiagramSpec);
    expect(diagram.brhcDate.content).toBe('Mon 23 Mar');
    expect(diagram.locationLabel[0].content).toBe('Tides for:');
    expect(diagram.locationLabel[1].content).toBe('Lymington');
    expect(diagram.hand.armTimeReadout.timeContent).toBe('23:59');
    expect(diagram.hand.armTimeReadout.nowTagContent).toBe('time now');
  });

  it('shows no-more-tides MainLabel copy when there is no next marker', () => {
    const spec = { ...sampleTideDiagramSpec(), timeNow: '23:59:00' };
    const diagram = buildDiagramFromSpec(spec as DiagramSpec);
    expect(diagram.mainLabel.content).toBe('Next tide extreme tomorrow');
  });

  it('shows atypical MainLabel copy when semantic.atypicalTideSummary is true', () => {
    const spec = sampleTideDiagramSpec();
    const diagram = buildDiagramFromSpec({
      ...spec,
      semantic: { atypicalTideSummary: true },
    } as DiagramSpec);
    expect(diagram.mainLabel.content).toBe('Tricky tides today');
  });

  it('throws when spec omits annularBand', () => {
    const { annularBand: _omit, ...rest } = sampleTideDiagramSpec();
    expect(() => buildDiagramFromSpec(rest as DiagramSpec)).toThrow(
      /spec\.annularBand/,
    );
  });

  it('throws when tickLabelHours is empty', () => {
    const spec = { ...sampleTideDiagramSpec(), tickLabelHours: [] };
    expect(() => buildDiagramFromSpec(spec as DiagramSpec)).toThrow(
      /spec\.tickLabelHours must list at least one hour/,
    );
  });

  it('golden snapshot: diagram with semantic.nextTide matches committed output', () => {
    const spec = sampleTideDiagramSpec();
    const { nextTide } = deriveNextTideSemantics(spec);
    expect(nextTide).not.toBeNull();
    const diagram = buildDiagramFromSpec({
      ...spec,
      semantic: { nextTide },
    } as DiagramSpec);
    expect(diagram).toMatchSnapshot();
  });
});
