import { describe, expect, it } from 'vitest';
import { buildDiagram } from '../diagram-generation/index.mjs';
import { TIME_DELTA_EMPTY_MESSAGE } from '../diagram-generation/layout/timeDeltaDiagram.mjs';
import type {
  DiagramGenerationSpec,
  TideDiagramDocument,
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
  readonly tickLen: number;
  readonly tickLabelHours: readonly number[];
  readonly tickLabelSize: number;
  readonly tickLabelClearance: number;
  readonly timeNow: string;
  readonly timeNowDatePrefix: string;
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
  readonly tideMarks: {
    readonly tideHeightLabelRadius: number;
    readonly tideTimeLabelRadius: number;
    readonly tideHeightLabelSize: number;
    readonly tideTimeLabelSize: number;
    readonly tideMarkArrowDivergence: number;
    readonly tideMarkArrowLineLen: number;
    readonly markers: readonly SemanticInjectionTideMark[];
  };
  readonly timeNowLabel: {
    readonly fontHeight: number;
    readonly dateAboveTime: number;
  };
  readonly centreFrame: { readonly frameArcRadius: number };
  readonly insideTrackRadius: number;
  readonly timeDelta: {
    readonly countdownLines: readonly { readonly belowOrigin: number; readonly fontHeight: number }[];
    readonly emptyMessage: { readonly belowOrigin: number; readonly fontHeight: number };
    readonly town: string;
    readonly tidePhasePair: 'out-low' | 'in-high';
  };
  readonly annularBand: { readonly annularBandWidth: number };
  readonly homeMenuTrigger: {
    readonly centerX: number;
    readonly centerY: number;
    readonly radius: number;
    readonly labelSize: number;
    readonly label: string;
  };
};

/** `buildDiagram` is implemented in `.mjs`; align returns with {@link TideDiagramDocument}. */
function buildDiagramFromSpec(spec: DiagramGenerationSpec): TideDiagramDocument {
  return buildDiagram(spec) as TideDiagramDocument;
}

