import { describe, expect, it } from "vitest";

import { buildRouteShareUrl } from "./routeShareUrl";

describe("buildRouteShareUrl", () => {
  it("uses production origin in prod builds", () => {
    expect(buildRouteShareUrl("story")).toBe(
      "https://thetidedial.page/#/story",
    );
    expect(buildRouteShareUrl("tidenerd")).toBe(
      "https://thetidedial.page/#/tidenerd",
    );
    expect(buildRouteShareUrl("drawexact")).toBe(
      "https://thetidedial.page/#/drawexact",
    );
  });
});
