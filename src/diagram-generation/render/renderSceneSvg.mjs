/**
 * renderSceneSvg.mjs — Scene graph → SVG string output (no fs/CLI); used by the Home route.
 * Kind: Presentation. Does not compute layout from tide specs.
 */

import { svgStrokeDasharrayAttrFragment } from "../presets/lineStyleRendering.mjs";

// Default stroke width in scene units; thin strokes keep geometry relationships clear.
const SCENE_STROKE_WIDTH = 1.0;
const SVG_NON_SCALING_STROKE_ATTR = `vector-effect="non-scaling-stroke"`;
const RENDER_DEFAULTS = {
  lineStroke: "#334",
  curveStroke: "#335",
  shapeFill: "#335",
  textFill: "#223",
  legacyRectFill: "#e8eef5",
};

/**
 * @typedef {{ color?: string, strokeColor?: string, fillColor?: string }} SceneRenderRoleColorProps
 *
 * @typedef {{
 *   roleColorsByName: Map<string, SceneRenderRoleColorProps>,
 *   nameToRole: Map<string, string>,
 *   lineStyleByName: Map<string, string>,
 * }} SceneRenderStyleRuntime
 *
 * Scene input for the public render entrypoints: v1 rects in `elements`, or v2 (`version >= 2`) with group `root` and valid `meta.previewFrame` for the tight viewBox.
 * @typedef {{
 *   version?: number,
 *   meta?: {
 *     title?: string,
 *     width?: number,
 *     height?: number,
 *     previewFrame?: unknown,
 *   },
 *   root?: import('../model/sceneModel.mjs').SceneNode,
 *   elements?: ReadonlyArray<{
 *     kind: string,
 *     x?: number,
 *     y?: number,
 *     width?: number,
 *     height?: number,
 *   }>,
 * }} SceneRenderInput
 *
 * @typedef {{
 *   styleRuntime?: SceneRenderStyleRuntime,
 *   debug?: { previewFrame?: boolean },
 * }} RenderSceneSvgOptions
 *
 * @typedef {{ styleRuntime?: SceneRenderStyleRuntime }} RenderSceneHtmlOptions
 */

/** Padding inside viewBox units (scene pixels) around computed content. */
const VIEW_BOX_PAD = 0;
const SCENE_HTML_PAD_PX = 16;

/**
 * Render a scene model into HTML with inline SVG.
 * v2 scenes require `scene.meta.previewFrame` (scene-space AABB).
 *
 * @param {SceneRenderInput} scene
 * @param {RenderSceneHtmlOptions} [opts]
 * @returns {string}
 * @throws {Error} v2 scene without a valid `meta.previewFrame` (see {@link computeViewBox})
 */
