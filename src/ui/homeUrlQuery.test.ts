import { describe, expect, it, vi } from "vitest";
import {
  buildShareSearchForTown,
  buildShareUrlForTown,
  effectiveSearchFromLocation,
  homeDevDebugFlagsFromSearch,
  placeAndCountyFromSearch,
  syncShareParamsInLocationBar,
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

describe("buildShareSearchForTown", () => {
  it("encodes place and county with URL encoding", () => {
    expect(
      buildShareSearchForTown({ name: "Looe", county: "Cornwall" }),
    ).toBe("?place=Looe&county=Cornwall");
    expect(
      buildShareSearchForTown({
        name: "St Ives",
        county: "Cornwall",
      }),
    ).toBe("?place=St+Ives&county=Cornwall");
    expect(
      buildShareSearchForTown({
        name: "Whitby",
        county: "North Yorkshire",
      }),
    ).toBe("?place=Whitby&county=North+Yorkshire");
  });
});

describe("buildShareUrlForTown", () => {
  it("uses the provided origin", () => {
    expect(
      buildShareUrlForTown(
        { name: "Looe", county: "Cornwall" },
        { origin: "https://thetidedial.page" },
      ),
    ).toBe("https://thetidedial.page/?place=Looe&county=Cornwall");
  });
});

describe("syncShareParamsInLocationBar", () => {
  it("sets search params, strips dev flags, and clears hash query", () => {
    const replaceState = vi.fn();
    vi.stubGlobal("history", { replaceState });
    vi.stubGlobal("window", {
      location: {
        href: "https://thetidedial.page/#/home?diagramPreview=x&dom",
      },
    });

    syncShareParamsInLocationBar({ name: "Looe", county: "Cornwall" });

    expect(replaceState).toHaveBeenCalledOnce();
    const nextHref = replaceState.mock.calls[0][2] as string;
    const url = new URL(nextHref);
    expect(url.searchParams.get("place")).toBe("Looe");
    expect(url.searchParams.get("county")).toBe("Cornwall");
    expect(url.searchParams.has("dom")).toBe(false);
    expect(url.searchParams.has("diagramPreview")).toBe(false);
    expect(url.hash).toBe("#/home");
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
