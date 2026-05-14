// @ts-check
import { get } from "svelte/store";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { parseHash, route, syncRouteFromHash } from "./router.js";

describe("parseHash", () => {
  it("maps home variants to home", () => {
    expect(parseHash("")).toBe("home");
    expect(parseHash("#")).toBe("home");
    expect(parseHash("#/")).toBe("home");
    expect(parseHash("#/home")).toBe("home");
  });

  it("maps location and legacy location2 to location", () => {
    expect(parseHash("#/location")).toBe("location");
    expect(parseHash("#/location2")).toBe("location");
    expect(parseHash("location")).toBe("location");
    expect(parseHash("location2")).toBe("location");
  });

  it("maps unknown segments to home", () => {
    expect(parseHash("#/nope")).toBe("home");
  });

  it("maps removed placeholder route hashes to home", () => {
    expect(parseHash("#/settings")).toBe("home");
    expect(parseHash("#/about")).toBe("home");
    expect(parseHash("#/acknowledgements")).toBe("home");
    expect(parseHash("#/support")).toBe("home");
    expect(parseHash("#/cookies")).toBe("home");
  });
});

describe("syncRouteFromHash", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    route.set("home");
  });

  beforeEach(() => {
    route.set("home");
  });

  it("rewrites legacy #/location2 to #/location via replaceState", () => {
    const replaceState = vi.fn();
    vi.stubGlobal("history", { replaceState });
    vi.stubGlobal("window", {
      location: {
        hash: "#/location2",
        href: "http://localhost:5173/#/location2",
      },
    });

    syncRouteFromHash();

    expect(get(route)).toBe("location");
    expect(replaceState).toHaveBeenCalledOnce();
    expect(replaceState.mock.calls[0][2]).toBe(
      "http://localhost:5173/#/location",
    );
  });

  it("rewrites legacy placeholder hashes to #/home via replaceState", () => {
    const replaceState = vi.fn();
    vi.stubGlobal("history", { replaceState });
    vi.stubGlobal("window", {
      location: {
        hash: "#/about",
        href: "http://localhost:5173/#/about",
      },
    });

    syncRouteFromHash();

    expect(get(route)).toBe("home");
    expect(replaceState).toHaveBeenCalledOnce();
    expect(replaceState.mock.calls[0][2]).toBe(
      "http://localhost:5173/#/home",
    );
  });

  it("does not replaceState for canonical #/location", () => {
    const replaceState = vi.fn();
    vi.stubGlobal("history", { replaceState });
    vi.stubGlobal("window", {
      location: {
        hash: "#/location",
        href: "http://localhost:5173/#/location",
      },
    });

    syncRouteFromHash();

    expect(get(route)).toBe("location");
    expect(replaceState).not.toHaveBeenCalled();
  });
});
