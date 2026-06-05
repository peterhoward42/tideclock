import { describe, expect, it } from 'vitest';
import { TideExtreme } from '../core-models/TideExtreme';
import { TideExtremesAtLocation } from '../core-models/TideExtremesAtLocation';
import { EXTREMES_SNAPSHOT_KEY, type ExtremesLoader, type ExtremesStorer } from '../data-pipelines/extremesSnapshot';
import type { TideProxyV1Response } from '../data-pipelines/proxyV1Types';
import { jsonResponse, RecordingFetch } from '../data-pipelines/recordingFetch.test-support';
import type { TimeNowProvider } from '../time-services/civilDayWindow';
import {
  createQuotaSessionGate,
  loadCivilDayExtremes,
  type QuotaSessionGate
} from './civilDayExtremesQuery';
import { ProxyQuotaExhaustedError } from '../data-pipelines/proxyV1Types';

class FakeTimeNowProvider implements TimeNowProvider {
  constructor(private readonly fixedNow: Date) {}

  now(): Date {
    return new Date(this.fixedNow.getTime());
  }
}

function utcIsoForLocal(year: number, monthIndex: number, day: number, hour: number, minute: number): string {
  return new Date(year, monthIndex, day, hour, minute, 0, 0).toISOString();
}

class FakeExtremesLoader implements ExtremesLoader {
  constructor(private readonly byKey: Record<string, string | null>) {}

  getItem(key: string): string | null {
    return this.byKey[key] ?? null;
  }
}

class FakeExtremesStorer implements ExtremesStorer {
  writes: Array<{ key: string; value: string }> = [];

  setItem(key: string, value: string): void {
    this.writes.push({ key, value });
  }
}

function queryDeps(
  partial: Omit<Parameters<typeof loadCivilDayExtremes>[2], 'quotaSession'> & {
    quotaSession?: QuotaSessionGate;
  }
): Parameters<typeof loadCivilDayExtremes>[2] {
  const { quotaSession, ...rest } = partial;
  return {
    quotaSession: quotaSession ?? createQuotaSessionGate(),
    ...rest
  };
}