export function renderSceneHtml(scene, opts = {}) {
  const vb = computeViewBox(scene);
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(String(scene.meta?.title ?? "scene"))}</title>
  <style>
    html, body { height: 100%; margin: 0; background: #000; }
    body {
      display: flex;
      align-items: center;
      justify-content: center;
      box-sizing: border-box;
      padding: ${SCENE_HTML_PAD_PX / 2}px;
    }
    svg {
      display: block;
      flex-shrink: 0;
      width: min(calc(100vw - ${SCENE_HTML_PAD_PX}px), calc((100vh - ${SCENE_HTML_PAD_PX}px) * ${vb.vbW} / ${vb.vbH}));
      height: auto;
      max-height: calc(100vh - ${SCENE_HTML_PAD_PX}px);
    }
  </style>
</head>
<body>
${sceneToSvgInline(scene, vb, opts)}
</body>
</html>
`;
  return html;
}

/**
 * Render a scene model into inline SVG only (no HTML wrapper).
 *
 * @param {SceneRenderInput} scene
 * @param {RenderSceneSvgOptions} [opts]
 * @returns {string}
 * @throws {Error} v2 scene without a valid `meta.previewFrame`, or v2 primitive without `styleRuntime` / leaf style binding (see {@link computeViewBox}, {@link resolveLeafNamedStyleProps})
 */
export function renderSceneSvg(scene, opts = {}) {
  const vb = computeViewBox(scene);
  return sceneToSvgInline(scene, vb, opts);
}

/**
 * Tight viewBox in root SVG coordinates so the graphic scales to the diagram, not the full canvas.
 * Scene coords are y-up; root SVG uses y-down with `translate(0,canvasH) scale(1,-1)` on content.
 *
 * @param {SceneRenderInput} scene
 * @returns {{ vbX: number, vbY: number, vbW: number, vbH: number, canvasH: number }}
 * @throws {Error} v2 scene graph without a finite positive `meta.previewFrame` AABB
 */
function computeViewBox(scene) {
  const w = Number(scene.meta?.width) || 400;
  const h = Number(scene.meta?.height) || 300;
  const useV2 =
    scene.version >= 2 && scene.root != null && scene.root.kind === "group";
  if (!useV2) {
    return { vbX: 0, vbY: 0, vbW: w, vbH: h, canvasH: h };
  }
  const pf = scene.meta?.previewFrame;
  if (!isValidPreviewFrame(pf)) {
    throw new Error(
      "v2 scene.meta.previewFrame is required: { minX, maxX, minY, maxY } in scene space (computed from scene primitives in toScene)",
    );
  }
  const vbX = pf.minX - VIEW_BOX_PAD;
  const vbY = h - pf.maxY - VIEW_BOX_PAD;
  const vbW = pf.maxX - pf.minX + 2 * VIEW_BOX_PAD;
  const vbH = pf.maxY - pf.minY + 2 * VIEW_BOX_PAD;
  return { vbX, vbY, vbW, vbH, canvasH: h };
}

/**
 * @param {unknown} pf
 * @returns {pf is { minX: number, maxX: number, minY: number, maxY: number }}
 */
function isValidPreviewFrame(pf) {
  if (pf == null || typeof pf !== "object") return false;
  const o = /** @type {Record<string, unknown>} */ (pf);
  const { minX, maxX, minY, maxY } = o;
  if (
    ![minX, maxX, minY, maxY].every(
      (v) => typeof v === "number" && Number.isFinite(v),
    )
  ) {
    return false;
  }
  return (
    /** @type {number} */ (maxX) - /** @type {number} */ (minX) > 1e-6 &&
    /** @type {number} */ (maxY) - /** @type {number} */ (minY) > 1e-6
  );
}

/**
 * @param {SceneRenderInput} scene
 * @param {{ vbX: number, vbY: number, vbW: number, vbH: number, canvasH: number }} vb
 * @param {RenderSceneSvgOptions} opts
 */
function sceneToSvgInline(scene, vb, opts) {
  const w = Number(scene.meta?.width) || 400;
  const h = Number(scene.meta?.height) || 300;
  const useV2 =
    scene.version >= 2 && scene.root != null && scene.root.kind === "group";

  if (!useV2) {
    return legacySceneToSvg(scene, w, h);
  }

  const markerDefs = collectArcArrowMarkers(scene.root, opts.styleRuntime);
  const defs = markerDefs.length > 0 ? `\n  <defs>\n${markerDefs.join("\n")}\n  </defs>` : "";
  const inner = renderNode(scene.root, opts.styleRuntime, null);
  const { vbX, vbY, vbW, vbH, canvasH } = vb;
  const pf = scene.meta?.previewFrame;
  const showPf = opts.debug?.previewFrame === true && isValidPreviewFrame(pf);
  const pfOverlay = showPf
    ? `\n    <g data-name="__debugPreviewFrame">\n      <rect x="${pf.minX}" y="${pf.minY}" width="${pf.maxX - pf.minX}" height="${pf.maxY - pf.minY}" fill="none" stroke="magenta" stroke-width="1" ${SVG_NON_SCALING_STROKE_ATTR} />\n      <line x1="${(pf.minX + pf.maxX) / 2}" y1="${pf.minY}" x2="${(pf.minX + pf.maxX) / 2}" y2="${pf.maxY}" stroke="magenta" stroke-width="1" ${SVG_NON_SCALING_STROKE_ATTR} />\n      <line x1="${pf.minX}" y1="${(pf.minY + pf.maxY) / 2}" x2="${pf.maxX}" y2="${(pf.minY + pf.maxY) / 2}" stroke="magenta" stroke-width="1" ${SVG_NON_SCALING_STROKE_ATTR} />\n    </g>`
    : "";

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${vbW}" height="${vbH}" viewBox="${vbX} ${vbY} ${vbW} ${vbH}" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
${defs}
  <g transform="translate(0,${canvasH}) scale(1,-1)">
${pfOverlay}
${inner}
  </g>
</svg>`;
}

