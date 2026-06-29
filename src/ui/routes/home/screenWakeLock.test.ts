import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { mountScreenWakeLock } from "./screenWakeLock";

// Partially migrated (FakeDocument). Retains vi.fn / vi.spyOn for wake-lock
// request, sentinel release, and removeEventListener: browser globals are
// stubbed via vi.stubGlobal. Named fakes (FakeWakeLock, RecordingSentinel)
// would finish the migration but are deferred as low priority.
class FakeDocument extends EventTarget {
  visibilityState: "visible" | "hidden" = "visible";

  setVisibility(next: "visible" | "hidden"): void {
    this.visibilityState = next;
    this.dispatchEvent(new Event("visibilitychange"));
  }
}

function createFakeSentinel(): WakeLockSentinel {
  const target = new EventTarget();
  let released = false;
  return {
    get released(): Promise<void> {
      return released ? Promise.resolve() : new Promise(() => {});
    },
    release: vi.fn(async () => {
      if (released) return;
      released = true;
      target.dispatchEvent(new Event("release"));
    }),
    addEventListener: target.addEventListener.bind(target),
    removeEventListener: target.removeEventListener.bind(target),
    dispatchEvent: target.dispatchEvent.bind(target),
  } as unknown as WakeLockSentinel;
}

describe("mountScreenWakeLock", () => {
  beforeEach(() => {
    vi.spyOn(console, "debug").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("requests a screen lock when mounted visible and the user wants it", async () => {
    const doc = new FakeDocument();
    doc.visibilityState = "visible";
    const sentinel = createFakeSentinel();
    const request = vi.fn(async () => sentinel);

    vi.stubGlobal("document", doc);
    vi.stubGlobal("navigator", { wakeLock: { request } });

    mountScreenWakeLock({
      shouldRequestLock: () => true,
    });
    await vi.waitFor(() => expect(request).toHaveBeenCalledTimes(1));
    expect(request).toHaveBeenCalledWith("screen");
  });

  it("does not request when the user has opted out", () => {
    const doc = new FakeDocument();
    const request = vi.fn();

    vi.stubGlobal("document", doc);
    vi.stubGlobal("navigator", { wakeLock: { request } });

    mountScreenWakeLock({
      shouldRequestLock: () => false,
    });

    expect(request).not.toHaveBeenCalled();
  });

  it("releases when the document becomes hidden", async () => {
    const doc = new FakeDocument();
    doc.visibilityState = "visible";
    const sentinel = createFakeSentinel();
    const request = vi.fn(async () => sentinel);

    vi.stubGlobal("document", doc);
    vi.stubGlobal("navigator", { wakeLock: { request } });

    const { dispose } = mountScreenWakeLock({
      shouldRequestLock: () => true,
    });
    await vi.waitFor(() => expect(request).toHaveBeenCalled());

    doc.setVisibility("hidden");
    await vi.waitFor(() =>
      expect(
        (sentinel.release as ReturnType<typeof vi.fn>).mock.calls.length,
      ).toBeGreaterThan(0),
    );

    dispose();
  });

  it("disposer removes the visibility listener and releases", async () => {
    const doc = new FakeDocument();
    const removeSpy = vi.spyOn(doc, "removeEventListener");
    const sentinel = createFakeSentinel();
    vi.stubGlobal("document", doc);
    vi.stubGlobal("navigator", {
      wakeLock: { request: vi.fn(async () => sentinel) },
    });

    const { dispose } = mountScreenWakeLock({
      shouldRequestLock: () => true,
    });
    await vi.waitFor(() => expect(sentinel.release).not.toHaveBeenCalled());

    dispose();

    expect(removeSpy).toHaveBeenCalledWith(
      "visibilitychange",
      expect.any(Function),
    );
    await vi.waitFor(() =>
      expect(
        (sentinel.release as ReturnType<typeof vi.fn>).mock.calls.length,
      ).toBeGreaterThan(0),
    );
  });
});
