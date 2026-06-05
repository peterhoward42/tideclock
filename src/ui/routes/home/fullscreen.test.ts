import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  exitInstrumentFullscreen,
  getDiagramFullscreenTarget,
  requestInstrumentFullscreen,
  toggleInstrumentFullscreen,
} from "./fullscreen";

// Retains vi.fn for requestFullscreen / exitFullscreen: browser globals are
// stubbed via vi.stubGlobal and the one-method stand-ins are terse. Named fakes
// (e.g. FakeFullscreenElement) would align with fakes-over-mocks but are
// deferred as low priority.
describe("fullscreen (home route)", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("requests fullscreen when supported", async () => {
    const requestFullscreen = vi.fn(async () => {});
    const el = { requestFullscreen } as unknown as HTMLElement;
    vi.stubGlobal("document", { fullscreenElement: null });

    await requestInstrumentFullscreen(el);
    expect(requestFullscreen).toHaveBeenCalledTimes(1);
  });

  it("silently no-ops when request is unsupported", async () => {
    const el = {} as HTMLElement;
    vi.stubGlobal("document", { fullscreenElement: null });

    await expect(requestInstrumentFullscreen(el)).resolves.toBeUndefined();
  });

  it("exits fullscreen when active", async () => {
    const exitFullscreen = vi.fn(async () => {});
    vi.stubGlobal("document", {
      fullscreenElement: { nodeName: "DIV" },
      exitFullscreen,
    });

    await exitInstrumentFullscreen();
    expect(exitFullscreen).toHaveBeenCalledTimes(1);
  });

  it("toggle enters fullscreen when inactive", async () => {
    const requestFullscreen = vi.fn(async () => {});
    const el = { requestFullscreen } as unknown as HTMLElement;
    vi.stubGlobal("document", { fullscreenElement: null });

    await toggleInstrumentFullscreen(el);
    expect(requestFullscreen).toHaveBeenCalledTimes(1);
  });

  it("toggle exits fullscreen when already active", async () => {
    const exitFullscreen = vi.fn(async () => {});
    vi.stubGlobal("document", {
      fullscreenElement: { nodeName: "DIV" },
      exitFullscreen,
    });

    await toggleInstrumentFullscreen({} as HTMLElement);
    expect(exitFullscreen).toHaveBeenCalledTimes(1);
  });
});

describe("getDiagramFullscreenTarget (home + fullscreen regression)", () => {
  it("regression: diagram host wraps the figure and menu as siblings, so it must be the fullscreen target", () => {
    // Mirrors `HomeRouteTidePanels`: host > [figure, .home-menu-panel]; menu is not inside the figure
    // (avoids `overflow: hidden` clipping), so only `host` is a common ancestor in the top-layer subtree.
    type Mock = { name: string; children: readonly Mock[] };
    const contains = (a: Mock, b: Mock): boolean => {
      if (a === b) return true;
      return a.children.some((c) => contains(c, b));
    };
    const figure: Mock = { name: "figure", children: [] };
    const menu: Mock = { name: "menu", children: [] };
    const host: Mock = { name: "diagram-host", children: [figure, menu] };
    expect(contains(figure, menu)).toBe(false);
    expect(contains(host, figure) && contains(host, menu)).toBe(true);
    const target = getDiagramFullscreenTarget(
      host as unknown as HTMLElement,
    );
    expect(target).toBe(host);
  });

  it("returns null when the diagram host is not mounted yet", () => {
    expect(getDiagramFullscreenTarget(undefined)).toBeNull();
  });

  it("HomeRoute requests fullscreen on the diagram host, not the instrument figure", () => {
    const homeRoutePath = join(
      dirname(fileURLToPath(import.meta.url)),
      "HomeRoute.svelte",
    );
    const src = readFileSync(homeRoutePath, "utf-8");
    expect(src).toMatch(
      /getDiagramFullscreenTarget\s*\(\s*diagramHostEl\s*\)/s,
    );
    expect(src).not.toMatch(
      /toggleInstrumentFullscreen\s*\(\s*homeInstrumentEl/s,
    );
  });
});