/** @param {import('../model/sceneModel.mjs').SceneNode} node */
function renderNode(node, styleRuntime, leafName) {
  switch (node.kind) {
    case "group": {
      const strokeJoinAttrs =
        node.name === "TimePointer"
          ? ' stroke-linecap="round" stroke-linejoin="round"'
          : "";
      const body = node.children
        .map((c) => renderNode(c, styleRuntime, node.name))
        .join("\n    ");
      return `    <g data-name="${escapeAttr(node.name)}"${strokeJoinAttrs}>\n    ${body}\n    </g>`;
    }
    case "line": {
      assertLeafScoped(node.kind, leafName);
      const { start: a, end: b } = node;
      const stroke = requireLeafStrokeColor(
        styleRuntime,
        leafName,
        RENDER_DEFAULTS.lineStroke,
        node.kind,
      );
      const dash = strokeDashAttrFragmentFromLeaf(
        styleRuntime,
        leafName,
        node.kind,
      );
      return `    <line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" stroke="${stroke}" stroke-width="${SCENE_STROKE_WIDTH}" ${SVG_NON_SCALING_STROKE_ATTR} fill="none"${dash} />`;
    }
    case "arc": {
      assertLeafScoped(node.kind, leafName);
      const stroke = requireLeafStrokeColor(
        styleRuntime,
        leafName,
        RENDER_DEFAULTS.curveStroke,
        node.kind,
      );
      const arrowAttr = markerAttrForArc(node, leafName, styleRuntime);
      const dash = strokeDashAttrFragmentFromLeaf(
        styleRuntime,
        leafName,
        node.kind,
      );
      if (node.facetedPreview === true) {
        const pts = circularArcToFacetedPoints(
          node.center,
          node.start,
          node.sweepRad,
        );
        if (pts === "") return "";
        return `    <polyline points="${escapeAttr(pts)}" stroke="${stroke}" stroke-width="${SCENE_STROKE_WIDTH}" ${SVG_NON_SCALING_STROKE_ATTR} fill="none" stroke-linejoin="round" stroke-linecap="round"${dash}${arrowAttr} />`;
      }
      const d = circularArcToPathD(node.center, node.start, node.sweepRad);
      return `    <path d="${escapeAttr(d)}" stroke="${stroke}" stroke-width="${SCENE_STROKE_WIDTH}" ${SVG_NON_SCALING_STROKE_ATTR} fill="none" shape-rendering="geometricPrecision"${dash}${arrowAttr} />`;
    }
    case "arcSegment": {
      assertLeafScoped(node.kind, leafName);
      const stroke = requireLeafStrokeColor(
        styleRuntime,
        leafName,
        RENDER_DEFAULTS.curveStroke,
        node.kind,
      );
      const fill = requireLeafFillColor(
        styleRuntime,
        leafName,
        RENDER_DEFAULTS.shapeFill,
        node.kind,
      );
      const dash = strokeDashAttrFragmentFromLeaf(
        styleRuntime,
        leafName,
        node.kind,
      );
      const d = circularSegmentToPathD(node.center, node.start, node.sweepRad);
      if (d === "") return "";
      return `    <path d="${escapeAttr(d)}" fill="${fill}" stroke="${stroke}" stroke-width="${SCENE_STROKE_WIDTH}" ${SVG_NON_SCALING_STROKE_ATTR} shape-rendering="geometricPrecision"${dash} />`;
    }
    case "annularSector": {
      assertLeafScoped(node.kind, leafName);
      const stroke = requireLeafStrokeColor(
        styleRuntime,
        leafName,
        RENDER_DEFAULTS.curveStroke,
        node.kind,
      );
      const fill = requireLeafFillColor(
        styleRuntime,
        leafName,
        RENDER_DEFAULTS.shapeFill,
        node.kind,
      );
      const dash = strokeDashAttrFragmentFromLeaf(
        styleRuntime,
        leafName,
        node.kind,
      );
      const d = annularSectorToPathD(node);
      if (d === "") return "";
      return `    <path d="${escapeAttr(d)}" fill="${fill}" stroke="${stroke}" stroke-width="${SCENE_STROKE_WIDTH}" ${SVG_NON_SCALING_STROKE_ATTR} shape-rendering="geometricPrecision"${dash} />`;
    }
    case "triangle": {
      assertLeafScoped(node.kind, leafName);
      const { a, b, c } = node;
      const pts = `${a.x},${a.y} ${b.x},${b.y} ${c.x},${c.y}`;
      const stroke = requireLeafStrokeColor(
        styleRuntime,
        leafName,
        RENDER_DEFAULTS.curveStroke,
        node.kind,
      );
      const dash = strokeDashAttrFragmentFromLeaf(
        styleRuntime,
        leafName,
        node.kind,
      );
      const fillAttr = node.outline
        ? "none"
          : requireLeafFillColor(
            styleRuntime,
            leafName,
            RENDER_DEFAULTS.shapeFill,
            node.kind,
          );
      return `    <polygon points="${escapeAttr(pts)}" fill="${fillAttr}" stroke="${stroke}" stroke-width="${SCENE_STROKE_WIDTH}" ${SVG_NON_SCALING_STROKE_ATTR}${dash} />`;
    }
    case "circle": {
      assertLeafScoped(node.kind, leafName);
      const { center, radius } = node;
      const stroke = requireLeafStrokeColor(
        styleRuntime,
        leafName,
        RENDER_DEFAULTS.curveStroke,
        node.kind,
      );
      const dash = strokeDashAttrFragmentFromLeaf(
        styleRuntime,
        leafName,
        node.kind,
      );
      const fill = requireLeafFillColor(
        styleRuntime,
        leafName,
        RENDER_DEFAULTS.shapeFill,
        node.kind,
      );
      return `    <circle cx="${center.x}" cy="${center.y}" r="${radius}" fill="${fill}" stroke="${stroke}" stroke-width="${SCENE_STROKE_WIDTH}" ${SVG_NON_SCALING_STROKE_ATTR}${dash} />`;
    }
    case "roundedRect": {
      assertLeafScoped(node.kind, leafName);
      const { center, width, height, rx } = node;
      const stroke = requireLeafStrokeColor(
        styleRuntime,
        leafName,
        RENDER_DEFAULTS.curveStroke,
        node.kind,
      );
      const dash = strokeDashAttrFragmentFromLeaf(
        styleRuntime,
        leafName,
        node.kind,
      );
      const fill = requireLeafFillColor(
        styleRuntime,
        leafName,
        RENDER_DEFAULTS.shapeFill,
        node.kind,
      );
      const x = center.x - 0.5 * width;
      const y = center.y - 0.5 * height;
      return `    <rect x="${x}" y="${y}" width="${width}" height="${height}" rx="${rx}" ry="${rx}" fill="${fill}" stroke="${stroke}" stroke-width="${SCENE_STROKE_WIDTH}" ${SVG_NON_SCALING_STROKE_ATTR}${dash} />`;
    }
    case "text": {
      assertLeafScoped(node.kind, leafName);
      const fill = requireLeafFillColor(
        styleRuntime,
        leafName,
        RENDER_DEFAULTS.textFill,
        node.kind,
      );
      return renderTextSvg(node, fill);
    }
    default:
      return "";
  }
}

