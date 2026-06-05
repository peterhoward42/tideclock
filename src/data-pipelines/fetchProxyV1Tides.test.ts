import { describe, expect, it } from 'vitest';
import { fetchProxyV1Tides } from './fetchProxyV1Tides';
import { ProxyQuotaExhaustedError, type TideProxyV1Response } from './proxyV1Types';
import { jsonResponse, RecordingFetch } from './recordingFetch.test-support';

const baseParams = {
  lat: 50.8,
  lon: -1.1,
  baseUrl: 'https://example.test'
} as const;

describe('fetchProxyV1Tides', () => {
  it('returns parsed JSON on success', async () => {
    const responsePayload: TideProxyV1Response = {
      tides: [{ type: 'High', time: '2026-03-23T00:40:00Z', heightMetres: 3.2 }],
      datum: 'CD',
      windowStart: '2026-03-23T00:00:00Z',
      expiresAt: '2026-03-23T12:00:00Z',
      attribution: 'Example source'
    };

    const fetch = new RecordingFetch(() => jsonResponse(responsePayload));

    const result = await fetchProxyV1Tides({ ...baseParams, fetchImpl: fetch.fetch });
    expect(result).toEqual(responsePayload);
  });

  it('throws ProxyQuotaExhaustedError on 503 with UPSTREAM_CREDITS_EXHAUSTED', async () => {
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

    await expect(
      fetchProxyV1Tides({ ...baseParams, fetchImpl: fetch.fetch })
    ).rejects.toBeInstanceOf(ProxyQuotaExhaustedError);

    await expect(
      fetchProxyV1Tides({ ...baseParams, fetchImpl: fetch.fetch })
    ).rejects.toMatchObject({
      code: 'UPSTREAM_CREDITS_EXHAUSTED',
      status: 503,
      message: 'Monthly API credits exhausted'
    });
  });

  it('throws generic Error on 503 with a different error code', async () => {
    const fetch = new RecordingFetch(() =>
      jsonResponse(
        {
          error: {
            code: 'INTERNAL_ERROR',
            message: 'WorldTides API key is not configured'
          }
        },
        503
      )
    );

    await expect(
      fetchProxyV1Tides({ ...baseParams, fetchImpl: fetch.fetch })
    ).rejects.toThrow('Tide proxy request failed (503): WorldTides API key is not configured');
    await expect(
      fetchProxyV1Tides({ ...baseParams, fetchImpl: fetch.fetch })
    ).rejects.not.toBeInstanceOf(ProxyQuotaExhaustedError);
  });

  it('throws generic Error when quota code appears on a non-503 status', async () => {
    const fetch = new RecordingFetch(() =>
      jsonResponse(
        {
          error: {
            code: 'UPSTREAM_CREDITS_EXHAUSTED',
            message: 'Monthly API credits exhausted'
          }
        },
        502
      )
    );

    await expect(
      fetchProxyV1Tides({ ...baseParams, fetchImpl: fetch.fetch })
    ).rejects.toThrow('Tide proxy request failed (502): Monthly API credits exhausted');
    await expect(
      fetchProxyV1Tides({ ...baseParams, fetchImpl: fetch.fetch })
    ).rejects.not.toBeInstanceOf(ProxyQuotaExhaustedError);
  });

  it('throws generic Error when error body is malformed', async () => {
    const fetch = new RecordingFetch(() =>
      jsonResponse({ error: { code: 'UPSTREAM_ERROR' } }, 502)
    );

    await expect(
      fetchProxyV1Tides({ ...baseParams, fetchImpl: fetch.fetch })
    ).rejects.toThrow('Tide proxy request failed (502).');
  });
});
