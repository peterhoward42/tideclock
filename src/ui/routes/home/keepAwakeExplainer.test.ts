import { describe, expect, it } from "vitest";
import { formatKeepAwakeExplainerMessage } from "./keepAwakeExplainer";

describe("formatKeepAwakeExplainerMessage", () => {
  it("explains when keep awake is on", () => {
    expect(formatKeepAwakeExplainerMessage(true)).toBe("Now your screen will stay awake");
  });

  it("explains when keep awake is off", () => {
    expect(formatKeepAwakeExplainerMessage(false)).toBe("Now your screen can sleep as normal");
  });
});
