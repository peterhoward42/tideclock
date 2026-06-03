/**
 * routeVisitTelemetry.ts — Maps hash route ids to visit telemetry events.
 * Kind: Application helper. Does not subscribe to the router.
 */

import { emitTelemetry } from './emitTelemetry';
import type { TelemetryEventType } from './eventType';

type VisitTelemetryRoute =
  | 'onwall'
  | 'story'
  | 'tidenerd'
  | 'softwarenerd'
  | 'about';

const ROUTE_VISIT_EVENT: Record<VisitTelemetryRoute, TelemetryEventType> = {
  onwall: 'visited_stick_on_wall',
  story: 'visited_story',
  tidenerd: 'visited_tide_nerd',
  softwarenerd: 'visited_sw_nerd',
  about: 'visited_about'
};

/** Emits a route visit event when the route has a mapped telemetry type. */
export function emitRouteVisitTelemetry(routeId: string): void {
  if (!(routeId in ROUTE_VISIT_EVENT)) {
    return;
  }
  emitTelemetry(ROUTE_VISIT_EVENT[routeId as VisitTelemetryRoute]);
}
