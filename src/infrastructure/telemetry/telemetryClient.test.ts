import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { buildTelemetryPayload } from './telemetryPayload';
import { postTelemetryEvent } from './telemetryClient';
import {
  emitTelemetry,
  emitTelemetryError,
  setEmitTelemetryDepsForTests
} from './emitTelemetry';

const PROXY_USER_ID = '01ARZ3NDEKTSV4RRFFQ69G5FAV';
const EVENT_ID = '550e8400-e29b-41d4-a716-446655440000';
const OCCURRED_AT = '2026-06-02T12:00:00.000Z';

describe('buildTelemetryPayload', () => {
  it('builds a non-error payload without errorQualification', () => {
    expect(
      buildTelemetryPayload({
        type: 'loaded',
        proxyUserId: PROXY_USER_ID,
        eventId: EVENT_ID,
        occurredAt: OCCURRED_AT
      })
    ).toEqual({
      eventId: EVENT_ID,
      type: 'loaded',
      occurredAt: OCCURRED_AT,
      proxyUserId: PROXY_USER_ID
    });
  });

  it('requires errorQualification for error events', () => {
    expect(() =>
      buildTelemetryPayload({
        type: 'error',
        proxyUserId: PROXY_USER_ID,
        eventId: EVENT_ID,
        occurredAt: OCCURRED_AT
      })
    ).toThrow(/errorQualification/);
  });

  it('rejects errorQualification on non-error events', () => {
    expect(() =>
      buildTelemetryPayload({
        type: 'loaded',
        proxyUserId: PROXY_USER_ID,
        eventId: EVENT_ID,
        occurredAt: OCCURRED_AT,
        errorQualification: 'tide_load_failed'
      })
    ).toThrow(/only valid when type is "error"/);
  });
});

describe('postTelemetryEvent', () => {
  it('POSTs JSON to v1/events under the configured base URL', async () => {
    const fetchImpl = vi.fn(async () => new Response(null, { status: 204 }));
    await postTelemetryEvent({
      baseUrl: 'https://telemetry.example.com',
      fetchImpl,
      payload: {
        eventId: EVENT_ID,
        type: 'loaded',
        occurredAt: OCCURRED_AT,
        proxyUserId: PROXY_USER_ID
      }
    });

    expect(fetchImpl).toHaveBeenCalledOnce();
    const [url, init] = fetchImpl.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://telemetry.example.com/v1/events');
    expect(init.method).toBe('POST');
    expect(init.headers).toMatchObject({
      Accept: 'application/json',
      'Content-Type': 'application/json'
    });
    expect(JSON.parse(String(init.body))).toEqual({
      eventId: EVENT_ID,
      type: 'loaded',
      occurredAt: OCCURRED_AT,
      proxyUserId: PROXY_USER_ID
    });
  });

  it('no-ops when base URL is empty', async () => {
    const fetchImpl = vi.fn(async () => new Response(null, { status: 204 }));
    await postTelemetryEvent({
      baseUrl: '',
      fetchImpl,
      payload: {
        eventId: EVENT_ID,
        type: 'loaded',
        occurredAt: OCCURRED_AT,
        proxyUserId: PROXY_USER_ID
      }
    });
    expect(fetchImpl).not.toHaveBeenCalled();
  });
});

describe('emitTelemetry with injected deps', () => {
  let fetchImpl: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchImpl = vi.fn(async () => new Response(null, { status: 204 }));
    setEmitTelemetryDepsForTests({
      baseUrl: 'https://telemetry.example.com',
      fetchImpl,
      proxyUserId: PROXY_USER_ID,
      mintEventId: () => EVENT_ID,
      nowIsoUtc: () => OCCURRED_AT
    });
  });

  afterEach(() => {
    setEmitTelemetryDepsForTests(undefined);
  });

  it('posts a product event', () => {
    emitTelemetry('visited_story');
    expect(fetchImpl).toHaveBeenCalledOnce();
  });

  it('posts an error event with qualification', () => {
    emitTelemetryError('tide_load_failed');
    expect(fetchImpl).toHaveBeenCalledOnce();
    const init = fetchImpl.mock.calls[0]?.[1] as RequestInit;
    expect(JSON.parse(String(init.body))).toEqual({
      eventId: EVENT_ID,
      type: 'error',
      occurredAt: OCCURRED_AT,
      proxyUserId: PROXY_USER_ID,
      errorQualification: 'tide_load_failed'
    });
  });

  it('no-ops without proxy user id', () => {
    setEmitTelemetryDepsForTests({
      baseUrl: 'https://telemetry.example.com',
      fetchImpl,
      proxyUserId: undefined,
      mintEventId: () => EVENT_ID,
      nowIsoUtc: () => OCCURRED_AT
    });
    emitTelemetry('loaded');
    expect(fetchImpl).not.toHaveBeenCalled();
  });
});
