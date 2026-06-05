import { beforeEach, describe, expect, it, vi } from 'vitest';

// Retains vi.mock rather than a RecordingProductAnalytics fake: production code
// imports @vercel/analytics directly with no injectable seam. Replacing mocks
// requires a production refactor (analytics port + default adapter) first.

const { mockTrack } = vi.hoisted(() => ({
  mockTrack: vi.fn()
}));

vi.mock('@vercel/analytics', () => ({
  inject: vi.fn(),
  track: mockTrack
}));

describe('emitRouteVisitTelemetry', () => {
  beforeEach(async () => {
    vi.resetModules();
    mockTrack.mockReset();
  });

  async function emit(routeId: string) {
    const { emitRouteVisitTelemetry } = await import('./routeVisitTelemetry');
    emitRouteVisitTelemetry(routeId);
  }

  it.each([
    ['install', 'visited_install'],
    ['onwall', 'visited_stick_on_wall'],
    ['story', 'visited_story'],
    ['tidenerd', 'visited_tide_nerd'],
    ['softwarenerd', 'visited_sw_nerd'],
    ['about', 'visited_about']
  ] as const)('maps %s to %s', async (routeId, eventName) => {
    await emit(routeId);

    expect(mockTrack).toHaveBeenCalledOnce();
    expect(mockTrack).toHaveBeenCalledWith(eventName, undefined);
  });

  it('no-ops for routes without a visit event', async () => {
    await emit('home');
    await emit('');

    expect(mockTrack).not.toHaveBeenCalled();
  });
});