describe('loadCivilDayExtremes', () => {
  const timeNowProvider = new FakeTimeNowProvider(new Date(2026, 2, 23, 10, 30, 0, 0));

  it('returns from store without calling fetch when the snapshot satisfies the query', async () => {
    const storer = new FakeExtremesStorer();
    const loader = new FakeExtremesLoader({
      [EXTREMES_SNAPSHOT_KEY]: JSON.stringify({
        latitude: 50.8,
        longitude: -1.1,
        extremes: [
          { type: 'high', timeUtc: utcIsoForLocal(2026, 2, 22, 23, 40), heightMetres: 3.1 },
          { type: 'low', timeUtc: utcIsoForLocal(2026, 2, 23, 0, 0), heightMetres: 0.5 },
          { type: 'high', timeUtc: utcIsoForLocal(2026, 2, 23, 12, 10), heightMetres: 3.3 },
          { type: 'high', timeUtc: utcIsoForLocal(2026, 2, 24, 0, 20), heightMetres: 3.0 }
        ]
      })
    });

    const fetch = new RecordingFetch(() => {
      throw new Error('fetch should not run when store satisfies query');
    });

    const result = await loadCivilDayExtremes(
      50.8,
      -1.1,
      queryDeps({
        loader,
        storer,
        baseUrl: 'https://example.test',
        fetchImpl: fetch.fetch,
        timeNowProvider
      })
    );

    expect(fetch.calls).toHaveLength(0);
    expect(storer.writes).toHaveLength(0);
    expect(result).toEqual(
      TideExtremesAtLocation.fromPossiblyUnordered(50.8, -1.1, [
        new TideExtreme('low', utcIsoForLocal(2026, 2, 23, 0, 0), 0.5),
        new TideExtreme('high', utcIsoForLocal(2026, 2, 23, 12, 10), 3.3)
      ])
    );
  });

  it('fetches, persists, and returns civil-day extremes when the store does not satisfy', async () => {
    const storer = new FakeExtremesStorer();
    const loader = new FakeExtremesLoader({
      [EXTREMES_SNAPSHOT_KEY]: null
    });

    const responsePayload: TideProxyV1Response = {
      tides: [
        { type: 'High', time: utcIsoForLocal(2026, 2, 22, 23, 45), heightMetres: 3.0 },
        { type: 'Low', time: utcIsoForLocal(2026, 2, 23, 6, 0), heightMetres: 0.4 },
        { type: 'High', time: utcIsoForLocal(2026, 2, 23, 18, 0), heightMetres: 3.2 },
        { type: 'Low', time: utcIsoForLocal(2026, 2, 24, 0, 30), heightMetres: 0.5 }
      ],
      datum: 'CD',
      windowStart: '2026-03-23T00:00:00Z',
      expiresAt: '2026-03-23T12:00:00Z',
      attribution: 'Test'
    };

    const fetch = new RecordingFetch(() => jsonResponse(responsePayload));

    const result = await loadCivilDayExtremes(
      50.8,
      -1.1,
      queryDeps({
        loader,
        storer,
        baseUrl: 'https://example.test',
        fetchImpl: fetch.fetch,
        timeNowProvider
      })
    );

    expect(fetch.calls).toHaveLength(1);
    expect(storer.writes).toHaveLength(1);
    expect(storer.writes[0]?.key).toBe(EXTREMES_SNAPSHOT_KEY);
    expect(result).toEqual(
      TideExtremesAtLocation.fromPossiblyUnordered(50.8, -1.1, [
        new TideExtreme('low', utcIsoForLocal(2026, 2, 23, 6, 0), 0.4),
        new TideExtreme('high', utcIsoForLocal(2026, 2, 23, 18, 0), 3.2)
      ])
    );
  });

  it('uses a custom storageKey for load and persist when provided', async () => {
    const customKey = 'tideclock-test-snapshot-key';
    const storer = new FakeExtremesStorer();
    const loader = new FakeExtremesLoader({
      [customKey]: null
    });

    const responsePayload: TideProxyV1Response = {
      tides: [
        { type: 'High', time: utcIsoForLocal(2026, 2, 22, 23, 45), heightMetres: 3.0 },
        { type: 'High', time: utcIsoForLocal(2026, 2, 23, 18, 0), heightMetres: 3.2 },
        { type: 'Low', time: utcIsoForLocal(2026, 2, 24, 0, 30), heightMetres: 0.5 }
      ],
      datum: 'CD',
      windowStart: '2026-03-23T00:00:00Z',
      expiresAt: '2026-03-23T12:00:00Z',
      attribution: 'Test'
    };

    const fetch = new RecordingFetch(() => jsonResponse(responsePayload));

    const result = await loadCivilDayExtremes(
      50.8,
      -1.1,
      queryDeps({
        loader,
        storer,
        baseUrl: 'https://example.test',
        fetchImpl: fetch.fetch,
        storageKey: customKey,
        timeNowProvider
      })
    );

    expect(fetch.calls).toHaveLength(1);
    expect(storer.writes).toEqual([{ key: customKey, value: expect.any(String) }]);
    expect(result).toEqual(
      TideExtremesAtLocation.fromPossiblyUnordered(50.8, -1.1, [
        new TideExtreme('high', utcIsoForLocal(2026, 2, 23, 18, 0), 3.2)
      ])
    );
  });

  it('bypasses store and fetches when session quota is already exhausted', async () => {
    const storer = new FakeExtremesStorer();
    const loader = new FakeExtremesLoader({
      [EXTREMES_SNAPSHOT_KEY]: JSON.stringify({
        latitude: 50.8,
        longitude: -1.1,
        extremes: [
          { type: 'high', timeUtc: utcIsoForLocal(2026, 2, 22, 23, 40), heightMetres: 3.1 },
          { type: 'low', timeUtc: utcIsoForLocal(2026, 2, 23, 0, 0), heightMetres: 0.5 },
          { type: 'high', timeUtc: utcIsoForLocal(2026, 2, 23, 12, 10), heightMetres: 3.3 }
        ]
      })
    });

    const responsePayload: TideProxyV1Response = {
      tides: [
        { type: 'High', time: utcIsoForLocal(2026, 2, 22, 23, 45), heightMetres: 3.0 },
        { type: 'Low', time: utcIsoForLocal(2026, 2, 23, 6, 0), heightMetres: 0.4 },
        { type: 'High', time: utcIsoForLocal(2026, 2, 23, 18, 0), heightMetres: 3.2 },
        { type: 'Low', time: utcIsoForLocal(2026, 2, 24, 0, 30), heightMetres: 0.5 }
      ],
      datum: 'CD',
      windowStart: '2026-03-23T00:00:00Z',
      expiresAt: '2026-03-23T12:00:00Z',
      attribution: 'Test'
    };

    const fetch = new RecordingFetch(() => jsonResponse(responsePayload));

    const quotaSession = createQuotaSessionGate();
    quotaSession.setSessionQuotaExhausted();

    const result = await loadCivilDayExtremes(
      50.8,
      -1.1,
      queryDeps({
        loader,
        storer,
        baseUrl: 'https://example.test',
        fetchImpl: fetch.fetch,
        timeNowProvider,
        quotaSession
      })
    );

    expect(fetch.calls).toHaveLength(1);
    expect(result).toEqual(
      TideExtremesAtLocation.fromPossiblyUnordered(50.8, -1.1, [
        new TideExtreme('low', utcIsoForLocal(2026, 2, 23, 6, 0), 0.4),
        new TideExtreme('high', utcIsoForLocal(2026, 2, 23, 18, 0), 3.2)
      ])
    );
  });

  it('sets session quota and propagates ProxyQuotaExhaustedError without using store', async () => {
    const storer = new FakeExtremesStorer();
    const loader = new FakeExtremesLoader({
      [EXTREMES_SNAPSHOT_KEY]: JSON.stringify({
        latitude: 50.8,
        longitude: -1.1,
        extremes: [
          { type: 'low', timeUtc: utcIsoForLocal(2026, 2, 23, 0, 0), heightMetres: 0.5 },
          { type: 'high', timeUtc: utcIsoForLocal(2026, 2, 23, 12, 10), heightMetres: 3.3 }
        ]
      })
    });

    const fetch = new RecordingFetch(() =>
      jsonResponse(
        {
          error: {
            code: 'UPSTREAM_CREDITS_EXHAUSTED',
            message: 'Monthly API credits exhausted'
          }
        },
        503
      )
    );

    const quotaSession = createQuotaSessionGate();

    await expect(
      loadCivilDayExtremes(
        50.8,
        -1.1,
        queryDeps({
          loader,
          storer,
          baseUrl: 'https://example.test',
          fetchImpl: fetch.fetch,
          timeNowProvider,
          quotaSession
        })
      )
    ).rejects.toBeInstanceOf(ProxyQuotaExhaustedError);

    expect(fetch.calls).toHaveLength(1);
    expect(storer.writes).toHaveLength(0);
    expect(quotaSession.isSessionQuotaExhausted()).toBe(true);
  });
});