const PI_TOL = 1e-9;

/**
 * Sample a circular arc in scene space (y up, CCW sweep) for `<polyline points="...">`.
 *
 * @returns {string} space-separated "x,y" pairs, or "" if degenerate
 */
function circularArcToFacetedPoints(center, start, sweepRad) {
  const r = Math.hypot(start.x - center.x, start.y - center.y);
  if (r < 1e-9) return "";
  const a0 = Math.atan2(start.y - center.y, start.x - center.x);
  const n = Math.max(
    16,
    Math.ceil((32 * Math.abs(sweepRad)) / (2 * Math.PI)),
  );
  const parts = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const a = a0 + sweepRad * t;
    parts.push(
      `${center.x + r * Math.cos(a)},${center.y + r * Math.sin(a)}`,
    );
  }
  return parts.join(" ");
}

/**
 * One SVG elliptical-arc segment (rx = ry = r). Scene space: y up, CCW positive sweep.
 *
 * @param {boolean} moveToStart if true, prefix with `M start`; if false, continue current subpath (chained `A`).
 */
function ellipseArcSegmentD(center, start, sweepRad, moveToStart) {
  const r = Math.hypot(start.x - center.x, start.y - center.y);
  if (r < 1e-9) return "";
  const a0 = Math.atan2(start.y - center.y, start.x - center.x);
  const x0 = start.x;
  const y0 = start.y;
  const a1 = a0 + sweepRad;
  const x1 = center.x + r * Math.cos(a1);
  const y1 = center.y + r * Math.sin(a1);
  const largeArc = Math.abs(sweepRad) > Math.PI ? 1 : 0;
  const sweep = sweepRad >= 0 ? 1 : 0;
  const prefix = moveToStart ? `M ${x0} ${y0} ` : "";
  return `${prefix}A ${r} ${r} 0 ${largeArc} ${sweep} ${x1} ${y1}`;
}

