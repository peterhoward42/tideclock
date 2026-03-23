import { describe, expect, it } from 'vitest';
import { TideExtremesAtLocation } from '../core-models/TideExtremesAtLocation';
import {
  buildTideExtremesAtLocationFromTideProxyV1Response,
  TideProxyV1BuildError
} from './toTideExtremes';
import type { TideProxyV1Response } from './TideProxyV1Response';

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

describe('buildTideExtremesAtLocationFromTideProxyV1Response', () => {
  it('builds a TideExtremesAtLocation from a valid proxy payload', () => {
    const result = buildTideExtremesAtLocationFromTideProxyV1Response({
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

  it('throws when latitude is invalid', () => {
    expect(() =>
      buildTideExtremesAtLocationFromTideProxyV1Response({
        latitude: 100,
        longitude: -1.1,
        response: makeResponse()
      })
    ).toThrowError(new TideProxyV1BuildError('Invalid latitude "100". Expected a number in [-90, 90].'));
  });

  it('throws when tides is not an array', () => {
    expect(() =>
      buildTideExtremesAtLocationFromTideProxyV1Response({
        latitude: 50.8,
        longitude: -1.1,
        response: {
          ...makeResponse(),
          tides: undefined as unknown as TideProxyV1Response['tides']
        }
      })
    ).toThrowError(
      new TideProxyV1BuildError('Invalid tide proxy response. Expected "tides" to be an array.')
    );
  });

  it('throws when an extreme type is not supported', () => {
    expect(() =>
      buildTideExtremesAtLocationFromTideProxyV1Response({
        latitude: 50.8,
        longitude: -1.1,
        response: makeResponse({
          tides: [{ type: 'NOPE' as unknown as 'High', time: '2026-03-23T00:40:00Z', heightMetres: 3.2 }]
        })
      })
    ).toThrowError(
      new TideProxyV1BuildError('Invalid tide extreme type "NOPE". Expected "High" or "Low".')
    );
  });

  it('throws when an extreme timestamp is malformed', () => {
    expect(() =>
      buildTideExtremesAtLocationFromTideProxyV1Response({
        latitude: 50.8,
        longitude: -1.1,
        response: makeResponse({
          tides: [{ type: 'High', time: 'not-a-time', heightMetres: 3.2 }]
        })
      })
    ).toThrowError(
      new TideProxyV1BuildError(
        'Invalid tide extreme time "not-a-time" at index 0. Expected an ISO-8601 timestamp.'
      )
    );
  });

  it('throws when an extreme height is not finite', () => {
    expect(() =>
      buildTideExtremesAtLocationFromTideProxyV1Response({
        latitude: 50.8,
        longitude: -1.1,
        response: makeResponse({
          tides: [{ type: 'High', time: '2026-03-23T00:40:00Z', heightMetres: NaN }]
        })
      })
    ).toThrowError(
      new TideProxyV1BuildError(
        'Invalid tide extreme heightMetres at index 0. Expected a finite number.'
      )
    );
  });
});
