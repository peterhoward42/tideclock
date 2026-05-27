import { describe, expect, it } from 'vitest';
import { TideExtreme } from '../../core-models/TideExtreme';
import { TideExtremesAtLocation } from '../../core-models/TideExtremesAtLocation';
import { utcIsoToLocalCanonicalTimeUtc } from '../buildDiagramSpec';
import {
  formatDiagramPreviewBanner,
  resolveHomeDiagramPreview,
} from './resolveForHome';

function fixtureExtremes(): TideExtremesAtLocation {
  return TideExtremesAtLocation.fromPossiblyUnordered(50, -1, [
    new TideExtreme('low', '2025-06-01T10:00:00.000Z', 1),
    new TideExtreme('high', '2025-06-01T22:00:00.000Z', 5),
  ]);
}

describe('resolveHomeDiagramPreview', () => {
  it('returns live when not in dev or preview id is null', () => {
    expect(
      resolveHomeDiagramPreview({
        dev: false,
        previewId: 'no-more-tides-today',
        tideExtremes: fixtureExtremes(),
        utcIsoToLocalCanonicalTime: utcIsoToLocalCanonicalTimeUtc,
      }),
    ).toEqual({ state: 'live' });
    expect(
      resolveHomeDiagramPreview({
        dev: true,
        previewId: null,
        tideExtremes: fixtureExtremes(),
        utcIsoToLocalCanonicalTime: utcIsoToLocalCanonicalTimeUtc,
      }),
    ).toEqual({ state: 'live' });
  });

  it('returns waiting when extremes are missing or empty', () => {
    expect(
      resolveHomeDiagramPreview({
        dev: true,
        previewId: 'time-delta-short',
        tideExtremes: undefined,
        utcIsoToLocalCanonicalTime: utcIsoToLocalCanonicalTimeUtc,
      }),
    ).toEqual({ state: 'waiting', id: 'time-delta-short' });
    expect(
      resolveHomeDiagramPreview({
        dev: true,
        previewId: 'time-delta-short',
        tideExtremes: TideExtremesAtLocation.fromPossiblyUnordered(50, -1, []),
        utcIsoToLocalCanonicalTime: utcIsoToLocalCanonicalTimeUtc,
      }),
    ).toEqual({ state: 'waiting', id: 'time-delta-short' });
  });

  it('freezes clock for no-more-tides-today when bookends allow it', () => {
    const extremes = fixtureExtremes();
    const preview = resolveHomeDiagramPreview({
      dev: true,
      previewId: 'no-more-tides-today',
      tideExtremes: extremes,
      utcIsoToLocalCanonicalTime: utcIsoToLocalCanonicalTimeUtc,
    });
    expect(preview.state).toBe('frozen');
    if (preview.state !== 'frozen') return;
    expect(preview.extremesAtLocation).toBe(extremes);
    expect(preview.frozenEpochMs).toBeTypeOf('number');
  });
});

describe('formatDiagramPreviewBanner', () => {
  it('returns null for live state', () => {
    expect(formatDiagramPreviewBanner({ state: 'live' })).toBeNull();
  });

  it('includes waiting hint when tides are not ready', () => {
    expect(
      formatDiagramPreviewBanner({ state: 'waiting', id: 'atypical-tide-day' }),
    ).toBe('Preview: atypical tide day (waiting for tide data…)');
  });
});
