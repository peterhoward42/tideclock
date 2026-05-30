import { describe, expect, it } from "vitest";
import {
  effectiveSearchFromLocation,
  homeDevDebugFlagsFromSearch,
} from "./homeUrlQuery";

describe("effectiveSearchFromLocation", () => {
  it("prefers location.search when non-empty", () => {
    expect(
      effectiveSearchFromLocation(
        "?a=1",
        "#/route?b=2",
      ),
    ).toBe("?a=1");
  });

  it("uses the hash query segment when search is empty", () => {
    expect(
      effectiveSearchFromLocation("", "#/home?diagramPreview=x"),
    ).toBe("?diagramPreview=x");
  });

  it("returns empty string when neither search nor hash carries a query", () => {
    expect(effectiveSearchFromLocation("", "")).toBe("");
    expect(effectiveSearchFromLocation("", "#/path")).toBe("");
  });
});

describe("homeDevDebugFlagsFromSearch", () => {
  it("reads dom, outline, and preview-frame toggles", () => {
    expect(homeDevDebugFlagsFromSearch("?dom&outline&pf")).toEqual({
      domDump: true,
      outline: true,
      previewFrame: true,
    });
  });

  it("treats absent flags as false", () => {
    expect(homeDevDebugFlagsFromSearch("")).toEqual({
      domDump: false,
      outline: false,
      previewFrame: false,
    });
    expect(homeDevDebugFlagsFromSearch("?other=1")).toEqual({
      domDump: false,
      outline: false,
      previewFrame: false,
    });
  });
});
