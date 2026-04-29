/**
 * index.mjs — Public barrel for diagram-generation consumed via `diagramGenerationCollaborator.ts`.
 * Re-exports are the stable cross-package contract; keep names and shapes unchanged.
 * Kind: Adapter / boundary (module surface). Does not implement layout itself.
 *
 * Public diagram-generation surface: layout, scene mapping, SVG render, time/tide helpers, and style loading.
 */
export { buildDiagram } from "./layout/buildDiagram.mjs";
export {
  centreFrameDiagramToGroup,
  handDiagramToGroup,
  tideDiagramToScene,
  tideMarkDiagramToGroup,
  timeDeltaDiagramToGroup,
} from "./mapping/toScene.mjs";

export {
  annularBandMaxX,
  polar,
  refArcAngles,
  timeToTheta,
} from "./model/tideDiagramModel.mjs";
export {
  formatCanonicalHHMM,
  parseCanonicalTimeOrThrow,
} from "./model/timeCanonical.mjs";
export {
  computeNextTideEventCore,
  computeNextTideEventFromSpec,
  formatIntervalHoursMinutes,
  readOptionalInjectedNextTide,
} from "./model/tideEvents.mjs";

export { loadStyleModel } from "./presets/styleBindings.mjs";
export { renderSceneSvg } from "./render/renderSceneSvg.mjs";
