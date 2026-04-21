import { afterEach, describe, expect, it, vi } from "vitest";
import {
  exitInstrumentFullscreen,
  requestInstrumentFullscreen,
  toggleInstrumentFullscreen,
} from "./homeRouteFullscreen";

describe("homeRouteFullscreen", () => {
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