/** Minimal spec with timeDelta, centreFrame, nextPointer, waitArc, and tide markers. */
function sampleTideDiagramSpec(): SemanticInjectionDiagramSpec {
  return {
    title: 'semantic-injection',
    canvas: { width: 420, height: 320 },
    refRadius: 118,
    sweepRad: 2.75,
    tickLen: 0.07,
    tickLabelHours: [0, 3, 6, 9, 12, 15, 18, 21],
    tickLabelSize: 0.04,
    tickLabelClearance: 0.07,
    timeNow: '19:20:03',
    timeNowDatePrefix: 'Mon 23 Mar',
    nowPointer: {
      radialLine: { outerRadius: 0.7 },
      label: { size: 0.04, normalOffset: 0.02 },
      triangle: { subtendedAngleRad: Math.PI / 6 },
    },
    nextPointer: {
      radialLine: { outerRadius: 0.73 },
    },
    waitArc: {
      radius: 0.68,
      arrow: {
        lengthK: 7,
        widthK: 5,
        insetK: 0,
        style: 'filled',
        scaleWithStroke: true,
      },
    },
    tideMarks: {
      tideHeightLabelRadius: 0.88,
      tideTimeLabelRadius: 0.8,
      tideHeightLabelSize: 0.046,
      tideTimeLabelSize: 0.04,
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
    centreFrame: { frameArcRadius: 0.35 },
    insideTrackRadius: 0.75,
    timeDelta: {
      countdownLines: [
        { belowOrigin: 0.04, fontHeight: 0.05 },
        { belowOrigin: 0.07, fontHeight: 0.05 },
        { belowOrigin: 0.1, fontHeight: 0.05 },
        { belowOrigin: 0.13, fontHeight: 0.05 },
      ],
      emptyMessage: { belowOrigin: 0.1, fontHeight: 0.05 },
      town: 'Lymington',
      tidePhasePair: 'out-low',
    },
    annularBand: { annularBandWidth: 0.05 },
    homeMenuTrigger: {
      centerX: -1.08,
      centerY: -1.0,
      radius: 0.09,
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

  it('after last tide of the day shows NoMoreTidesToday and omits NextPointer and WaitArc', () => {
    const spec = { ...sampleTideDiagramSpec(), timeNow: '23:59:00' };
    const diagram = buildDiagramFromSpec(spec as DiagramGenerationSpec);
    expect(diagram.timeDeltaDiagram.countdownStripes).toBeNull();
    expect(diagram.timeDeltaDiagram.timeDeltaEmptyMessage).toEqual({
      content: TIME_DELTA_EMPTY_MESSAGE,
      fontSize: 5.9,
      anchor: { x: 0, y: -11.8 },
      hAlign: 'center',
    });
    expect(diagram.timeNowDate.content).toBe('Mon 23 Mar');
    expect(diagram.timeNowClock.hhmm.content).toBe('23:59');
    expect(diagram.timeNowClock.secondsColon.content).toBe(':');
    expect(diagram.timeNowClock.seconds.content).toBe('00');
    expect(diagram.nextPointer).toBeNull();
    expect(diagram.waitArc).toBeNull();
    expect(diagram.nowPointer?.triangle).toBeDefined();
    expect(diagram.nowPointer?.radialLine).not.toBeNull();
    expect(diagram.nowPointer?.nowLabel).not.toBeNull();
  });

  it('omits Now label (but keeps Now radial line) when next tide is under 60 minutes and not near-superimposed', () => {
    const spec = { ...sampleTideDiagramSpec(), timeNow: '22:07:00' };
    const diagram = buildDiagramFromSpec(spec as DiagramGenerationSpec);
    expect(diagram.nextPointer).not.toBeNull();
    expect(diagram.nowPointer?.triangle).toBeDefined();
    expect(diagram.nowPointer?.radialLine).not.toBeNull();
    expect(diagram.nowPointer?.nowLabel).toBeNull();
    expect(diagram.waitArc).not.toBeNull();
  });

  it('omits both Now radial line and Now label when next tide is under 5 minutes away', () => {
    const spec = { ...sampleTideDiagramSpec(), timeNow: '23:03:00' };
    const diagram = buildDiagramFromSpec(spec as DiagramGenerationSpec);
    expect(diagram.nextPointer).not.toBeNull();
    expect(diagram.nowPointer?.triangle).toBeDefined();
    expect(diagram.nowPointer?.radialLine).toBeNull();
    expect(diagram.nowPointer?.nowLabel).toBeNull();
    expect(diagram.waitArc).not.toBeNull();
  });

  it('keeps Now radial line and Now label at exactly 60 minutes', () => {
    const spec = { ...sampleTideDiagramSpec(), timeNow: '22:06:00' };
    const diagram = buildDiagramFromSpec(spec as DiagramGenerationSpec);
    expect(diagram.nextPointer).not.toBeNull();
    expect(diagram.nowPointer?.radialLine).not.toBeNull();
    expect(diagram.nowPointer?.nowLabel).not.toBeNull();
    expect(diagram.waitArc).not.toBeNull();
    expect(diagram.waitArc?.arrow).toBeDefined();
  });

  it('omits WaitArc arrow when configured arrowhead is too long for the arc span', () => {
    const spec = {
      ...sampleTideDiagramSpec(),
      timeNow: '22:06:00',
      waitArc: {
        ...sampleTideDiagramSpec().waitArc,
        arrow: {
          ...sampleTideDiagramSpec().waitArc.arrow,
          lengthK: 24,
        },
      },
    };
    const diagram = buildDiagramFromSpec(spec as DiagramGenerationSpec);
    expect(diagram.waitArc).not.toBeNull();
    expect(diagram.waitArc?.arrow).toBeUndefined();
  });

  it('keeps WaitArc arrow when there is enough arc length for the configured marker', () => {
    const spec = { ...sampleTideDiagramSpec(), timeNow: '20:30:00' };
    const diagram = buildDiagramFromSpec(spec as DiagramGenerationSpec);
    expect(diagram.nextPointer).not.toBeNull();
    expect(diagram.nowPointer?.radialLine).not.toBeNull();
    expect(diagram.nowPointer?.nowLabel).not.toBeNull();
    expect(diagram.waitArc).not.toBeNull();
    expect(diagram.waitArc?.arrow).toBeDefined();
  });

  it('keeps WaitArc arrow for medium waits even with large arrow config', () => {
    const spec = {
      ...sampleTideDiagramSpec(),
      timeNow: '21:02:00',
      waitArc: {
        ...sampleTideDiagramSpec().waitArc,
        arrow: {
          ...sampleTideDiagramSpec().waitArc.arrow,
          lengthK: 24,
        },
      },
    };
    const diagram = buildDiagramFromSpec(spec as DiagramGenerationSpec);
    expect(diagram.waitArc).not.toBeNull();
    expect(diagram.waitArc?.arrow).toBeDefined();
  });

  it('rejects malformed injected nextTide', () => {
    const spec = sampleTideDiagramSpec();
    expect(() =>
      buildDiagramFromSpec({
        ...spec,
        semantic: {
          nextTide: {
            secondsSinceMidnight: 'x',
            kind: 'High',
            timeDeltaIntervalText: '1h 0m',
          },
        },
      } as DiagramGenerationSpec),
    ).toThrow(/secondsSinceMidnight/);
  });

  it('throws when spec omits timeDelta', () => {
    const { timeDelta: _omit, ...rest } = sampleTideDiagramSpec();
    expect(() => buildDiagramFromSpec(rest as DiagramGenerationSpec)).toThrow(
      /spec\.timeDelta/,
    );
  });

  it('throws when spec omits centreFrame', () => {
    const { centreFrame: _omit, ...rest } = sampleTideDiagramSpec();
    expect(() => buildDiagramFromSpec(rest as DiagramGenerationSpec)).toThrow(
      /spec\.centreFrame/,
    );
  });

  it('throws when spec omits annularBand', () => {
    const { annularBand: _omit, ...rest } = sampleTideDiagramSpec();
    expect(() => buildDiagramFromSpec(rest as DiagramGenerationSpec)).toThrow(
      /spec\.annularBand/,
    );
  });

  it('throws when spec omits insideTrackRadius', () => {
    const { insideTrackRadius: _omit, ...rest } = sampleTideDiagramSpec();
    expect(() => buildDiagramFromSpec(rest as DiagramGenerationSpec)).toThrow(
      /insideTrackRadius/,
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