/**
 * SVG `A` segment(s) only (no leading `M`), for chaining subpaths.
 *
 * @param {{ x: number, y: number }} center
 * @param {{ x: number, y: number }} start
 * @param {number} sweepRad signed angle in radians (CCW)
 * @returns {string}
 */
function circularArcToPathSegments(center, start, sweepRad) {
  const r = Math.hypot(start.x - center.x, start.y - center.y);
  if (r < 1e-9) return "";
  if (Math.abs(Math.abs(sweepRad) - Math.PI) < PI_TOL) {
    const half = sweepRad / 2;
    const a0 = Math.atan2(start.y - center.y, start.x - center.x);
    const mid = {
      x: center.x + r * Math.cos(a0 + half),
      y: center.y + r * Math.sin(a0 + half),
    };
    return `${ellipseArcSegmentD(center, start, half, false)} ${ellipseArcSegmentD(center, mid, half, false)}`;
  }
  return ellipseArcSegmentD(center, start, sweepRad, false);
}

/**
 * Circular arc as SVG path `d` (scene space, y up, CCW positive).
 *
 * @param {{ x: number, y: number }} center
 * @param {{ x: number, y: number }} start
 * @param {number} sweepRad signed angle in radians (CCW)
 */
function circularArcToPathD(center, start, sweepRad) {
  const r = Math.hypot(start.x - center.x, start.y - center.y);
  if (r < 1e-9) return "";
  const segs = circularArcToPathSegments(center, start, sweepRad);
  if (segs === "") return "";
  return `M ${start.x} ${start.y} ${segs}`;
}

