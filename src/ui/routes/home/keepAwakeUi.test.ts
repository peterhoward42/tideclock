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

  it("labels keep awake checkbox", () => {
    expect(keepAwakeIconAriaLabel(false)).toBe("Keep screen awake");
    expect(keepAwakeIconAriaLabel(true)).toBe("Keep screen awake");
  });
});
