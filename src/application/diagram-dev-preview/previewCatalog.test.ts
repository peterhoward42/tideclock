import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  diagramPreviewIdFromSearch,
  diagramPreviewShortHeadline,
  timeNowHourFromSearch,
} from './previewCatalog';

describe('diagram-dev-preview previewCatalog', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('parses known id from search when DEV', () => {
    vi.stubEnv('DEV', true);
    expect(diagramPreviewIdFromSearch('?diagramPreview=no-more-tides-today')).toBe(
      'no-more-tides-today',
    );
  });

  it('returns null for unknown id', () => {
    vi.stubEnv('DEV', true);
    expect(diagramPreviewIdFromSearch('?diagramPreview=not-a-scenario')).toBeNull();
  });

  it('returns null outside DEV builds', () => {
    vi.stubEnv('DEV', false);
    expect(diagramPreviewIdFromSearch('?diagramPreview=atypical-tide-day')).toBeNull();
  });

  it('exposes banner headline copy', () => {
    expect(diagramPreviewShortHeadline('time-delta-short')).toBe('time-delta-short');
  });

  it('parses whole-hour timeNow override when DEV', () => {
    vi.stubEnv('DEV', true);
    expect(timeNowHourFromSearch('?timeNowHour=10')).toBe(10);
    expect(timeNowHourFromSearch('?timeNowHour=23')).toBe(23);
    expect(timeNowHourFromSearch('?timeNowHour=24')).toBeNull();
    expect(timeNowHourFromSearch('?timeNowHour=abc')).toBeNull();
  });

  it('returns null for timeNowHour outside DEV builds', () => {
    vi.stubEnv('DEV', false);
    expect(timeNowHourFromSearch('?timeNowHour=10')).toBeNull();
  });
});
