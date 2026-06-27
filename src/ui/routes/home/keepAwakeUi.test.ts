import { describe, expect, it } from "vitest";
import {
  fullScreenIconAriaLabel,
  keepAwakeIconAriaLabel,
} from "./instrumentIconAria";

describe("instrument icon aria labels", () => {
  it("labels fullscreen off and on", () => {
    expect(fullScreenIconAriaLabel(false)).toBe("Really fullscreen");
    expect(fullScreenIconAriaLabel(true)).toBe("Exit fullscreen");
  });

  it("labels keep awake off and on", () => {
    expect(keepAwakeIconAriaLabel(false)).toMatch(/is off/i);
    expect(keepAwakeIconAriaLabel(true)).toMatch(/is on/i);
  });
});
