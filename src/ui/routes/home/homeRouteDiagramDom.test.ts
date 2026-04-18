import { describe, expect, it } from "vitest";
import { computeHomeMenuPanelAnchorStyle } from "./homeRouteDiagramDom";

describe("computeHomeMenuPanelAnchorStyle", () => {
  it("positions the panel from trigger and figure rects", () => {
    const figure = {
      getBoundingClientRect: () =>
        ({
          left: 0,
          top: 0,
          right: 100,
          bottom: 100,
          width: 100,
          height: 100,
          x: 0,
          y: 0,
          toJSON: () => ({}),
        }) as DOMRect,
    } as HTMLElement;

    const trigger = {
      getBoundingClientRect: () =>
        ({
          left: 10,
          top: 70,
          right: 40,
          bottom: 90,
          width: 30,
          height: 20,
          x: 10,
          y: 70,
          toJSON: () => ({}),
        }) as DOMRect,
    } as SVGGElement;

    expect(computeHomeMenuPanelAnchorStyle(figure, trigger)).toBe(
      "left: 10px; bottom: 38px;",
    );
  });

  it("clamps negative offsets to zero", () => {
    const figure = {
      getBoundingClientRect: () =>
        ({
          left: 50,
          top: 0,
          right: 150,
          bottom: 80,
          width: 100,
          height: 80,
          x: 50,
          y: 0,
          toJSON: () => ({}),
        }) as DOMRect,
    } as HTMLElement;

    const trigger = {
      getBoundingClientRect: () =>
        ({
          left: 40,
          top: 60,
          right: 60,
          bottom: 70,
          width: 20,
          height: 10,
          x: 40,
          y: 60,
          toJSON: () => ({}),
        }) as DOMRect,
    } as SVGGElement;

    expect(computeHomeMenuPanelAnchorStyle(figure, trigger)).toBe(
      "left: 0px; bottom: 28px;",
    );
  });
});
