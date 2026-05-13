import { afterEach, describe, expect, it, vi } from "vitest";
import {
  mountOrientationLock,
  requestLandscapeOrientationLock,
  requestOrientationUnlock,
} from "./orientationLock";

function setNavigatorStandalone(value: boolean): void {
  vi.stubGlobal("navigator", { standalone: value });
}

describe("requestLandscapeOrientationLock", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("locks to landscape in standalone display mode", async () => {
    const lock = vi.fn(async () => {});
    vi.stubGlobal("screen", { orientation: { lock } });
    vi.stubGlobal("matchMedia", vi.fn(() => ({ matches: true })));
    setNavigatorStandalone(false);

    await requestLandscapeOrientationLock();
    expect(lock).toHaveBeenCalledWith("landscape");
  });

  it("does not attempt lock when not in installed context", async () => {
    const lock = vi.fn(async () => {});
    vi.stubGlobal("screen", { orientation: { lock } });
    vi.stubGlobal("matchMedia", vi.fn(() => ({ matches: false })));
    setNavigatorStandalone(false);

    await requestLandscapeOrientationLock();
    expect(lock).not.toHaveBeenCalled();
  });

  it("falls back to iOS standalone signal when display-mode does not match", async () => {
    const lock = vi.fn(async () => {});
    vi.stubGlobal("screen", { orientation: { lock } });
    vi.stubGlobal("matchMedia", vi.fn(() => ({ matches: false })));
    setNavigatorStandalone(true);

    await requestLandscapeOrientationLock();
    expect(lock).toHaveBeenCalledWith("landscape");
  });

  it("swallows lock failures", async () => {
    const lock = vi.fn(async () => {
      throw new Error("denied");
    });
    vi.stubGlobal("screen", { orientation: { lock } });
    vi.stubGlobal("matchMedia", vi.fn(() => ({ matches: true })));
    setNavigatorStandalone(false);

    await expect(requestLandscapeOrientationLock()).resolves.toBeUndefined();
  });
});

describe("requestOrientationUnlock", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("calls unlock when available", () => {
    const unlock = vi.fn();
    vi.stubGlobal("screen", { orientation: { unlock } });

    requestOrientationUnlock();

    expect(unlock).toHaveBeenCalledTimes(1);
  });

  it("no-ops when unlock is missing", () => {
    vi.stubGlobal("screen", { orientation: {} });

    expect(() => requestOrientationUnlock()).not.toThrow();
  });

  it("swallows unlock failures", () => {
    const unlock = vi.fn(() => {
      throw new Error("denied");
    });
    vi.stubGlobal("screen", { orientation: { unlock } });

    expect(() => requestOrientationUnlock()).not.toThrow();
  });
});

describe("mountOrientationLock", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("attempts exactly once after first gesture inside root", async () => {
    const lock = vi.fn(async () => {});
    vi.stubGlobal("screen", { orientation: { lock } });
    vi.stubGlobal("matchMedia", vi.fn(() => ({ matches: true })));
    setNavigatorStandalone(false);
    const listeners = new Map<string, EventListener>();
    vi.stubGlobal("addEventListener", vi.fn((type: string, listener: EventListener) => {
      listeners.set(type, listener);
    }));
    vi.stubGlobal("removeEventListener", vi.fn((type: string) => {
      listeners.delete(type);
    }));
    const insideTarget = { kind: "inside" };
    const root = {
      contains: (target: unknown) => target === insideTarget,
    } as unknown as HTMLElement;

    const dispose = mountOrientationLock(root);

    listeners.get("pointerdown")?.({ target: insideTarget } as Event);
    await vi.waitFor(() => expect(lock).toHaveBeenCalledTimes(1));

    listeners.get("pointerdown")?.({ target: insideTarget } as Event);
    await Promise.resolve();
    expect(lock).toHaveBeenCalledTimes(1);

    dispose();
  });

  it("ignores gestures outside root", async () => {
    const lock = vi.fn(async () => {});
    vi.stubGlobal("screen", { orientation: { lock } });
    vi.stubGlobal("matchMedia", vi.fn(() => ({ matches: true })));
    setNavigatorStandalone(false);
    const listeners = new Map<string, EventListener>();
    vi.stubGlobal("addEventListener", vi.fn((type: string, listener: EventListener) => {
      listeners.set(type, listener);
    }));
    vi.stubGlobal("removeEventListener", vi.fn((type: string) => {
      listeners.delete(type);
    }));
    const insideTarget = { kind: "inside" };
    const outsideTarget = { kind: "outside" };
    const root = {
      contains: (target: unknown) => target === insideTarget,
    } as unknown as HTMLElement;

    const dispose = mountOrientationLock(root);

    listeners.get("pointerdown")?.({ target: outsideTarget } as Event);
    await Promise.resolve();
    expect(lock).not.toHaveBeenCalled();

    dispose();
  });
});
