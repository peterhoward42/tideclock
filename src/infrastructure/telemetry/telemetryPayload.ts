/**
 * telemetryPayload.ts — JSON body shape POSTed to the telemetry ingest API.
 * Kind: Definition / boundary contract. Does not perform HTTP.
 */

import type { TelemetryErrorQualification } from './errorQualification';
import type { TelemetryEventType } from './eventType';
import type { ProxyUserId } from '../proxyUserId';

/** One client telemetry event — flat record, no nested context objects. */
export interface TelemetryEventPayload {
  readonly eventId: string;
  readonly type: TelemetryEventType;
  readonly occurredAt: string;
  readonly proxyUserId: ProxyUserId;
  /** Present only when `type` is `'error'`. */
  readonly errorQualification?: TelemetryErrorQualification;
}

export interface BuildTelemetryPayloadInput {
  readonly type: TelemetryEventType;
  readonly proxyUserId: ProxyUserId;
  readonly eventId: string;
  readonly occurredAt: string;
  readonly errorQualification?: TelemetryErrorQualification;
}

/** Assembles the ingest body; enforces error events carry a qualification. */
export function buildTelemetryPayload(
  input: BuildTelemetryPayloadInput
): TelemetryEventPayload {
  if (input.type === 'error') {
    if (input.errorQualification === undefined) {
      throw new Error('Telemetry error events require errorQualification.');
    }
    return {
      eventId: input.eventId,
      type: input.type,
      occurredAt: input.occurredAt,
      proxyUserId: input.proxyUserId,
      errorQualification: input.errorQualification
    };
  }

  if (input.errorQualification !== undefined) {
    throw new Error('errorQualification is only valid when type is "error".');
  }

  return {
    eventId: input.eventId,
    type: input.type,
    occurredAt: input.occurredAt,
    proxyUserId: input.proxyUserId
  };
}
