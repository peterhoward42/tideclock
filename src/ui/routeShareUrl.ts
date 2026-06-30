import { TIDE_DIAL_PRODUCTION_ORIGIN } from "./brand";

export type ShareableRouteId = "story" | "tidenerd" | "drawexact";

/** Canonical share URL for an Entertainment curiosity route hash. */
export function buildRouteShareUrl(routeId: ShareableRouteId): string {
  const origin = import.meta.env.PROD
    ? TIDE_DIAL_PRODUCTION_ORIGIN
    : typeof window !== "undefined"
      ? window.location.origin
      : TIDE_DIAL_PRODUCTION_ORIGIN;
  return `${origin}/#/${routeId}`;
}
