// `buildScene` turns `input.json` (parsed spec) into the v2 scene graph consumed by `gen.mjs` and `preview.mjs`.
// If `spec.contentBounds` is set (diagram-space extents, same as diaggen), the full tide diagram pipeline runs:
// `buildDiagram` → `tideDiagramToScene` (RefArc, ticks, tick labels, tide marks, centre cluster, previewFrame).
// Otherwise `spec.previewFrame` (scene-space AABB) is required; optional diaggen-shaped `centreCluster` renders
// only that group (legacy scenegen loop).
import { buildDiagram } from "../../src/diagram-generation/layout/buildDiagram.mjs";
import { buildCentreClusterFromSpec } from "../../src/diagram-generation/layout/centreCluster.mjs";
import {
  centreClusterDiagramToGroup,
  tideDiagramToScene,
} from "../../src/diagram-generation/mapping/toScene.mjs";
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
  const rawBounds = spec.contentBounds;
  if (rawBounds != null && typeof rawBounds === "object") {
    const diagram = buildDiagram(spec);
    return tideDiagramToScene(diagram);
  }

  const width =
    typeof spec.canvas?.width === "number" ? spec.canvas.width : 400;
  const height =
    typeof spec.canvas?.height === "number" ? spec.canvas.height : 300;
  const title = typeof spec.title === "string" ? spec.title : "scene";

  const cx = width / 2;
  const cy = height / 2;
  const centreCluster = buildCentreClusterFromSpec(spec);
  const rootChildren = [];
  if (centreCluster != null) {
    rootChildren.push(centreClusterDiagramToGroup(centreCluster, cx, cy));
  }

  return {
    version: 2,
    meta: {
      title,
      width,
      height,
      previewFrame: requirePreviewFrame(spec),
    },
    root: group("root", rootChildren),
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
