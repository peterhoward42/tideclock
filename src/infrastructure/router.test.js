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
    expect(parseHash("#/home?contact=1")).toBe("home");
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

  it("maps legacy placeholder route hashes to home", () => {
    expect(parseHash("#/settings")).toBe("home");
    expect(parseHash("#/acknowledgements")).toBe("home");
    expect(parseHash("#/support")).toBe("home");
    expect(parseHash("#/cookies")).toBe("home");
  });

  it("maps about and about with trailing fragment", () => {
    expect(parseHash("#/about")).toBe("about");
    expect(parseHash("about")).toBe("about");
    expect(parseHash("#/about#meet-the-author")).toBe("about");
  });

  it("maps onwall route", () => {
    expect(parseHash("#/onwall")).toBe("onwall");
    expect(parseHash("onwall")).toBe("onwall");
  });

  it("maps story route", () => {
    expect(parseHash("#/story")).toBe("story");
    expect(parseHash("story")).toBe("story");
  });

  it("maps unknown meet-the-author segment to home", () => {
    expect(parseHash("#/meet-the-author")).toBe("home");
    expect(parseHash("meet-the-author")).toBe("home");
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

  it("rewrites legacy #/settings placeholder to #/home via replaceState", () => {
    const replaceState = vi.fn();
    vi.stubGlobal("history", { replaceState });
    vi.stubGlobal("window", {
      location: {
        hash: "#/settings",
        href: "http://localhost:5173/#/settings",
      },
    });

    syncRouteFromHash();

    expect(get(route)).toBe("home");
    expect(replaceState).toHaveBeenCalledOnce();
    expect(replaceState.mock.calls[0][2]).toBe(
      "http://localhost:5173/#/home",
    );
  });

  it("does not replaceState for canonical #/about", () => {
    const replaceState = vi.fn();
    vi.stubGlobal("history", { replaceState });
    vi.stubGlobal("window", {
      location: {
        hash: "#/about",
        href: "http://localhost:5173/#/about",
      },
    });

    syncRouteFromHash();

    expect(get(route)).toBe("about");
    expect(replaceState).not.toHaveBeenCalled();
  });

  it("does not replaceState for canonical #/onwall", () => {
    const replaceState = vi.fn();
    vi.stubGlobal("history", { replaceState });
    vi.stubGlobal("window", {
      location: {
        hash: "#/onwall",
        href: "http://localhost:5173/#/onwall",
      },
    });

    syncRouteFromHash();

    expect(get(route)).toBe("onwall");
    expect(replaceState).not.toHaveBeenCalled();
  });

  it("does not replaceState for canonical #/story", () => {
    const replaceState = vi.fn();
    vi.stubGlobal("history", { replaceState });
    vi.stubGlobal("window", {
      location: {
        hash: "#/story",
        href: "http://localhost:5173/#/story",
      },
    });

    syncRouteFromHash();

    expect(get(route)).toBe("story");
    expect(replaceState).not.toHaveBeenCalled();
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
