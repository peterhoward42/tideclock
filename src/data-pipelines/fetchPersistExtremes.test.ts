import { describe, expect, it, vi } from 'vitest';
import { fetchPersistExtremes } from './fetchPersistExtremes';
import { ProxyQuotaExhaustedError, type TideProxyV1Response } from './proxyV1Types';
import { EXTREMES_SNAPSHOT_KEY, type ExtremesStorer } from './extremesSnapshot';

class FakeExtremesStorer implements ExtremesStorer {
  public writes: Array<{ key: string; value: string }> = [];

  setItem(key: string, value: string): void {
    this.writes.push({ key, value });
  }
}

describe('fetchPersistExtremes', () => {
  it('fetches, maps, and persists tide extremes via injected storer', async () => {
    const storer = new FakeExtremesStorer();
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

    const result = await fetchPersistExtremes({
      lat: 50.8,
      lon: -1.1,
      baseUrl: 'https://example.test',
      fetchImpl,
      storer,
      storageKey: EXTREMES_SNAPSHOT_KEY
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
        key: EXTREMES_SNAPSHOT_KEY,
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
    const storer = new FakeExtremesStorer();
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

    await fetchPersistExtremes({
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

  it('propagates ProxyQuotaExhaustedError without persisting a snapshot', async () => {
    const storer = new FakeExtremesStorer();
    const fetchImpl = vi.fn<typeof fetch>(async () => {
      return new Response(
        JSON.stringify({
          error: {
            code: 'UPSTREAM_CREDITS_EXHAUSTED',
            message: 'Monthly API credits exhausted'
          }
        }),
        { status: 503, headers: { 'Content-Type': 'application/json' } }
      );
    });

    await expect(
      fetchPersistExtremes({
        lat: 50.8,
        lon: -1.1,
        baseUrl: 'https://example.test',
        fetchImpl,
        storer,
        storageKey: EXTREMES_SNAPSHOT_KEY
      })
    ).rejects.toBeInstanceOf(ProxyQuotaExhaustedError);

    expect(storer.writes).toHaveLength(0);
  });
});
