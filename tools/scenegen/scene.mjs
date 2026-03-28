// `buildScene` turns `spec.json` into the v2 scene graph consumed by `gen.mjs` and `preview.mjs`.
// `spec.previewFrame` (scene-space AABB) is required — same field `toScene` sets from diagram `contentBounds`.
// Default output is an empty scene (canvas + metadata + frame only); add primitives when iterating
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
    meta: {
      title,
      width,
      height,
      previewFrame: requirePreviewFrame(spec),
    },
    root: group("root", []),
  };
}

/**
 * @param {Record<string, unknown>} spec
 * @returns {{ minX: number, maxX: number, minY: number, maxY: number }}
 */
function requirePreviewFrame(spec) {
  const raw = spec.previewFrame;
  if (raw == null || typeof raw !== "object") {
    throw new Error(
      "spec.previewFrame is required: { minX, maxX, minY, maxY } in scene space (y up)",
    );
  }
  const o = /** @type {Record<string, unknown>} */ (raw);
  const minX = o.minX;
  const maxX = o.maxX;
  const minY = o.minY;
  const maxY = o.maxY;
  if (
    ![minX, maxX, minY, maxY].every(
      (v) => typeof v === "number" && Number.isFinite(v),
    )
  ) {
    throw new Error(
      "spec.previewFrame must set minX, maxX, minY, maxY to finite numbers",
    );
  }
  const a = /** @type {number} */ (minX);
  const b = /** @type {number} */ (maxX);
  const c = /** @type {number} */ (minY);
  const d = /** @type {number} */ (maxY);
  if (b - a <= 1e-6 || d - c <= 1e-6) {
    throw new Error("spec.previewFrame must have positive width and height");
  }
  return { minX: a, maxX: b, minY: c, maxY: d };
}
