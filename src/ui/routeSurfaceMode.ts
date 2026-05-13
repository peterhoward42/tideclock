/**
 * Route-level surface context for app shell styling.
 * Home is the appliance surface; every other route is document mode.
 */
export type AppRouteId =
  | "home"
  | "location"
  | "settings"
  | "about"
  | "acknowledgements"
  | "support"
  | "cookies";

export type SurfaceMode = "appliance" | "document";

export function surfaceModeForRoute(routeId: AppRouteId): SurfaceMode {
  return routeId === "home" ? "appliance" : "document";
}
