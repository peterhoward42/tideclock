/**
 * Route-level surface context for app shell styling.
 * Home is the appliance surface; every other route is document mode.
 */
export type AppRouteId =
  | "home"
  | "location"
  | "about"
  | "install"
  | "onwall"
  | "story"
  | "tidenerd"
  | "installconfig"
  | "entertainment"
  | "contact";

export type SurfaceMode = "appliance" | "document";

export function surfaceModeForRoute(routeId: AppRouteId): SurfaceMode {
  return routeId === "home" ? "appliance" : "document";
}
