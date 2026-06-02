/**
 * telemetryClient.ts — Fire-and-forget POST of telemetry payloads to the ingest API.
 * Kind: Adapter / boundary (HTTP). Does not decide when to emit events.
 */

import type { TelemetryEventPayload } from './telemetryPayload';

export interface PostTelemetryEventInput {
  readonly baseUrl: string;
  readonly payload: TelemetryEventPayload;
  readonly fetchImpl: typeof fetch;
}

/**
 * POSTs one event to `${baseUrl}/v1/events`.
 * Swallows network and parse failures — telemetry must never surface to the user.
 */
export async function postTelemetryEvent({
  baseUrl,
  payload,
  fetchImpl
}: PostTelemetryEventInput): Promise<void> {
  if (typeof baseUrl !== 'string' || baseUrl.trim() === '') {
    return;
  }

  const baseWithSlash = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
  const endpoint = new URL('v1/events', baseWithSlash);

  try {
    await fetchImpl(endpoint.toString(), {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload),
      keepalive: true
    });
  } catch {
    // Silent by design: telemetry is best-effort.
  }
}
