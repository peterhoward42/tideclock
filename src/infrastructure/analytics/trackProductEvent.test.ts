import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { mockInject, mockTrack } = vi.hoisted(() => ({
  mockInject: vi.fn(),
  mockTrack: vi.fn()
}));

vi.mock('@vercel/analytics', () => ({
  inject: mockInject,
  track: mockTrack
}));

describe('trackProductEvent', () => {
  let warnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(async () => {
    vi.resetModules();
    mockInject.mockReset();
    mockTrack.mockReset();
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  async function loadModule() {
    return import('./trackProductEvent');
  }

  it('passes event name and properties to track', async () => {
    const { trackProductEvent } = await loadModule();
    trackProductEvent('set_custom_loc', { label: 'Looe - Cornwall' });

    expect(mockTrack).toHaveBeenCalledOnce();
    expect(mockTrack).toHaveBeenCalledWith('set_custom_loc', {
      label: 'Looe - Cornwall'
    });
  });

  it('does not throw when track throws', async () => {
    mockTrack.mockImplementation(() => {
      throw new Error('analytics unavailable');
    });
    const { trackProductEvent } = await loadModule();

    expect(() => trackProductEvent('visited_story')).not.toThrow();
  });

  it('warns with the event name when track throws', async () => {
    mockTrack.mockImplementation(() => {
      throw new Error('analytics unavailable');
    });
    const { trackProductEvent } = await loadModule();
    trackProductEvent('visited_story');

    expect(warnSpy).toHaveBeenCalledOnce();
    expect(warnSpy).toHaveBeenCalledWith(
      '[tideclock] analytics',
      'visited_story'
    );
  });

  it('trackProductError records error with reason', async () => {
    const { trackProductError } = await loadModule();
    trackProductError('tide_load_failed');

    expect(mockTrack).toHaveBeenCalledWith('error', {
      reason: 'tide_load_failed'
    });
  });

  it('injectProductAnalytics does not call inject in test (non-PROD)', async () => {
    const { injectProductAnalytics } = await loadModule();
    injectProductAnalytics();
    injectProductAnalytics();

    expect(mockInject).not.toHaveBeenCalled();
  });
});
