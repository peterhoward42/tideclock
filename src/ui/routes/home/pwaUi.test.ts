import { afterEach, describe, expect, it, vi } from "vitest";
import { formatPwaWakeStatusLine } from "./pwaUi";

function stubWakeLockSupported(): void {
  vi.stubGlobal("navigator", {
    wakeLock: { request: vi.fn() },
  });
}

describe("formatPwaWakeStatusLine", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("reports unsupported browsers", () => {
    vi.stubGlobal("navigator", {});
    expect(formatPwaWakeStatusLine(true, true, null)).toMatch(/not supported/i);
  });

  it("reports when the user has opted out", () => {
    stubWakeLockSupported();
    expect(formatPwaWakeStatusLine(true, false, null)).toMatch(/is off/i);
  });

  it("describes the not-on-home case when the user has opted in", () => {
    stubWakeLockSupported();
    const line = formatPwaWakeStatusLine(false, true, null);
    expect(line).toContain("home tide view");
  });

  it("reports requesting state on home before presentation is set", () => {
    stubWakeLockSupported();
    expect(formatPwaWakeStatusLine(true, true, null)).toMatch(/requesting/i);
  });

  it("reports active lock on home", () => {
    stubWakeLockSupported();
    expect(formatPwaWakeStatusLine(true, true, { kind: "active" })).toMatch(
      /stays awake/i,
    );
  });

  it("reports background pause", () => {
    stubWakeLockSupported();
    expect(
      formatPwaWakeStatusLine(true, true, {
        kind: "inactive",
        reason: "background",
      }),
    ).toMatch(/paused/i);
  });

  it("reports request failure", () => {
    stubWakeLockSupported();
    expect(
      formatPwaWakeStatusLine(true, true, {
        kind: "inactive",
        reason: "request_failed",
      }),
    ).toMatch(/could not request/i);
  });
});
