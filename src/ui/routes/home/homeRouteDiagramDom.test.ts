import { describe, expect, it } from "vitest";
import { computeHomeMenuPanelAnchorStyle } from "./homeRouteDiagramDom";

describe("computeHomeMenuPanelAnchorStyle", () => {
  it("positions the panel from trigger and diagram host rects", () => {
    const diagramHost = {
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

    expect(computeHomeMenuPanelAnchorStyle(diagramHost, trigger)).toBe(
      "left: 10px; bottom: 18px;",
    );
  });

  it("clamps negative offsets to zero", () => {
    const diagramHost = {
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

    expect(computeHomeMenuPanelAnchorStyle(diagramHost, trigger)).toBe(
      "left: 0px; bottom: 18px;",
    );
  });

  it("anchors bottom from the diagram host rect, not an inner clipped box", () => {
    const diagramHost = {
      getBoundingClientRect: () =>
        ({
          left: 0,
          top: 0,
          right: 100,
          bottom: 200,
          width: 100,
          height: 200,
          x: 0,
          y: 0,
          toJSON: () => ({}),
        }) as DOMRect,
    } as HTMLElement;

    const trigger = {
      getBoundingClientRect: () =>
        ({
          left: 10,
          top: 150,
          right: 40,
          bottom: 170,
          width: 30,
          height: 20,
          x: 10,
          y: 150,
          toJSON: () => ({}),
        }) as DOMRect,
    } as SVGGElement;

    expect(computeHomeMenuPanelAnchorStyle(diagramHost, trigger)).toBe(
      "left: 10px; bottom: 38px;",
    );
  });
});
