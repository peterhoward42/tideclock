import { describe, expect, it } from "vitest";
import { renderPreviewHtml, renderPreviewSvg } from "./renderPreview.mjs";

function sampleScene() {
  return {
    version: 2,
    meta: {
      title: "preview-smoke",
      width: 200,
      height: 120,
      previewFrame: { minX: 10, maxX: 70, minY: 20, maxY: 80 },
    },
    root: {
      kind: "group",
      name: "Root",
      children: [
        {
          kind: "group",
          name: "TickMark",
          children: [
            {
              kind: "line",
              start: { x: 10, y: 20 },
              end: { x: 70, y: 80 },
            },
          ],
        },
      ],
    },
  };
}

describe("renderPreviewHtml", () => {
  it("renders a complete inline-svg html document with expected viewBox", () => {
    const html = renderPreviewHtml(sampleScene(), {
      styleRuntime: {
        stylesByName: new Map([["dominant", { color: "yellow" }]]),
        nameToStyle: new Map([["TickMark", "dominant"]]),
      },
    });

    expect(html).toContain("<!DOCTYPE html>");
    expect(html).toContain("<title>preview-smoke</title>");
    expect(html).toContain('viewBox="0 30 80 80"');
    expect(html).toContain('stroke="yellow"');
  });

  it("throws when style bindings are missing for a leaf group", () => {
    expect(() =>
      renderPreviewHtml(sampleScene(), {
        styleRuntime: {
          stylesByName: new Map([["dominant", { color: "yellow" }]]),
          nameToStyle: new Map(),
        },
      }),
    ).toThrow('missing style binding for leaf group name "TickMark"');
  });

  it("renders inline SVG without the HTML wrapper", () => {
    const svg = renderPreviewSvg(sampleScene(), {
      styleRuntime: {
        stylesByName: new Map([["dominant", { color: "yellow" }]]),
        nameToStyle: new Map([["TickMark", "dominant"]]),
      },
    });

    expect(svg.trimStart().startsWith("<svg")).toBe(true);
    expect(svg).toContain('viewBox="0 30 80 80"');
  });
});
