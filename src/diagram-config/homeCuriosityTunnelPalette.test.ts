import { describe, expect, it } from "vitest";
import {
  curiosityTunnelColorAt,
  homeCuriosityTunnelPalette,
} from "./homeStyleModel.preset";

describe("homeCuriosityTunnelPalette", () => {
  it("cycles four colours by letter index", () => {
    expect(curiosityTunnelColorAt(0)).toBe(homeCuriosityTunnelPalette[0]);
    expect(curiosityTunnelColorAt(3)).toBe(homeCuriosityTunnelPalette[3]);
    expect(curiosityTunnelColorAt(4)).toBe(homeCuriosityTunnelPalette[0]);
    expect(curiosityTunnelColorAt(12)).toBe(homeCuriosityTunnelPalette[0]);
    expect(curiosityTunnelColorAt(13)).toBe(homeCuriosityTunnelPalette[1]);
  });
});
