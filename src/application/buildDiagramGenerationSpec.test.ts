import { describe, expect, it } from 'vitest';
import { TideExtreme } from '../core-models/TideExtreme';
import { TideExtremesAtLocation } from '../core-models/TideExtremesAtLocation';
import {
  buildDiagramGenerationSpec,
  deriveTimeDeltaTidePhasePair,
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

/** Fifth extreme triggers `moreThanFourExtrema` in `isAtypicalTideExtremaPattern` (ordered same-day UTC instants). */
function fixtureAtypicalFiveExtremesAtLocation(): TideExtremesAtLocation {
  return new TideExtremesAtLocation(50.8, -1.1, [
    new TideExtreme('low', '2026-03-23T04:15:00.000Z', 0.94),
    new TideExtreme('high', '2026-03-23T10:45:00.000Z', 4.7),
    new TideExtreme('low', '2026-03-23T16:59:24.000Z', 0.89),
    new TideExtreme('high', '2026-03-23T23:06:00.000Z', 4.8),
    new TideExtreme('low', '2026-03-23T23:50:00.000Z', 0.95),
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
    });
    const markers = (spec.tideMarks as HomeDiagramTideMarks).markers;
    expect(markers).toEqual(expectedFixtureMarkers);
    expect(spec.timeNow).toBe('19:20:03');
    expect(spec.semantic).toBeUndefined();
    expect((spec.timeDelta as { atypicalTideSummary: boolean }).atypicalTideSummary).toBe(
      false,
    );
  });

  it('rejects empty extremes', () => {
    expect(() =>
      buildDiagramGenerationSpec({
        extremesAtLocation: new TideExtremesAtLocation(1, 2, []),
        timeNow: '12:00:00',
        timeNowDatePrefix: FIXTURE_DATE_PREFIX,
        utcIsoToLocalCanonicalTime: utcIsoToLocalCanonicalTimeUtc,
        townName: 'Lymington',
      }),
    ).toThrow(/at least one tide extreme/);
  });

  it('sets atypicalTideSummary and atypical TimeDelta countdown copy when extrema pattern is atypical', () => {
    const spec = buildDiagramGenerationSpec({
      extremesAtLocation: fixtureAtypicalFiveExtremesAtLocation(),
      timeNow: '19:20:03',
      timeNowDatePrefix: FIXTURE_DATE_PREFIX,
      utcIsoToLocalCanonicalTime: utcIsoToLocalCanonicalTimeUtc,
      townName: 'Lymington',
    });
    expect((spec.timeDelta as { atypicalTideSummary: boolean }).atypicalTideSummary).toBe(true);
    const collaborator = createDiagramGenerationCollaborator();
    const { diagram } = collaborator.generate(spec);
    const stripes = diagram.timeDeltaDiagram.countdownStripes;
    expect(stripes).not.toBeNull();
    expect(stripes!.map((s) => s.content)).toEqual([
      'Lymington',
      'Tricky tides today',
      'Use the markers',
      '',
    ]);
    expect(diagram.nextPointer).not.toBeNull();
  });

  it('injects semantic.nextTide when derivedSemantics is passed', () => {
    const base = buildDiagramGenerationSpec({
      extremesAtLocation: fixtureExtremesAtLocation(),
      timeNow: '19:20:03',
      timeNowDatePrefix: FIXTURE_DATE_PREFIX,
      utcIsoToLocalCanonicalTime: utcIsoToLocalCanonicalTimeUtc,
      townName: 'Lymington',
    });
    const { nextTide } = deriveNextTideSemantics(base);
    const withSemantic = buildDiagramGenerationSpec({
      extremesAtLocation: fixtureExtremesAtLocation(),
      timeNow: '19:20:03',
      timeNowDatePrefix: FIXTURE_DATE_PREFIX,
      utcIsoToLocalCanonicalTime: utcIsoToLocalCanonicalTimeUtc,
      townName: 'Lymington',
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
    });
    const baseline = collaborator.generate(baseSpec);
    const { nextTide } = deriveNextTideSemantics(baseSpec);
    const injected = buildDiagramGenerationSpec({
      extremesAtLocation: fixtureExtremesAtLocation(),
      timeNow: '19:20:03',
      timeNowDatePrefix: FIXTURE_DATE_PREFIX,
      utcIsoToLocalCanonicalTime: utcIsoToLocalCanonicalTimeUtc,
      townName: 'Lymington',
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
    });
    const spec = buildDiagramGenerationSpec({
      extremesAtLocation: fixtureExtremesAtLocation(),
      timeNow: '19:20:03',
      timeNowDatePrefix: FIXTURE_DATE_PREFIX,
      utcIsoToLocalCanonicalTime: utcIsoToLocalCanonicalTimeUtc,
      townName: 'Lymington',
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
    });
    expect(collaborator.generate(spec).scene).toMatchSnapshot();
  });
});

describe('deriveTimeDeltaTidePhasePair', () => {
  const extremes = fixtureExtremesAtLocation().extremes;

  it('uses segment slope for times between adjacent extremes', () => {
    expect(
      deriveTimeDeltaTidePhasePair({
        extremes,
        timeNow: '07:00:00',
        utcIsoToLocalCanonicalTime: utcIsoToLocalCanonicalTimeUtc,
      }),
    ).toBe('in-high');
    expect(
      deriveTimeDeltaTidePhasePair({
        extremes,
        timeNow: '14:00:00',
        utcIsoToLocalCanonicalTime: utcIsoToLocalCanonicalTimeUtc,
      }),
    ).toBe('out-low');
  });

  it('resolves before-first and after-last as alternating half segments', () => {
    expect(
      deriveTimeDeltaTidePhasePair({
        extremes,
        timeNow: '03:00:00',
        utcIsoToLocalCanonicalTime: utcIsoToLocalCanonicalTimeUtc,
      }),
    ).toBe('out-low');
    expect(
      deriveTimeDeltaTidePhasePair({
        extremes,
        timeNow: '23:40:00',
        utcIsoToLocalCanonicalTime: utcIsoToLocalCanonicalTimeUtc,
      }),
    ).toBe('out-low');
  });
});
