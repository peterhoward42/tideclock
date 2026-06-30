// @ts-check
import { get } from "svelte/store";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { parseHash, route, syncRouteFromHash, navigate } from "./router.js";

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

  it("maps legacy placeholder route hashes to home", () => {
    expect(parseHash("#/settings")).toBe("home");
    expect(parseHash("#/acknowledgements")).toBe("home");
    expect(parseHash("#/support")).toBe("home");
    expect(parseHash("#/cookies")).toBe("home");
    expect(parseHash("#/softwarenerd")).toBe("home");
  });

  it("maps about and about with trailing fragment", () => {
    expect(parseHash("#/about")).toBe("about");
    expect(parseHash("about")).toBe("about");
    expect(parseHash("#/about#meet-the-author")).toBe("about");
  });

  it("maps install route", () => {
    expect(parseHash("#/install")).toBe("install");
    expect(parseHash("install")).toBe("install");
  });

  it("maps onwall route", () => {
    expect(parseHash("#/onwall")).toBe("onwall");
    expect(parseHash("onwall")).toBe("onwall");
  });

  it("maps story route", () => {
    expect(parseHash("#/story")).toBe("story");
    expect(parseHash("story")).toBe("story");
  });

  it("maps tidenerd route", () => {
    expect(parseHash("#/tidenerd")).toBe("tidenerd");
    expect(parseHash("tidenerd")).toBe("tidenerd");
  });

  it("maps entertainment child routes", () => {
    expect(parseHash("#/maker")).toBe("maker");
    expect(parseHash("maker")).toBe("maker");
    expect(parseHash("#/drawexact")).toBe("drawexact");
    expect(parseHash("drawexact")).toBe("drawexact");
  });

  it("maps hub routes", () => {
    expect(parseHash("#/installconfig")).toBe("installconfig");
    expect(parseHash("installconfig")).toBe("installconfig");
    expect(parseHash("#/entertainment")).toBe("entertainment");
    expect(parseHash("entertainment")).toBe("entertainment");
    expect(parseHash("#/contact")).toBe("contact");
    expect(parseHash("contact")).toBe("contact");
  });

  it("maps unknown meet-the-author segment to home", () => {
    expect(parseHash("#/meet-the-author")).toBe("home");
    expect(parseHash("meet-the-author")).toBe("home");
  });
});

describe("syncRouteFromHash", () => {
  // Retains vi.fn for history.replaceState: browser globals are stubbed via
  // vi.stubGlobal and the one-method stand-in is terse. Named fakes (e.g.
  // FakeHistory with replaceStateCalls) would align with fakes-over-mocks but
  // are deferred as low priority.
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

  it("rewrites legacy #/softwarenerd placeholder to #/home via replaceState", () => {
    const replaceState = vi.fn();
    vi.stubGlobal("history", { replaceState });
    vi.stubGlobal("window", {
      location: {
        hash: "#/softwarenerd",
        href: "http://localhost:5173/#/softwarenerd",
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

  it("does not replaceState for canonical nerd routes", () => {
    const replaceState = vi.fn();
    vi.stubGlobal("history", { replaceState });
    vi.stubGlobal("window", {
      location: {
        hash: "#/tidenerd",
        href: "http://localhost:5173/#/tidenerd",
      },
    });

    syncRouteFromHash();

    expect(get(route)).toBe("tidenerd");
    expect(replaceState).not.toHaveBeenCalled();
  });

  it("does not replaceState for canonical hub routes", () => {
    const replaceState = vi.fn();
    vi.stubGlobal("history", { replaceState });
    vi.stubGlobal("window", {
      location: {
        hash: "#/installconfig",
        href: "http://localhost:5173/#/installconfig",
      },
    });

    syncRouteFromHash();

    expect(get(route)).toBe("installconfig");
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

describe("navigate", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    route.set("home");
  });

  it("sets the location hash", () => {
    vi.stubGlobal("window", {
      location: { hash: "#/story" },
    });

    navigate("home");

    expect(window.location.hash).toBe("/home");
  });

  it("sets hash for hub routes", () => {
    vi.stubGlobal("window", {
      location: { hash: "#/home" },
    });

    navigate("installconfig");
    expect(window.location.hash).toBe("/installconfig");

    navigate("entertainment");
    expect(window.location.hash).toBe("/entertainment");

    navigate("contact");
    expect(window.location.hash).toBe("/contact");
  });
});
