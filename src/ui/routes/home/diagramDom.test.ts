import { describe, expect, it } from "vitest";
import { computeMenuPanelAnchorStyle } from "./diagramDom";

describe("computeMenuPanelAnchorStyle", () => {
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

    expect(
      computeMenuPanelAnchorStyle(diagramHost, trigger, {
        viewInnerHeight: 1000,
      }),
    ).toBe("right: 64px; bottom: 18px; max-height: min(80dvh, 74px);");
  });

  it("clamps right inset to zero when the trigger’s right edge is past the host’s right", () => {
    const diagramHost = {
      getBoundingClientRect: () =>
        ({
          left: 20,
          top: 0,
          right: 120,
          bottom: 80,
          width: 100,
          height: 80,
          x: 20,
          y: 0,
          toJSON: () => ({}),
        }) as DOMRect,
    } as HTMLElement;

    const trigger = {
      getBoundingClientRect: () =>
        ({
          left: 90,
          top: 60,
          right: 130,
          bottom: 70,
          width: 40,
          height: 10,
          x: 90,
          y: 60,
          toJSON: () => ({}),
        }) as DOMRect,
    } as SVGGElement;

    expect(
      computeMenuPanelAnchorStyle(diagramHost, trigger, {
        viewInnerHeight: 1000,
      }),
    ).toBe("right: 0px; bottom: 18px; max-height: min(80dvh, 54px);");
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

    expect(
      computeMenuPanelAnchorStyle(diagramHost, trigger, {
        viewInnerHeight: 1000,
      }),
    ).toBe("right: 64px; bottom: 38px; max-height: min(80dvh, 154px);");
  });

  it("uses the 80% viewport cap when plenty of room above the trigger", () => {
    const diagramHost = {
      getBoundingClientRect: () =>
        ({
          left: 0,
          top: 0,
          right: 100,
          bottom: 1000,
          width: 100,
          height: 1000,
          x: 0,
          y: 0,
          toJSON: () => ({}),
        }) as DOMRect,
    } as HTMLElement;

    const trigger = {
      getBoundingClientRect: () =>
        ({
          left: 10,
          top: 900,
          right: 40,
          bottom: 950,
          width: 30,
          height: 50,
          x: 10,
          y: 900,
          toJSON: () => ({}),
        }) as DOMRect,
    } as SVGGElement;

    expect(
      computeMenuPanelAnchorStyle(diagramHost, trigger, {
        viewInnerHeight: 1000,
      }),
    ).toBe("right: 64px; bottom: 58px; max-height: min(80dvh, 800px);");
  });
});
