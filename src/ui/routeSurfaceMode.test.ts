import { describe, expect, it } from "vitest";

import { surfaceModeForRoute, type AppRouteId } from "./routeSurfaceMode";

describe("surfaceModeForRoute", () => {
  it("maps home route to appliance mode", () => {
    expect(surfaceModeForRoute("home")).toBe("appliance");
  });

  it("maps all non-home routes to document mode", () => {
    const documentRoutes: AppRouteId[] = [
      "location",
      "about",
      "install",
      "onwall",
      "story",
      "tidenerd",
      "installconfig",
      "entertainment",
      "contact",
    ];
    for (const routeId of documentRoutes) {
      expect(surfaceModeForRoute(routeId)).toBe("document");
    }
  });
});