/**
 * Closed annular sector: inner arc (CCW), radial out, outer arc (CW), close.
 *
 * @param {import('../model/sceneModel.mjs').AnnularSectorPrimitive} node
 * @returns {string} path `d` or "" if degenerate
 */
function annularSectorToPathD(node) {
  const { center, rInner, rOuter, thetaStart, sweepRad } = node;
  if (Math.abs(sweepRad) < 1e-12) return "";
  const innerStart = {
    x: center.x + rInner * Math.cos(thetaStart),
    y: center.y + rInner * Math.sin(thetaStart),
  };
  const outerEnd = {
    x: center.x + rOuter * Math.cos(thetaStart + sweepRad),
    y: center.y + rOuter * Math.sin(thetaStart + sweepRad),
  };
  const innerPath = circularArcToPathD(center, innerStart, sweepRad);
  if (innerPath === "") return "";
  const outerSegs = circularArcToPathSegments(center, outerEnd, -sweepRad);
  if (outerSegs === "") return "";
  return `${innerPath} L ${outerEnd.x} ${outerEnd.y} ${outerSegs} Z`;
}

/**
 * Closed circular segment: arc + straight chord between arc endpoints.
 *
 * @param {{ x: number, y: number }} center
 * @param {{ x: number, y: number }} start
 * @param {number} sweepRad
 * @returns {string}
 */
function circularSegmentToPathD(center, start, sweepRad) {
  const arcPath = circularArcToPathD(center, start, sweepRad);
  if (arcPath === "") return "";
  return `${arcPath} Z`;
}

/**
 * @param {import('../model/sceneModel.mjs').SceneNode} root
 * @param {SceneRenderStyleRuntime | undefined} styleRuntime
 * @returns {string[]}
 */
function collectArcArrowMarkers(root, styleRuntime) {
  /** @type {Map<string, string>} */
  const defs = new Map();

  /**
   * @param {import('../model/sceneModel.mjs').SceneNode} node
   * @param {string | null} leafName
   */
  function walk(node, leafName) {
    if (node.kind === "group") {
      for (const child of node.children) walk(child, node.name);
      return;
    }
    if (node.kind !== "arc" || node.arrow == null) return;
    const spec = normalizeArcArrow(node.arrow);
    if (spec.at !== "end") return;
    const stroke = requireLeafStrokeColor(
      styleRuntime,
      leafName,
      RENDER_DEFAULTS.curveStroke,
      node.kind,
    );
    const id = markerIdFromSpec(spec, stroke);
    if (defs.has(id)) return;
    defs.set(id, markerDefFromSpec(id, spec, stroke));
  }

  walk(root, null);
  return Array.from(defs.values());
}

/**
 * @param {import('../model/sceneModel.mjs').ArcPrimitive} arcNode
 * @param {string | null} leafName
 * @param {SceneRenderStyleRuntime | undefined} styleRuntime
 * @returns {string}
 */
function markerAttrForArc(arcNode, leafName, styleRuntime) {
  if (arcNode.arrow == null) return "";
  const spec = normalizeArcArrow(arcNode.arrow);
  if (spec.at !== "end") return "";
  const stroke = requireLeafStrokeColor(
    styleRuntime,
    leafName,
    RENDER_DEFAULTS.curveStroke,
    arcNode.kind,
  );
  return ` marker-end="url(#${markerIdFromSpec(spec, stroke)})"`;
}

/**
 * Coerces partial arrow metadata from the scene graph into the shape this renderer supports.
 * Placement is end-only (see `ArcArrowMeta` in `sceneModel.mjs`).
 *
 * @param {import('../model/sceneModel.mjs').ArcArrowMeta | { lengthK?: number, widthK?: number, insetK?: number, style?: string, scaleWithStroke?: boolean }} raw
 * @returns {{ at: 'end', lengthK: number, widthK: number, insetK: number, style: 'filled'|'open', scaleWithStroke: boolean }}
 */
