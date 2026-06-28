import { describe, expect, it } from "vitest";
import { formatKeepAwakeExplainerMessage } from "./keepAwakeExplainer";

describe("formatKeepAwakeExplainerMessage", () => {
  it("explains when keep awake is on", () => {
    const msg = formatKeepAwakeExplainerMessage(true);
    expect(msg.lead).toMatch(/is on/i);
    expect(msg.body).toMatch(/won't dim/i);
  });

  it("explains when keep awake is off", () => {
    const msg = formatKeepAwakeExplainerMessage(false);
    expect(msg.lead).toMatch(/is off/i);
    expect(msg.body).toMatch(/sleep normally/i);
  });
});
