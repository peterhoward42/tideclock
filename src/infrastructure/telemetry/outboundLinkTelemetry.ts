/**
 * outboundLinkTelemetry.ts — Classify off-site anchors for click-through telemetry.
 * Kind: Application helper. Coffee is Story-route only (enforced at call site).
 */

import { VIRTUAL_COFFEE_URL } from '../../support';

export const DRAWEXACT_URL = 'https://www.drawexact.click/';

export function isCoffeeOutboundHref(href: string): boolean {
  try {
    const url = new URL(href);
    const coffee = new URL(VIRTUAL_COFFEE_URL);
    return url.origin === coffee.origin && url.pathname.replace(/\/$/, '') === coffee.pathname.replace(/\/$/, '');
  } catch {
    return false;
  }
}

export function isDrawExactOutboundHref(href: string): boolean {
  try {
    const url = new URL(href);
    const drawExact = new URL(DRAWEXACT_URL);
    return url.origin === drawExact.origin;
  } catch {
    return false;
  }
}
