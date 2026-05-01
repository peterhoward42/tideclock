import { describe, expect, it } from 'vitest';
import {
  buildDiagram,
  type DiagramGenerationSpec,
  type TideDiagramDocument,
} from './diagramGenerationCollaborator';
import { deriveNextTideSemantics } from './nextTideSemantics';

/**
 * These tests pin the seam between application-layer {@link deriveNextTideSemantics} and
 * diagram-generation {@link buildDiagram}: when `spec.semantic.nextTide` matches the derived value,
 * layout output is identical to letting layout scan `tideMarks` itself. The fixture type is
 * stricter than {@link DiagramGenerationSpec}; it is cast only at the diagram-generation boundary.
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
  readonly canvas: { readonly width: number; readonly height: number };
  readonly refRadius: number;
  readonly sweepRad: number;
  readonly tickLabelTickLen: number;
  readonly tickLabelHours: readonly number[];
  readonly tickLabelSize: number;
  readonly tickLabelClearance: number;
  readonly timeNow: string;
  readonly timeNowDatePrefix: string;
  readonly timeNowLocation: string;
  readonly tideMarks: {
    readonly tideLabelRadius: number;
    readonly tideHeightLabelSize: number;
    readonly tideMarkArrowDivergence: number;
    readonly tideMarkArrowLineLen: number;
    readonly markers: readonly SemanticInjectionTideMark[];
  };
  readonly timeNowLabel: {
    readonly fontHeight: number;
    readonly dateAboveTime: number;
  };
  readonly annularBand: { readonly annularBandWidth: number };
  readonly hand: {
    readonly bossCircleRadius: number;
    readonly armRefArcGap: number;
  };
  readonly homeMenuTrigger: {
    readonly width: number;
    readonly height: number;
    readonly gapAboveMainLabel: number;
    readonly cornerRadius: number;
    readonly labelSize: number;
    readonly label: string;
  };
};

/** `buildDiagram` is implemented in `.mjs`; align returns with {@link TideDiagramDocument}. */
function buildDiagramFromSpec(spec: DiagramGenerationSpec): TideDiagramDocument {
  return buildDiagram(spec) as TideDiagramDocument;
}

/** Minimal spec with tide markers and required geometry. */
function sampleTideDiagramSpec(): SemanticInjectionDiagramSpec {
  return {
    title: 'semantic-injection',
    canvas: { width: 420, height: 320 },
    refRadius: 118,
    sweepRad: 2.75,
    tickLabelTickLen: 0.03,
    tickLabelHours: Array.from({ length: 23 }, (_, i) => i + 1),
    tickLabelSize: 0.04,
    tickLabelClearance: 0.07,
    timeNow: '19:20:03',
    timeNowDatePrefix: 'Mon 23 Mar',
    timeNowLocation: 'Lymington',
    tideMarks: {
      tideLabelRadius: 0.84,
      tideHeightLabelSize: 0.046,
      tideMarkArrowDivergence: 1.0,
      tideMarkArrowLineLen: 0.05,
      markers: [
        { time: '04:15:00', heightText: '0.94 m', highOrLow: 'Low' },
        { time: '10:45:00', heightText: '4.7 m', highOrLow: 'High' },
        { time: '16:59:24', heightText: '0.89 m', highOrLow: 'Low' },
        { time: '23:06:00', heightText: '4.8 m', highOrLow: 'High' },
      ],
    },
    timeNowLabel: { fontHeight: 0.05, dateAboveTime: 0.05 },
    annularBand: { annularBandWidth: 0.05 },
    hand: {
      bossCircleRadius: 0.08,
      armRefArcGap: 0.01,
    },
    homeMenuTrigger: {
      width: 0.2,
      height: 0.13,
      gapAboveMainLabel: 0.0135,
      cornerRadius: 0.038,
      labelSize: 0.042,
      label: 'Menu',
    },
  };
}

describe('spec.semantic.nextTide injection', () => {
  it('matches buildDiagram output when derived via deriveNextTideSemantics', () => {
    const spec = sampleTideDiagramSpec();
    const baseline = buildDiagramFromSpec(spec as DiagramGenerationSpec);
    const { nextTide } = deriveNextTideSemantics(spec);
    expect(nextTide).not.toBeNull();
    const withSemantic = buildDiagramFromSpec({
      ...spec,
      semantic: { nextTide },
    } as DiagramGenerationSpec);
    expect(withSemantic).toEqual(baseline);
  });

  it('matches when semantic.nextTide is null (no qualifying marker)', () => {
    const spec = { ...sampleTideDiagramSpec(), timeNow: '23:59:00' };
    const baseline = buildDiagramFromSpec(spec as DiagramGenerationSpec);
    const { nextTide } = deriveNextTideSemantics(spec);
    expect(nextTide).toBeNull();
    const withSemantic = buildDiagramFromSpec({
      ...spec,
      semantic: { nextTide: null },
    } as DiagramGenerationSpec);
    expect(withSemantic).toEqual(baseline);
  });

  it('after last tide still renders the time-now readout', () => {
    const spec = { ...sampleTideDiagramSpec(), timeNow: '23:59:00' };
    const diagram = buildDiagramFromSpec(spec as DiagramGenerationSpec);
    expect(diagram.timeNowDate.content).toBe('Mon 23 Mar');
    expect(diagram.timeNowLocation.content).toBe('Lymington');
    expect(diagram.timeNowClock.hhmm.content).toBe('23:59');
    expect(diagram.timeNowClock.secondsColon.content).toBe(':');
    expect(diagram.timeNowClock.seconds.content).toBe('00');
  });

  it('shows no-more-tides MainLabel copy when there is no next marker', () => {
    const spec = { ...sampleTideDiagramSpec(), timeNow: '23:59:00' };
    const diagram = buildDiagramFromSpec(spec as DiagramGenerationSpec);
    expect(diagram.mainLabel.content).toBe('Next tide extreme tomorrow');
  });

  it('shows atypical MainLabel copy when semantic.atypicalTideSummary is true', () => {
    const spec = sampleTideDiagramSpec();
    const diagram = buildDiagramFromSpec({
      ...spec,
      semantic: { atypicalTideSummary: true },
    } as DiagramGenerationSpec);
    expect(diagram.mainLabel.content).toBe('Tricky tides today');
  });

  it('throws when spec omits annularBand', () => {
    const { annularBand: _omit, ...rest } = sampleTideDiagramSpec();
    expect(() => buildDiagramFromSpec(rest as DiagramGenerationSpec)).toThrow(
      /spec\.annularBand/,
    );
  });

  it('throws when tickLabelHours is empty (clock baseline needs tick labels)', () => {
    const spec = { ...sampleTideDiagramSpec(), tickLabelHours: [] };
    expect(() => buildDiagramFromSpec(spec as DiagramGenerationSpec)).toThrow(
      /tick label anchors/,
    );
  });

  it('golden snapshot: diagram with semantic.nextTide matches committed output', () => {
    const spec = sampleTideDiagramSpec();
    const { nextTide } = deriveNextTideSemantics(spec);
    expect(nextTide).not.toBeNull();
    const diagram = buildDiagramFromSpec({
      ...spec,
      semantic: { nextTide },
    } as DiagramGenerationSpec);
    expect(diagram).toMatchSnapshot();
  });
});
