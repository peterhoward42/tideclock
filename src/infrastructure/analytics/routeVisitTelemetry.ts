/**
 * routeVisitTelemetry.ts — Maps hash route ids to visit analytics events.
 * Kind: Application helper. Does not subscribe to the router.
 */

import { trackProductEvent } from './trackProductEvent';
import type { TelemetryEventType } from './eventType';

type VisitTelemetryRoute =
  | 'install'
  | 'installconfig'
  | 'onwall'
  | 'story'
  | 'tidenerd'
  | 'maker'
  | 'drawexact'
  | 'about'
  | 'entertainment'
  | 'contact';

const ROUTE_VISIT_EVENT: Record<VisitTelemetryRoute, TelemetryEventType> = {
  install: 'visited_install',
  installconfig: 'visited_install_config',
  onwall: 'visited_stick_on_wall',
  story: 'visited_story',
  tidenerd: 'visited_tide_nerd',
  maker: 'visited_maker',
  drawexact: 'visited_drawexact',
  about: 'visited_about',
  entertainment: 'visited_entertainment',
  contact: 'visited_contact'
};

/** Records a route visit event when the route has a mapped analytics type. */
export function emitRouteVisitTelemetry(routeId: string): void {
  if (!(routeId in ROUTE_VISIT_EVENT)) {
    return;
  }
  trackProductEvent(ROUTE_VISIT_EVENT[routeId as VisitTelemetryRoute]);
}
