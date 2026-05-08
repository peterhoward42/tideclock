import { describe, expect, it } from 'vitest';
import { TideExtreme } from '../core-models/TideExtreme';
import { TideExtremesAtLocation } from '../core-models/TideExtremesAtLocation';
import {
  buildDiagramSpec,
  formatTideHeightMetres,
  type HomeTideMarks,
  utcIsoToLocalCanonicalTimeUtc,
} from './buildDiagramSpec';
import { createDiagramCollaborator } from './diagramCollaborator';
import { deriveNextTideSemantics } from './nextTideSemantics';

/** UTC instants chosen so `utcIsoToLocalCanonicalTimeUtc` matches fixture marker times. */
function fixtureExtremesAtLocation(): TideExtremesAtLocation {
  return TideExtremesAtLocation.fromPossiblyUnordered(50.8, -1.1, [
    new TideExtreme('low', '2026-03-23T04:15:00.000Z', 0.94),
    new TideExtreme('high', '2026-03-23T10:45:00.000Z', 4.7),
    new TideExtreme('low', '2026-03-23T16:59:24.000Z', 0.89),
    new TideExtreme('high', '2026-03-23T23:06:00.000Z', 4.8),
  ]);
}

const expectedFixtureMarkers = [
  { time: '04:15:00', heightText: '0.94 m', highOrLow: 'Low' },
  { time: '10:45:00', heightText: '4.70 m', highOrLow: 'High' },
  { time: '16:59:24', heightText: '0.89 m', highOrLow: 'Low' },
  { time: '23:06:00', heightText: '4.80 m', highOrLow: 'High' },
];
const FIXTURE_DATE_PREFIX = 'Mon 23 Mar';

describe('formatTideHeightMetres', () => {
  it('always uses two decimal places after centimetre rounding', () => {
    expect(formatTideHeightMetres(0.94)).toBe('0.94 m');
    expect(formatTideHeightMetres(4.7)).toBe('4.70 m');
    expect(formatTideHeightMetres(3)).toBe('3.00 m');
    expect(formatTideHeightMetres(1)).toBe('1.00 m');
  });
});

describe('buildDiagramSpec', () => {
  it('maps stored extremes and timeNow into tideMarks compatible with diagram-generation', () => {
    const spec = buildDiagramSpec({
      extremesAtLocation: fixtureExtremesAtLocation(),
      timeNow: '19:20:03',
      brhcDatePrefix: FIXTURE_DATE_PREFIX,
      utcIsoToLocalCanonicalTime: utcIsoToLocalCanonicalTimeUtc,
      townName: 'Lymington',
    });
    const markers = (spec.tideMarks as HomeTideMarks).markers;
    expect(markers).toEqual(expectedFixtureMarkers);
    expect(spec.timeNow).toBe('19:20:03');
    expect(spec.semantic).toEqual({ atypicalTideSummary: false });
  });

  it('rejects empty extremes', () => {
    expect(() =>
      buildDiagramSpec({
        extremesAtLocation: TideExtremesAtLocation.fromPossiblyUnordered(1, 2, []),
        timeNow: '12:00:00',
        brhcDatePrefix: FIXTURE_DATE_PREFIX,
        utcIsoToLocalCanonicalTime: utcIsoToLocalCanonicalTimeUtc,
        townName: 'Lymington',
      }),
    ).toThrow(/at least one tide extreme/);
  });

  it('injects semantic.nextTide when derivedSemantics is passed', () => {
    const base = buildDiagramSpec({
      extremesAtLocation: fixtureExtremesAtLocation(),
      timeNow: '19:20:03',
      brhcDatePrefix: FIXTURE_DATE_PREFIX,
      utcIsoToLocalCanonicalTime: utcIsoToLocalCanonicalTimeUtc,
      townName: 'Lymington',
    });
    const { nextTide } = deriveNextTideSemantics(base);
    const withSemantic = buildDiagramSpec({
      extremesAtLocation: fixtureExtremesAtLocation(),
      timeNow: '19:20:03',
      brhcDatePrefix: FIXTURE_DATE_PREFIX,
      utcIsoToLocalCanonicalTime: utcIsoToLocalCanonicalTimeUtc,
      townName: 'Lymington',
      derivedSemantics: { nextTide },
    });
    expect(withSemantic.semantic).toEqual({ atypicalTideSummary: false, nextTide });
  });
});

describe('buildDiagramSpec + createDiagramCollaborator', () => {
  it('matches diagram output with and without injected semantics', () => {
    const collaborator = createDiagramCollaborator();
    const baseSpec = buildDiagramSpec({
      extremesAtLocation: fixtureExtremesAtLocation(),
      timeNow: '19:20:03',
      brhcDatePrefix: FIXTURE_DATE_PREFIX,
      utcIsoToLocalCanonicalTime: utcIsoToLocalCanonicalTimeUtc,
      townName: 'Lymington',
    });
    const baseline = collaborator.generate(baseSpec);
    const { nextTide } = deriveNextTideSemantics(baseSpec);
    const injected = buildDiagramSpec({
      extremesAtLocation: fixtureExtremesAtLocation(),
      timeNow: '19:20:03',
      brhcDatePrefix: FIXTURE_DATE_PREFIX,
      utcIsoToLocalCanonicalTime: utcIsoToLocalCanonicalTimeUtc,
      townName: 'Lymington',
      derivedSemantics: { nextTide },
    });
    expect(collaborator.generate(injected).diagram).toEqual(baseline.diagram);
  });

  it('golden snapshot: stable diagram from fixture spec', () => {
    const collaborator = createDiagramCollaborator();
    const baseSpec = buildDiagramSpec({
      extremesAtLocation: fixtureExtremesAtLocation(),
      timeNow: '19:20:03',
      brhcDatePrefix: FIXTURE_DATE_PREFIX,
      utcIsoToLocalCanonicalTime: utcIsoToLocalCanonicalTimeUtc,
      townName: 'Lymington',
    });
    const spec = buildDiagramSpec({
      extremesAtLocation: fixtureExtremesAtLocation(),
      timeNow: '19:20:03',
      brhcDatePrefix: FIXTURE_DATE_PREFIX,
      utcIsoToLocalCanonicalTime: utcIsoToLocalCanonicalTimeUtc,
      townName: 'Lymington',
      derivedSemantics: deriveNextTideSemantics(baseSpec),
    });
    expect(collaborator.generate(spec).diagram).toMatchSnapshot();
  });

  it('golden snapshot: stable scene from fixture spec', () => {
    const collaborator = createDiagramCollaborator();
    const spec = buildDiagramSpec({
      extremesAtLocation: fixtureExtremesAtLocation(),
      timeNow: '19:20:03',
      brhcDatePrefix: FIXTURE_DATE_PREFIX,
      utcIsoToLocalCanonicalTime: utcIsoToLocalCanonicalTimeUtc,
      townName: 'Lymington',
    });
    expect(collaborator.generate(spec).scene).toMatchSnapshot();
  });
});
