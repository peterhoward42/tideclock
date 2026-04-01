import { describe, expect, it } from 'vitest';
import { buildDiagram } from '../diagram-generation/index.mjs';
import { deriveNextTideSemantics } from './nextTideSemantics';

/** Minimal spec with centreCluster, nextPointer, waitArc, and tide markers (diaggen-shaped). */
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
    centreCluster: {
      frameArcRadius: 0.35,
      nowTime: { y: -0.2, fontHeight: 0.05 },
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

  it('rejects malformed injected nextTide', () => {
    const spec = sampleTideDiagramSpec();
    expect(() =>
      buildDiagram({
        ...spec,
        semantic: { nextTide: { secondsSinceMidnight: 'x', kind: 'High', timeDeltaIntervalText: '1h 0m' } },
      }),
    ).toThrow(/secondsSinceMidnight/);
  });
});
