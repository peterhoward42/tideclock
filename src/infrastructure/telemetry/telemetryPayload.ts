/**
 * telemetryPayload.ts — JSON body shape POSTed to the telemetry ingest API.
 * Kind: Definition / boundary contract. Does not perform HTTP.
 */

import type { TelemetryEventType } from './eventType';
import type { ProxyUserId } from '../proxyUserId';

const MAX_EVENT_PARAMS_LENGTH = 200;

function truncateEventParams(value: string): string {
  return value.length <= MAX_EVENT_PARAMS_LENGTH
    ? value
    : value.slice(0, MAX_EVENT_PARAMS_LENGTH);
}

/** One client telemetry event — flat record, no nested context objects. */
export interface TelemetryEventPayload {
  readonly eventId: string;
  readonly type: TelemetryEventType;
  readonly occurredAt: string;
  readonly proxyUserId: ProxyUserId;
  readonly eventParams?: string;
}

export interface BuildTelemetryPayloadInput {
  readonly type: TelemetryEventType;
  readonly proxyUserId: ProxyUserId;
  readonly eventId: string;
  readonly occurredAt: string;
  readonly eventParams?: string;
}

/** Assembles the ingest body; truncates `eventParams` when present. */
export function buildTelemetryPayload(
  input: BuildTelemetryPayloadInput
): TelemetryEventPayload {
  const base = {
    eventId: input.eventId,
    type: input.type,
    occurredAt: input.occurredAt,
    proxyUserId: input.proxyUserId
  };

  if (input.eventParams === undefined) {
    return base;
  }

  return {
    ...base,
    eventParams: truncateEventParams(input.eventParams)
  };
}
