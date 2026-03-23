import { describe, expect, it, vi } from 'vitest';
import {
  fetchAndStoreTideExtremesAtLocation,
  TIDE_EXTREMES_LOCAL_STORAGE_KEY,
  type TideExtremesStorer
} from './fetchAndStoreTideExtremesAtLocation';
import type { TideProxyV1Response } from './TideProxyV1Response';

class FakeTideExtremesStorer implements TideExtremesStorer {
  public writes: Array<{ key: string; value: string }> = [];

  setItem(key: string, value: string): void {
    this.writes.push({ key, value });
  }
}

describe('fetchAndStoreTideExtremesAtLocation', () => {
  it('fetches, maps, and persists tide extremes via injected storer', async () => {
    const storer = new FakeTideExtremesStorer();
    const responsePayload: TideProxyV1Response = {
      tides: [
        { type: 'High', time: '2026-03-23T00:40:00Z', heightMetres: 3.2 },
        { type: 'Low', time: '2026-03-23T07:05:00Z', heightMetres: 0.4 }
      ],
      datum: 'CD',
      windowStart: '2026-03-23T00:00:00Z',
      expiresAt: '2026-03-23T12:00:00Z',
      attribution: 'Example source'
    };

    const fetchImpl = vi.fn<typeof fetch>(async () => {
      return new Response(JSON.stringify(responsePayload), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    });

    const result = await fetchAndStoreTideExtremesAtLocation({
      lat: 50.8,
      lon: -1.1,
      baseUrl: 'https://example.test',
      fetchImpl,
      storer,
      storageKey: TIDE_EXTREMES_LOCAL_STORAGE_KEY
    });

    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(result.latitude).toBe(50.8);
    expect(result.longitude).toBe(-1.1);
    expect(result.extremes).toEqual([
      { type: 'high', timeUtc: '2026-03-23T00:40:00Z', heightMetres: 3.2 },
      { type: 'low', timeUtc: '2026-03-23T07:05:00Z', heightMetres: 0.4 }
    ]);
    expect(storer.writes).toEqual([
      {
        key: TIDE_EXTREMES_LOCAL_STORAGE_KEY,
        value: JSON.stringify({
          latitude: 50.8,
          longitude: -1.1,
          extremes: [
            { type: 'high', timeUtc: '2026-03-23T00:40:00Z', heightMetres: 3.2 },
            { type: 'low', timeUtc: '2026-03-23T07:05:00Z', heightMetres: 0.4 }
          ]
        })
      }
    ]);
  });

  it('uses custom storage key when provided', async () => {
    const storer = new FakeTideExtremesStorer();
    const fetchImpl = vi.fn<typeof fetch>(async () => {
      return new Response(
        JSON.stringify({
          tides: [],
          datum: 'CD',
          windowStart: '2026-03-23T00:00:00Z',
          expiresAt: '2026-03-23T12:00:00Z',
          attribution: 'Example source'
        } satisfies TideProxyV1Response),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    });

    await fetchAndStoreTideExtremesAtLocation({
      lat: 50.8,
      lon: -1.1,
      baseUrl: 'https://example.test',
      fetchImpl,
      storer,
      storageKey: 'custom-key'
    });

    expect(storer.writes).toHaveLength(1);
    expect(storer.writes[0]?.key).toBe('custom-key');
  });
});
