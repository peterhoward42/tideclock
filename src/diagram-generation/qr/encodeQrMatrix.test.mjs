import { describe, expect, it } from "vitest";
import { encodeQrMatrix } from "./encodeQrMatrix.mjs";

describe("encodeQrMatrix", () => {
  it("returns a square module grid with at least one dark cell", () => {
    const { moduleCount, cells } = encodeQrMatrix("https://thetidedial.page");
    expect(moduleCount).toBeGreaterThan(0);
    expect(cells).toHaveLength(moduleCount * moduleCount);
    expect(cells.some(Boolean)).toBe(true);
  });

  it("throws on empty payload", () => {
    expect(() => encodeQrMatrix("")).toThrow(/non-empty/);
  });
});
