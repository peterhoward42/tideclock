import {
  STATIC_STYLE_MODEL,
  buildDiagram,
  loadStyleModel,
  tideDiagramToScene,
} from "../diagram-generation/index.mjs";

export type DiagramGenerationSpec = Record<string, unknown>;

export type DiagramGenerationStyleRuntime = {
  readonly stylesByName: Map<
    string,
    { readonly color?: string; readonly lineStyle?: string }
  >;
  readonly nameToStyle: Map<string, string>;
};

export type DiagramGenerationOutput = {
  readonly diagram: unknown;
  readonly scene: unknown;
  readonly styleRuntime: DiagramGenerationStyleRuntime;
};

export type DiagramGenerationCollaborator = {
  readonly generate: (spec: DiagramGenerationSpec) => DiagramGenerationOutput;
};

/**
 * Stable, app-facing entrypoint for diagram-generation orchestration.
 * Runtime-safe: composes only pure modules from src/diagram-generation.
 */
export function createDiagramGenerationCollaborator(): DiagramGenerationCollaborator {
  const styleRuntime = loadStyleModel(STATIC_STYLE_MODEL) as DiagramGenerationStyleRuntime;
  return {
    generate(spec: DiagramGenerationSpec): DiagramGenerationOutput {
      const diagram = buildDiagram(spec);
      const scene = tideDiagramToScene(diagram);
      return { diagram, scene, styleRuntime };
    },
  };
}
