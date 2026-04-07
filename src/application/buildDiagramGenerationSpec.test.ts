import { describe, expect, it } from 'vitest';
import { TideExtreme } from '../core-models/TideExtreme';
import { TideExtremesAtLocation } from '../core-models/TideExtremesAtLocation';
import {
  buildDiagramGenerationSpec,
  formatTideHeightMetresForDiagram,
  type HomeDiagramTideMarks,
  utcIsoToLocalCanonicalTimeUtc,
} from './buildDiagramGenerationSpec';
import { createDiagramGenerationCollaborator } from './diagramGenerationCollaborator';
import { deriveNextTideSemantics } from './nextTideSemantics';

/** UTC instants chosen so `utcIsoToLocalCanonicalTimeUtc` matches fixture marker times. */
function fixtureExtremesAtLocation(): TideExtremesAtLocation {
  return new TideExtremesAtLocation(50.8, -1.1, [
    new TideExtreme('low', '2026-03-23T04:15:00.000Z', 0.94),
    new TideExtreme('high', '2026-03-23T10:45:00.000Z', 4.7),
    new TideExtreme('low', '2026-03-23T16:59:24.000Z', 0.89),
    new TideExtreme('high', '2026-03-23T23:06:00.000Z', 4.8),
  ]);
}

const expectedFixtureMarkers = [
  { time: '04:15:00', heightText: '0.94 m', highOrLow: 'Low' },
  { time: '10:45:00', heightText: '4.7 m', highOrLow: 'High' },
  { time: '16:59:24', heightText: '0.89 m', highOrLow: 'Low' },
  { time: '23:06:00', heightText: '4.8 m', highOrLow: 'High' },
];
const FIXTURE_DATE_PREFIX = 'Mon 23 Mar';

describe('formatTideHeightMetresForDiagram', () => {
  it('formats like existing diagram examples', () => {
    expect(formatTideHeightMetresForDiagram(0.94)).toBe('0.94 m');
    expect(formatTideHeightMetresForDiagram(4.7)).toBe('4.7 m');
    expect(formatTideHeightMetresForDiagram(3)).toBe('3 m');
  });
});

describe('buildDiagramGenerationSpec', () => {
  it('maps stored extremes and timeNow into tideMarks compatible with diagram-generation', () => {
    const spec = buildDiagramGenerationSpec({
      extremesAtLocation: fixtureExtremesAtLocation(),
      timeNow: '19:20:03',
      timeNowDatePrefix: FIXTURE_DATE_PREFIX,
      utcIsoToLocalCanonicalTime: utcIsoToLocalCanonicalTimeUtc,
      townName: 'Lymington',
      timeDeltaTidePhasePair: 'out-low',
    });
    const markers = (spec.tideMarks as HomeDiagramTideMarks).markers;
    expect(markers).toEqual(expectedFixtureMarkers);
    expect(spec.timeNow).toBe('19:20:03');
    expect(spec.semantic).toBeUndefined();
  });

  it('rejects empty extremes', () => {
    expect(() =>
      buildDiagramGenerationSpec({
        extremesAtLocation: new TideExtremesAtLocation(1, 2, []),
        timeNow: '12:00:00',
        timeNowDatePrefix: FIXTURE_DATE_PREFIX,
        utcIsoToLocalCanonicalTime: utcIsoToLocalCanonicalTimeUtc,
        townName: 'Lymington',
        timeDeltaTidePhasePair: 'out-low',
      }),
    ).toThrow(/at least one tide extreme/);
  });

  it('injects semantic.nextTide when derivedSemantics is passed', () => {
    const base = buildDiagramGenerationSpec({
      extremesAtLocation: fixtureExtremesAtLocation(),
      timeNow: '19:20:03',
      timeNowDatePrefix: FIXTURE_DATE_PREFIX,
      utcIsoToLocalCanonicalTime: utcIsoToLocalCanonicalTimeUtc,
      townName: 'Lymington',
      timeDeltaTidePhasePair: 'out-low',
    });
    const { nextTide } = deriveNextTideSemantics(base);
    const withSemantic = buildDiagramGenerationSpec({
      extremesAtLocation: fixtureExtremesAtLocation(),
      timeNow: '19:20:03',
      timeNowDatePrefix: FIXTURE_DATE_PREFIX,
      utcIsoToLocalCanonicalTime: utcIsoToLocalCanonicalTimeUtc,
      townName: 'Lymington',
      timeDeltaTidePhasePair: 'out-low',
      derivedSemantics: { nextTide },
    });
    expect(withSemantic.semantic).toEqual({ nextTide });
  });
});

describe('buildDiagramGenerationSpec + createDiagramGenerationCollaborator', () => {
  it('matches diagram output with and without injected semantics', () => {
    const collaborator = createDiagramGenerationCollaborator();
    const baseSpec = buildDiagramGenerationSpec({
      extremesAtLocation: fixtureExtremesAtLocation(),
      timeNow: '19:20:03',
      timeNowDatePrefix: FIXTURE_DATE_PREFIX,
      utcIsoToLocalCanonicalTime: utcIsoToLocalCanonicalTimeUtc,
      townName: 'Lymington',
      timeDeltaTidePhasePair: 'out-low',
    });
    const baseline = collaborator.generate(baseSpec);
    const { nextTide } = deriveNextTideSemantics(baseSpec);
    const injected = buildDiagramGenerationSpec({
      extremesAtLocation: fixtureExtremesAtLocation(),
      timeNow: '19:20:03',
      timeNowDatePrefix: FIXTURE_DATE_PREFIX,
      utcIsoToLocalCanonicalTime: utcIsoToLocalCanonicalTimeUtc,
      townName: 'Lymington',
      timeDeltaTidePhasePair: 'out-low',
      derivedSemantics: { nextTide },
    });
    expect(collaborator.generate(injected).diagram).toEqual(baseline.diagram);
  });

  it('golden snapshot: stable diagram from fixture spec', () => {
    const collaborator = createDiagramGenerationCollaborator();
    const baseSpec = buildDiagramGenerationSpec({
      extremesAtLocation: fixtureExtremesAtLocation(),
      timeNow: '19:20:03',
      timeNowDatePrefix: FIXTURE_DATE_PREFIX,
      utcIsoToLocalCanonicalTime: utcIsoToLocalCanonicalTimeUtc,
      townName: 'Lymington',
      timeDeltaTidePhasePair: 'out-low',
    });
    const spec = buildDiagramGenerationSpec({
      extremesAtLocation: fixtureExtremesAtLocation(),
      timeNow: '19:20:03',
      timeNowDatePrefix: FIXTURE_DATE_PREFIX,
      utcIsoToLocalCanonicalTime: utcIsoToLocalCanonicalTimeUtc,
      townName: 'Lymington',
      timeDeltaTidePhasePair: 'out-low',
      derivedSemantics: deriveNextTideSemantics(baseSpec),
    });
    expect(collaborator.generate(spec).diagram).toMatchSnapshot();
  });

  it('golden snapshot: stable scene from fixture spec', () => {
    const collaborator = createDiagramGenerationCollaborator();
    const spec = buildDiagramGenerationSpec({
      extremesAtLocation: fixtureExtremesAtLocation(),
      timeNow: '19:20:03',
      timeNowDatePrefix: FIXTURE_DATE_PREFIX,
      utcIsoToLocalCanonicalTime: utcIsoToLocalCanonicalTimeUtc,
      townName: 'Lymington',
      timeDeltaTidePhasePair: 'out-low',
    });
    expect(collaborator.generate(spec).scene).toMatchSnapshot();
  });
});
