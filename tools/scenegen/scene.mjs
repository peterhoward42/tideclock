// `buildScene` turns `spec.json` into the v2 scene graph consumed by `gen.mjs` and `preview.mjs`.
// Default output is an empty scene (canvas + metadata only); add primitives here when iterating
// scenegen without the diagram pipeline.
import { group } from "./sceneModel.mjs";

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

  return {
    version: 2,
    meta: { title, width, height },
    root: group("root", []),
  };
}
