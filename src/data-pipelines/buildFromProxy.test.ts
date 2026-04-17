import { describe, expect, it } from 'vitest';
import { TideExtremesAtLocation } from '../core-models/TideExtremesAtLocation';
import { buildExtremesFromProxy, ProxyV1BuildError } from './buildFromProxy';
import type { TideProxyV1Response } from './proxyV1Types';

function makeResponse(overrides?: Partial<TideProxyV1Response>): TideProxyV1Response {
  return {
    tides: [
      { type: 'High', time: '2026-03-23T00:40:00Z', heightMetres: 3.2 },
      { type: 'Low', time: '2026-03-23T07:05:00Z', heightMetres: 0.4 }
    ],
    datum: 'CD',
    windowStart: '2026-03-23T00:00:00Z',
    expiresAt: '2026-03-23T12:00:00Z',
    attribution: 'Example source',
    ...overrides
  };
}

describe('buildExtremesFromProxy', () => {
  it('builds a TideExtremesAtLocation from a valid proxy payload', () => {
    const result = buildExtremesFromProxy({
      latitude: 50.8,
      longitude: -1.1,
      response: makeResponse()
    });

    expect(result).toBeInstanceOf(TideExtremesAtLocation);
    expect(result.latitude).toBe(50.8);
    expect(result.longitude).toBe(-1.1);
    expect(result.extremes).toEqual([
      { type: 'high', timeUtc: '2026-03-23T00:40:00Z', heightMetres: 3.2 },
      { type: 'low', timeUtc: '2026-03-23T07:05:00Z', heightMetres: 0.4 }
    ]);
  });

  it('canonicalizes proxy rows into ascending UTC order', () => {
    const result = buildExtremesFromProxy({
      latitude: 50.8,
      longitude: -1.1,
      response: makeResponse({
        tides: [
          { type: 'Low', time: '2026-03-23T07:05:00Z', heightMetres: 0.4 },
          { type: 'High', time: '2026-03-23T00:40:00Z', heightMetres: 3.2 }
        ]
      })
    });

    expect(result.extremes.map((e) => e.timeUtc)).toEqual([
      '2026-03-23T00:40:00Z',
      '2026-03-23T07:05:00Z'
    ]);
  });

  it('throws when latitude is invalid', () => {
    expect(() =>
      buildExtremesFromProxy({
        latitude: 100,
        longitude: -1.1,
        response: makeResponse()
      })
    ).toThrowError(new ProxyV1BuildError('Invalid latitude "100". Expected a number in [-90, 90].'));
  });

  it('throws when tides is not an array', () => {
    expect(() =>
      buildExtremesFromProxy({
        latitude: 50.8,
        longitude: -1.1,
        response: {
          ...makeResponse(),
          tides: undefined as unknown as TideProxyV1Response['tides']
        }
      })
    ).toThrowError(
      new ProxyV1BuildError('Invalid tide proxy response. Expected "tides" to be an array.')
    );
  });

  it('throws when an extreme type is not supported', () => {
    expect(() =>
      buildExtremesFromProxy({
        latitude: 50.8,
        longitude: -1.1,
        response: makeResponse({
          tides: [{ type: 'NOPE' as unknown as 'High', time: '2026-03-23T00:40:00Z', heightMetres: 3.2 }]
        })
      })
    ).toThrowError(
      new ProxyV1BuildError('Invalid tide extreme type "NOPE". Expected "High" or "Low".')
    );
  });

  it('throws when an extreme timestamp is malformed', () => {
    expect(() =>
      buildExtremesFromProxy({
        latitude: 50.8,
        longitude: -1.1,
        response: makeResponse({
          tides: [{ type: 'High', time: 'not-a-time', heightMetres: 3.2 }]
        })
      })
    ).toThrowError(
      new ProxyV1BuildError(
        'Invalid tide extreme time "not-a-time" at index 0. Expected an ISO-8601 timestamp.'
      )
    );
  });

  it('throws when an extreme height is not finite', () => {
    expect(() =>
      buildExtremesFromProxy({
        latitude: 50.8,
        longitude: -1.1,
        response: makeResponse({
          tides: [{ type: 'High', time: '2026-03-23T00:40:00Z', heightMetres: NaN }]
        })
      })
    ).toThrowError(
      new ProxyV1BuildError(
        'Invalid tide extreme heightMetres at index 0. Expected a finite number.'
      )
    );
  });

  it('throws when a tide entry is not an object', () => {
    expect(() =>
      buildExtremesFromProxy({
        latitude: 50.8,
        longitude: -1.1,
        response: makeResponse({
          tides: [null as unknown as TideProxyV1Response['tides'][number]]
        })
      })
    ).toThrowError(
      new ProxyV1BuildError(
        'Invalid tide extreme at index 0. Expected an object with type, time, and heightMetres.'
      )
    );
  });
});
