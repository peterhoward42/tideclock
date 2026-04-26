import { afterEach, describe, expect, it, vi } from "vitest";
import { formatPwaWakeStatusLine } from "./homeRoutePwaUi";

describe("formatPwaWakeStatusLine", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("describes the not-on-home case when the user has opted in", () => {
    vi.stubGlobal("navigator", {
      wakeLock: { request: vi.fn() },
    });
    const line = formatPwaWakeStatusLine(false, true, null);
    expect(line).toContain("home tide view");
  });
});