function normalizeArcArrow(raw) {
  return {
    at: "end",
    lengthK: Math.max(0.01, Number.isFinite(raw.lengthK) ? Number(raw.lengthK) : 7),
    widthK: Math.max(0.01, Number.isFinite(raw.widthK) ? Number(raw.widthK) : 5),
    insetK: Number.isFinite(raw.insetK) ? Number(raw.insetK) : 0,
    style: raw.style === "open" ? "open" : "filled",
    scaleWithStroke: raw.scaleWithStroke !== false,
  };
}

/**
 * @param {{ at: 'end', lengthK: number, widthK: number, insetK: number, style: 'filled'|'open', scaleWithStroke: boolean }} spec
 * @param {string} strokeColor
 */
function markerIdFromSpec(spec, strokeColor) {
  const l = spec.lengthK.toFixed(3);
  const w = spec.widthK.toFixed(3);
  const i = spec.insetK.toFixed(3);
  const styleCode = spec.style === "open" ? "o" : "f";
  const unitCode = spec.scaleWithStroke ? "sw" : "uu";
  const colorCode = strokeColor.replaceAll("#", "h");
  return `arc-arrow-${styleCode}-${unitCode}-l${l}-w${w}-i${i}-c${colorCode}`.replaceAll(".", "_");
}

/**
 * @param {string} id
 * @param {{ lengthK: number, widthK: number, insetK: number, style: 'filled'|'open', scaleWithStroke: boolean }} spec
 * @param {string} strokeColor
 */
function markerDefFromSpec(id, spec, strokeColor) {
  const L = spec.lengthK;
  const W = spec.widthK;
  const halfW = 0.5 * W;
  const refX = L - spec.insetK;
  const markerUnits = spec.scaleWithStroke ? "strokeWidth" : "userSpaceOnUse";
  const fill = spec.style === "filled" ? strokeColor : "none";
  const stroke = strokeColor;
  const strokeWidth = spec.style === "open" ? 1.5 : 1.0;
  return `    <marker id="${escapeAttr(id)}" markerWidth="${L}" markerHeight="${W}" refX="${refX}" refY="${halfW}" orient="auto" markerUnits="${markerUnits}">
      <path d="M 0 0 L ${L} ${halfW} L 0 ${W} z" fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}" />
    </marker>`;
}

/** @param {import('../model/sceneModel.mjs').TextPrimitive} node */
function renderTextSvg(node, fillColor) {
  const { anchor, content, size, hAlign, angleRad } = node;
  const ax = anchor.x;
  const ay = anchor.y;
  const anchorAttr = textAnchorFor(hAlign);
  const deg = (-angleRad * 180) / Math.PI;
  const inner = escapeHtml(content);
  const baseline =
    node.dominantBaseline === "middle" ? "middle" : "alphabetic";
  // Scene->SVG uses scale(1,-1) on the root; that flips glyph outlines. A local scale(1,-1)
  // around the anchor restores upright text without changing the anchor position.
  return `    <g transform="translate(${ax}, ${ay}) scale(1,-1) translate(${-ax}, ${-ay})">
      <g transform="rotate(${deg}, ${ax}, ${ay})">
      <text x="${ax}" y="${ay}" font-size="${size}" fill="${fillColor}" text-anchor="${anchorAttr}" dominant-baseline="${baseline}" font-family="ui-monospace, SFMono-Regular, Menlo, Consolas, monospace">${inner}</text>
      </g>
    </g>`;
}

/**
 * Resolved role colors for a leaf group (geometry parent `data-name`), or undefined.
 *
 * @param {SceneRenderStyleRuntime | undefined} styleRuntime
 * @param {string | null} leafName
 * @param {string} primitiveKind
 * @returns {SceneRenderRoleColorProps | undefined}
 */
