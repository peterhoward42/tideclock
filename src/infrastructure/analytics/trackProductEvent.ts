/**
 * trackProductEvent.ts — Vercel Web Analytics wrapper for product custom events.
 * Kind: Adapter / boundary. Injects the analytics script in production; never throws on track failures.
 */

import { inject, track } from '@vercel/analytics';
import type { TelemetryErrorEventParam } from './errorEventParam';
import type { TelemetryEventType } from './eventType';

type ProductEventProperties = Record<
  string,
  string | number | boolean | null | undefined
>;

let injectCalled = false;

function warnAnalyticsFailure(context: string): void {
  console.warn('[tideclock] analytics', context);
}

/**
 * Loads the Vercel Web Analytics script once. No-op outside production builds.
 */
export function injectProductAnalytics(): void {
  if (!import.meta.env.PROD || injectCalled) {
    return;
  }
  injectCalled = true;

  try {
    inject();
  } catch {
    warnAnalyticsFailure('inject');
  }
}

/**
 * Records one custom event. Swallows SDK failures so telemetry never affects UX.
 */
export function trackProductEvent(
  name: TelemetryEventType,
  properties?: ProductEventProperties
): void {
  try {
    track(name, properties);
  } catch {
    warnAnalyticsFailure(name);
  }
}

/** Shorthand for `trackProductEvent('error', { reason })`. */
export function trackProductError(reason: TelemetryErrorEventParam): void {
  trackProductEvent('error', { reason });
}
