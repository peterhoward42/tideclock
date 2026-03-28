import {
  arc,
  group,
  line,
  point,
  text,
} from "./sceneModel.mjs";

export {
  arc,
  group,
  line,
  point,
  text,
} from "./sceneModel.mjs";

/**
 * Build a plain scene model from spec data (geometry-first; no SVG here).
 * Scene space: x right, y up; angles in radians (CCW from +x).
 *
 * @param {Record<string, unknown>} spec
 * @returns {import('./sceneModel.mjs').SceneDocument}
 */
export function buildScene(spec) {
  const width =
    typeof spec.canvas?.width === "number" ? spec.canvas.width : 400;
  const height =
    typeof spec.canvas?.height === "number" ? spec.canvas.height : 300;
  const title = typeof spec.title === "string" ? spec.title : "scene";

  const cx = width / 2;
  const cy = height / 2;

  return {
    version: 2,
    meta: { title, width, height },
    root: group("root", [
      group("sample", [
        line(point(16, 16), point(width - 16, height - 16)),
        arc(point(cx, cy), point(cx + 56, cy), (3 * Math.PI) / 4),
        text({
          content: title,
          size: 14,
          hAlign: "center",
          angleRad: 0,
          anchor: point(cx, height - 28),
        }),
      ]),
    ]),
  };
}