function resolveLeafRoleColorProps(styleRuntime, leafName, primitiveKind) {
  if (!styleRuntime) {
    throw new Error(
      `styleRuntime is required for v2 scenes (while rendering ${primitiveKind})`,
    );
  }
  if (!leafName) {
    throw new Error(
      `primitive "${primitiveKind}" is not nested under a leaf group`,
    );
  }
  const roleName = styleRuntime.nameToRole.get(leafName);
  if (!roleName) {
    throw new Error(
      `missing role binding for leaf group name "${leafName}" (while rendering ${primitiveKind})`,
    );
  }
  return styleRuntime.roleColorsByName.get(roleName);
}

/**
 * Leaf-level color: uses bound named style when `color` is set; otherwise fallback.
 *
 * @param {SceneRenderStyleRuntime | undefined} styleRuntime
 * @param {string | null} leafName
 * @param {string} fallback
 * @param {string} primitiveKind
 */
function requireLeafStrokeColor(styleRuntime, leafName, fallback, primitiveKind) {
  const styleProps = resolveLeafRoleColorProps(
    styleRuntime,
    leafName,
    primitiveKind,
  );
  if (!styleProps) return fallback;
  if (typeof styleProps.strokeColor === "string") return styleProps.strokeColor;
  if (typeof styleProps.color === "string") return styleProps.color;
  return fallback;
}

/**
 * Leaf-level fill color: prefers `fillColor`; falls back to `color`; then to primitive fallback.
 *
 * @param {SceneRenderStyleRuntime | undefined} styleRuntime
 * @param {string | null} leafName
 * @param {string} fallback
 * @param {string} primitiveKind
 */
function requireLeafFillColor(styleRuntime, leafName, fallback, primitiveKind) {
  const styleProps = resolveLeafRoleColorProps(
    styleRuntime,
    leafName,
    primitiveKind,
  );
  if (!styleProps) return fallback;
  if (typeof styleProps.fillColor === "string") return styleProps.fillColor;
  if (typeof styleProps.color === "string") return styleProps.color;
  return fallback;
}

/**
 * Optional `stroke-dasharray` from external leaf-level line-style binding.
 *
 * @param {SceneRenderStyleRuntime | undefined} styleRuntime
 * @param {string | null} leafName
 * @param {string} primitiveKind
 */
function strokeDashAttrFragmentFromLeaf(styleRuntime, leafName, primitiveKind) {
  resolveLeafRoleColorProps(styleRuntime, leafName, primitiveKind);
  const lineStyle =
    leafName && styleRuntime ? styleRuntime.lineStyleByName.get(leafName) : undefined;
  return svgStrokeDasharrayAttrFragment(lineStyle);
}

/**
 * Enforce that all primitives are nested under a named leaf group.
 *
 * @param {string} primitiveKind
 * @param {string | null} leafName
 */
function assertLeafScoped(primitiveKind, leafName) {
  if (!leafName) {
    throw new Error(
      `primitive "${primitiveKind}" is not nested under a leaf group`,
    );
  }
}

/** @param {'left'|'center'|'right'} h */
function textAnchorFor(h) {
  if (h === "left") return "start";
  if (h === "right") return "end";
  return "middle";
}

/**
 * v1 scene.json: `elements` rects in SVG coordinates (no y-flip).
 * @param {SceneRenderInput} scene
 */
function legacySceneToSvg(scene, w, h) {
  const rects = (scene.elements ?? []).filter((e) => e.kind === "rect");
  const rectsSvg = rects
    .map(
      (r) =>
        `<rect x="${r.x}" y="${r.y}" width="${r.width}" height="${r.height}" fill="${RENDER_DEFAULTS.legacyRectFill}" stroke="${RENDER_DEFAULTS.lineStroke}" stroke-width="1" ${SVG_NON_SCALING_STROKE_ATTR} />`,
    )
    .join("\n    ");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
  ${rectsSvg}
</svg>`;
}

function escapeHtml(s) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function escapeAttr(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;");
}
