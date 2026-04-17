import { describe, expect, it } from "vitest";
import {
  effectiveSearchStringFromLocationParts,
  homeRouteDevDebugFlagsFromSearch,
} from "./homeRouteUrlQuery";

describe("effectiveSearchStringFromLocationParts", () => {
  it("prefers location.search when non-empty", () => {
    expect(
      effectiveSearchStringFromLocationParts(
        "?a=1",
        "#/route?b=2",
      ),
    ).toBe("?a=1");
  });

  it("uses the hash query segment when search is empty", () => {
    expect(
      effectiveSearchStringFromLocationParts("", "#/home?diagramPreview=x"),
    ).toBe("?diagramPreview=x");
  });

  it("returns empty string when neither search nor hash carries a query", () => {
    expect(effectiveSearchStringFromLocationParts("", "")).toBe("");
    expect(effectiveSearchStringFromLocationParts("", "#/path")).toBe("");
  });
});

describe("homeRouteDevDebugFlagsFromSearch", () => {
  it("reads dom, outline, and preview-frame toggles", () => {
    expect(homeRouteDevDebugFlagsFromSearch("?dom&outline&pf")).toEqual({
      domDump: true,
      outline: true,
      previewFrame: true,
    });
  });

  it("treats absent flags as false", () => {
    expect(homeRouteDevDebugFlagsFromSearch("")).toEqual({
      domDump: false,
      outline: false,
      previewFrame: false,
    });
    expect(homeRouteDevDebugFlagsFromSearch("?other=1")).toEqual({
      domDump: false,
      outline: false,
      previewFrame: false,
    });
  });
});
