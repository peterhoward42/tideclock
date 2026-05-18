import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  tidePreviewIdFromSearch,
  tidePreviewMaybeOverrideLoad,
  tidePreviewShortHeadline
} from './previewCatalog';
import { ProxyQuotaExhaustedError } from '../../data-pipelines/proxyV1Types';

describe('tide-dev-preview previewCatalog', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('parses quota-exhausted from search when DEV', () => {
    vi.stubEnv('DEV', true);
    expect(tidePreviewIdFromSearch('?tideUxPreview=quota-exhausted')).toBe('quota-exhausted');
  });

  it('rejects with ProxyQuotaExhaustedError for quota-exhausted override', async () => {
    vi.stubEnv('DEV', true);
    const override = tidePreviewMaybeOverrideLoad('quota-exhausted', 50.8, -1.1);
    expect(override).not.toBeNull();
    await expect(override).rejects.toBeInstanceOf(ProxyQuotaExhaustedError);
  });

  it('exposes dev banner headline for quota-exhausted', () => {
    expect(tidePreviewShortHeadline('quota-exhausted')).toBe('quota exhausted (simulated)');
  });
});
