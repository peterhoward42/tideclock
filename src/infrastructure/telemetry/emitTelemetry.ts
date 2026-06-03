/**
 * emitTelemetry.ts — Application entry point for client telemetry emission.
 * Kind: Adapter / boundary. Reads boot-time proxy user id; delegates HTTP to {@link postTelemetryEvent}.
 */

import { runtimeProxyUserId } from '../proxyUserId';
import type { TelemetryErrorEventParam } from './errorEventParam';
import type { TelemetryEventType } from './eventType';
import { buildTelemetryPayload } from './telemetryPayload';
import { postTelemetryEvent } from './telemetryClient';

export interface EmitTelemetryDeps {
  readonly baseUrl: string;
  readonly fetchImpl: typeof fetch;
  readonly proxyUserId: string | undefined;
  readonly mintEventId: () => string;
  readonly nowIsoUtc: () => string;
}

function defaultDeps(): EmitTelemetryDeps {
  return {
    baseUrl:
      typeof import.meta.env.VITE_TELEMETRY_BASE_URL === 'string'
        ? import.meta.env.VITE_TELEMETRY_BASE_URL
        : '',
    fetchImpl: fetch,
    proxyUserId: runtimeProxyUserId(),
    mintEventId: () => crypto.randomUUID(),
    nowIsoUtc: () => new Date().toISOString()
  };
}

let depsOverride: EmitTelemetryDeps | undefined;

/** Test seam: replace default env/fetch/time dependencies. */
export function setEmitTelemetryDepsForTests(next: EmitTelemetryDeps | undefined): void {
  depsOverride = next;
}

export interface EmitTelemetryOptions {
  readonly eventParams?: string;
}

/**
 * Enqueues one telemetry event (non-blocking). No-ops when ingest URL or proxy user id is missing.
 */
export function emitTelemetry(
  type: TelemetryEventType,
  options: EmitTelemetryOptions = {}
): void {
  const deps = depsOverride ?? defaultDeps();
  const proxyUserId = deps.proxyUserId;
  if (proxyUserId === undefined || deps.baseUrl.trim() === '') {
    return;
  }

  const payload = buildTelemetryPayload({
    type,
    proxyUserId,
    eventId: deps.mintEventId(),
    occurredAt: deps.nowIsoUtc(),
    eventParams: options.eventParams
  });

  void postTelemetryEvent({
    baseUrl: deps.baseUrl,
    payload,
    fetchImpl: deps.fetchImpl
  });
}

/** Shorthand for `emitTelemetry('error', { eventParams })`. */
export function emitTelemetryError(eventParams: TelemetryErrorEventParam): void {
  emitTelemetry('error', { eventParams });
}
