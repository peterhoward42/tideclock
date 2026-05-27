import { afterEach, describe, expect, it, vi } from "vitest";
import { isStandaloneDisplayMode } from "./pwaDisplayMode";

describe("isStandaloneDisplayMode", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns true when display-mode standalone matches", () => {
    vi.stubGlobal("matchMedia", (query: string) => ({
      matches: query === "(display-mode: standalone)",
    }));
    vi.stubGlobal("navigator", {});
    expect(isStandaloneDisplayMode()).toBe(true);
  });

  it("returns true when navigator.standalone is set (legacy iOS)", () => {
    vi.stubGlobal("matchMedia", () => ({ matches: false }));
    vi.stubGlobal("navigator", { standalone: true });
    expect(isStandaloneDisplayMode()).toBe(true);
  });

  it("returns false in a normal browser tab", () => {
    vi.stubGlobal("matchMedia", () => ({ matches: false }));
    vi.stubGlobal("navigator", {});
    expect(isStandaloneDisplayMode()).toBe(false);
  });
});
