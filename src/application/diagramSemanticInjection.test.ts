import { describe, expect, it } from 'vitest';
import { buildDiagram } from '../diagram-generation/index.mjs';
import { TIME_DELTA_EMPTY_MESSAGE } from '../diagram-generation/layout/centreCluster.mjs';
import { deriveNextTideSemantics } from './nextTideSemantics';

/** Minimal spec with centreCluster, nextPointer, waitArc, and tide markers. */
function sampleTideDiagramSpec(): Record<string, unknown> {
  return {
    title: 'semantic-injection',
    contentBounds: { left: 1.45, right: 1.15, above: 0.1, below: 1.5 },
    refRadius: 118,
    sweepRad: 2.75,
    timeNow: '19:20:03',
    nowPointer: {
      radialLine: { innerRadius: 0.4, outerRadius: 0.7 },
      label: { size: 0.04, normalOffset: 0.02 },
      triangle: { radius: 1.1, baseLen: 0.08, height: 0.03 },
    },
    nextPointer: {
      radialLine: { outerRadius: 0.73 },
      circle: { radius: 0.01 },
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
      markers: [
        { time: '04:15:00', heightText: '0.94 m', highOrLow: 'Low' },
        { time: '10:45:00', heightText: '4.7 m', highOrLow: 'High' },
        { time: '16:59:24', heightText: '0.89 m', highOrLow: 'Low' },
        { time: '23:06:00', heightText: '4.8 m', highOrLow: 'High' },
      ],
    },
    timeNowLabel: { x: 0.8, fontHeight: 0.05 },
    centreCluster: {
      frameArcRadius: 0.35,
      timeDelta: { y: -0.1, fontHeight: 0.05 },
    },
  };
}

describe('spec.semantic.nextTide injection', () => {
  it('matches buildDiagram output when derived via deriveNextTideSemantics', () => {
    const spec = sampleTideDiagramSpec();
    const baseline = buildDiagram(spec);
    const { nextTide } = deriveNextTideSemantics(spec);
    expect(nextTide).not.toBeNull();
    const withSemantic = buildDiagram({
      ...spec,
      semantic: { nextTide },
    });
    expect(withSemantic).toEqual(baseline);
  });

  it('matches when semantic.nextTide is null (no qualifying marker)', () => {
    const { centreCluster: _omit, ...rest } = sampleTideDiagramSpec();
    const spec = { ...rest, timeNow: '23:59:00' };
    const baseline = buildDiagram(spec);
    const { nextTide } = deriveNextTideSemantics(spec);
    expect(nextTide).toBeNull();
    const withSemantic = buildDiagram({
      ...spec,
      semantic: { nextTide: null },
    });
    expect(withSemantic).toEqual(baseline);
  });

  it('after last tide of the day shows NoMoreTidesToday and omits NextPointer and WaitArc', () => {
    const spec = { ...sampleTideDiagramSpec(), timeNow: '23:59:00' };
    const diagram = buildDiagram(spec);
    expect(diagram.centreCluster).not.toBeNull();
    expect(diagram.centreCluster?.timeDelta).toEqual([]);
    expect(diagram.centreCluster?.timeDeltaEmptyMessage).toEqual({
      content: TIME_DELTA_EMPTY_MESSAGE,
      fontSize: 5.9,
      anchor: { x: 0, y: -11.8 },
    });
    expect(diagram.timeNowLabel?.content).toBe('23:59:00');
    expect(diagram.nextPointer).toBeNull();
    expect(diagram.waitArc).toBeNull();
    expect(diagram.nowPointer?.triangle).toBeDefined();
    expect(diagram.nowPointer?.radialLine).toBeNull();
    expect(diagram.nowPointer?.nowLabel).toBeNull();
  });

  it('omits Now radial line, Now label, and WaitArc when next tide is under 60 minutes away', () => {
    const spec = { ...sampleTideDiagramSpec(), timeNow: '22:10:00' };
    const diagram = buildDiagram(spec);
    expect(diagram.nextPointer).not.toBeNull();
    expect(diagram.nowPointer?.triangle).toBeDefined();
    expect(diagram.nowPointer?.radialLine).toBeNull();
    expect(diagram.nowPointer?.nowLabel).toBeNull();
    expect(diagram.waitArc).toBeNull();
  });

  it('keeps Now radial line, Now label, and WaitArc when next tide is exactly 60 minutes away', () => {
    const spec = { ...sampleTideDiagramSpec(), timeNow: '22:06:00' };
    const diagram = buildDiagram(spec);
    expect(diagram.nextPointer).not.toBeNull();
    expect(diagram.nowPointer?.radialLine).not.toBeNull();
    expect(diagram.nowPointer?.nowLabel).not.toBeNull();
    expect(diagram.waitArc).not.toBeNull();
  });

  it('rejects malformed injected nextTide', () => {
    const spec = sampleTideDiagramSpec();
    expect(() =>
      buildDiagram({
        ...spec,
        semantic: { nextTide: { secondsSinceMidnight: 'x', kind: 'High', timeDeltaIntervalText: '1h 0m' } },
      }),
    ).toThrow(/secondsSinceMidnight/);
  });

  it('golden snapshot: diagram with semantic.nextTide matches committed output', () => {
    const spec = sampleTideDiagramSpec();
    const { nextTide } = deriveNextTideSemantics(spec);
    expect(nextTide).not.toBeNull();
    const diagram = buildDiagram({
      ...spec,
      semantic: { nextTide },
    });
    expect(diagram).toMatchSnapshot();
  });
});
