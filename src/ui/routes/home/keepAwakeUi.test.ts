import { beforeEach, describe, expect, it, vi } from "vitest";
import { formatKeepAwakeStatusLine } from "./keepAwakeUi";

function stubWakeLockSupported(): void {
  vi.stubGlobal("navigator", {
    wakeLock: { request: vi.fn() },
  });
}

describe("formatKeepAwakeStatusLine", () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
  });

  it("reports unsupported when the API is missing", () => {
    vi.stubGlobal("navigator", {});
    expect(formatKeepAwakeStatusLine(true, true, null)).toMatch(/not supported/i);
  });

  it("reports off when the user has not opted in", () => {
    stubWakeLockSupported();
    expect(formatKeepAwakeStatusLine(true, false, null)).toMatch(/is off/i);
  });

  it("directs the user to home when opted in elsewhere", () => {
    stubWakeLockSupported();
    const line = formatKeepAwakeStatusLine(false, true, null);
    expect(line).toMatch(/home tide view/i);
  });

  it("reports requesting while presentation is null on home", () => {
    stubWakeLockSupported();
    expect(formatKeepAwakeStatusLine(true, true, null)).toMatch(/requesting/i);
  });

  it("reports active when the lock is held", () => {
    stubWakeLockSupported();
    expect(formatKeepAwakeStatusLine(true, true, { kind: "active" })).toMatch(
      /stays awake/i,
    );
  });

  it("reports paused when the tab is backgrounded", () => {
    stubWakeLockSupported();
    expect(
      formatKeepAwakeStatusLine(true, true, {
        kind: "inactive",
        reason: "background",
      }),
    ).toMatch(/paused/i);
  });

  it("reports failure when the request was rejected", () => {
    stubWakeLockSupported();
    expect(
      formatKeepAwakeStatusLine(true, true, {
        kind: "inactive",
        reason: "request_failed",
      }),
    ).toMatch(/could not request/i);
  });
});
