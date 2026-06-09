import { describe, expect, it } from "vitest";
import {
  effectiveSearchFromLocation,
  homeDevDebugFlagsFromSearch,
  placeAndCountyFromSearch,
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

describe("placeAndCountyFromSearch", () => {
  it("returns absent when neither param is present", () => {
    expect(placeAndCountyFromSearch("")).toEqual({ kind: "absent" });
    expect(placeAndCountyFromSearch("?diagramPreview=x")).toEqual({
      kind: "absent",
    });
  });

  it("returns partial when only one param is present or trimmed empty", () => {
    expect(placeAndCountyFromSearch("?place=Looe")).toEqual({
      kind: "partial",
      place: "Looe",
      county: null,
    });
    expect(placeAndCountyFromSearch("?county=Cornwall")).toEqual({
      kind: "partial",
      place: null,
      county: "Cornwall",
    });
    expect(placeAndCountyFromSearch("?place=%20&county=Cornwall")).toEqual({
      kind: "partial",
      place: null,
      county: "Cornwall",
    });
  });

  it("returns present when both params are non-empty after trim", () => {
    expect(placeAndCountyFromSearch("?place=Looe&county=Cornwall")).toEqual({
      kind: "present",
      place: "Looe",
      county: "Cornwall",
    });
    expect(
      placeAndCountyFromSearch("?place=  Whitby &county=North%20Yorkshire"),
    ).toEqual({
      kind: "present",
      place: "Whitby",
      county: "North Yorkshire",
    });
  });
});

describe("effectiveSearchFromLocation with place params", () => {
  it("parses place and county from hash query when search is empty", () => {
    const search = effectiveSearchFromLocation(
      "",
      "#/home?place=Looe&county=Cornwall",
    );
    expect(placeAndCountyFromSearch(search)).toEqual({
      kind: "present",
      place: "Looe",
      county: "Cornwall",
    });
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
