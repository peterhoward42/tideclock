/**
 * diagramGenerationCollaborator.ts is the `src/application/` façade into `src/diagram-generation/` (build, styles,
 * diagram→scene, re-exports used by spec builders and tests) with home tide styling from `diagram-config`, keeping UI
 * and application modules off `.mjs` internals and out of tide data fetching.
 */

import { homeTideStyleModel } from "../diagram-config";
import {
  buildDiagram,
  loadStyleModel,
  tideDiagramToScene,
} from "../diagram-generation/index.mjs";

/** Matches `tideDiagramModel.mjs` diagram-space coordinates. */
type DiagramPoint = { readonly x: number; readonly y: number };

type DiagramLineSeg = {
  readonly start: DiagramPoint;
  readonly end: DiagramPoint;
};

type RefArcSpec = {
  readonly center: DiagramPoint;
  readonly refRadius: number;
  readonly sweepRad: number;
  readonly thetaLeft: number;
  readonly thetaRight: number;
};

type DividorArcSpec = {
  /** Dimensionless k: arc radius is radiusK × refRadius. */
  readonly radiusK: number;
};

type TickMarkSpec = {
  readonly hour: number;
  readonly theta: number;
  readonly start: DiagramPoint;
  readonly end: DiagramPoint;
  /** Same radial length as RefArc→outward tick; from annular band outer edge inward. */
  readonly bandOuterInward: DiagramLineSeg;
};

type TickLabelSpec = {
  readonly hour: number;
  readonly theta: number;
  readonly content: string;
  readonly fontSize: number;
  readonly anchor: DiagramPoint;
};

type DiagramTextInst = {
  readonly content: string;
  readonly fontSize: number;
  readonly anchor: DiagramPoint;
  readonly hAlign?: "left" | "center" | "right";
};

type BrandDiagramSegment = {
  readonly leafName: string;
  readonly content: string;
  readonly anchor: DiagramPoint;
  readonly hAlign: "left";
  readonly dominantBaseline?: "alphabetic" | "middle";
};

/** Fixed **BrandTitle** · **BrandURL** line (with **Brand.separator**); **anchor** is the leading baseline at **B_left**. */
type BrandDiagram = {
  readonly fontSize: number;
  readonly anchor: DiagramPoint;
  readonly segments: readonly BrandDiagramSegment[];
};

type TideHeightLabelDiagram = {
  readonly content: string;
  readonly fontSize: number;
  readonly anchor: DiagramPoint;
  readonly arcCenter: DiagramPoint;
  readonly arcSweepRad: number;
};

type TideTimePointerSpec = {
  readonly triangle: {
    readonly v1: DiagramPoint;
    readonly v2: DiagramPoint;
    readonly v3: DiagramPoint;
  };
  readonly circle: { readonly center: DiagramPoint; readonly radius: number };
};

type TideMarkDiagram = {
  readonly timeHours: number;
  readonly theta: number;
  readonly heightLabel: TideHeightLabelDiagram;
  readonly timePointer: TideTimePointerSpec;
};

type AnnularBandDiagram = {
  readonly center: DiagramPoint;
  readonly rInner: number;
  readonly rOuter: number;
  readonly thetaLeft: number;
  readonly sweepRad: number;
};

type MainLabelDiagram = {
  readonly content: string;
  readonly fontSize: number;
  readonly anchor: DiagramPoint;
  readonly hAlign: "right";
};

type HomeMenuTriggerDiagram = {
  readonly center: DiagramPoint;
  /** Circular control diameter (diagram units). */
  readonly diameter: number;
  /** Half-length of each hamburger bar along X. */
  readonly iconBarHalfLength: number;
  /** Distance between adjacent bar centerlines along Y. */
  readonly iconBarCenterSpacing: number;
};

type HandTimeReadoutPartDiagram = {
  readonly timeContent: string;
  readonly nowTagContent: string;
  readonly fontSize: number;
  readonly anchor: DiagramPoint;
  readonly angleRad: number;
};

type HandDiagram = {
  readonly timeHours: number;
  readonly theta: number;
  readonly bossCircle: { readonly center: DiagramPoint; readonly radius: number };
  readonly arm: DiagramLineSeg;
  readonly armTimeReadout: HandTimeReadoutPartDiagram;
};

/**
 * Shape returned by {@link buildDiagram} in `buildDiagram.mjs` (see JSDoc on `TideDiagramDocument`
 * in `tideDiagramModel.mjs`). App code treats this as the diagram-generation boundary contract.
 */
export type TideDiagramDocument = {
  readonly version: number;
  readonly meta: { readonly title: string };
  readonly paintOrder?: {
    readonly overrides?: ReadonlyArray<{
      readonly name: string;
      readonly place: "before" | "after";
      readonly relativeTo: string;
    }>;
  };
  readonly refArc: RefArcSpec;
  readonly dividorArc: DividorArcSpec;
  readonly mainLabel: MainLabelDiagram;
  readonly tickMarks: TickMarkSpec[];
  readonly tickLabels: TickLabelSpec[];
  readonly tideMarks: TideMarkDiagram[];
  readonly annularBand: AnnularBandDiagram;
  readonly homeMenuTrigger: HomeMenuTriggerDiagram;
  readonly hand: HandDiagram;
  readonly brhcLocation: DiagramTextInst;
  readonly brhcDate: DiagramTextInst;
  /** Fixed brand line (**BrandTitle** / **Brand.separator** / **BrandURL**); **left** at **B_left**; baseline **`B_bottom + brandAboveBottom·R`**; font size from **`brandFontHeight`** (see tide-diagram spec §Brand). */
  readonly brand: BrandDiagram;
};

type ScenePoint = { readonly x: number; readonly y: number };

type SceneArcArrowMeta = {
  readonly at: "end";
  readonly lengthK: number;
  readonly widthK: number;
  readonly insetK: number;
  readonly style: "filled" | "open";
  readonly scaleWithStroke: boolean;
};

type SceneLinePrimitive = {
  readonly kind: "line";
  readonly start: ScenePoint;
  readonly end: ScenePoint;
};

type SceneArcPrimitive = {
  readonly kind: "arc";
  readonly center: ScenePoint;
  readonly start: ScenePoint;
  readonly sweepRad: number;
  readonly facetedPreview?: boolean;
  readonly arrow?: SceneArcArrowMeta;
};

type SceneTrianglePrimitive = {
  readonly kind: "triangle";
  readonly a: ScenePoint;
  readonly b: ScenePoint;
  readonly c: ScenePoint;
  readonly outline?: boolean;
};

type SceneCirclePrimitive = {
  readonly kind: "circle";
  readonly center: ScenePoint;
  readonly radius: number;
};

type SceneRoundedRectPrimitive = {
  readonly kind: "roundedRect";
  readonly center: ScenePoint;
  readonly width: number;
  readonly height: number;
  readonly rx: number;
};

type SceneAnnularSectorPrimitive = {
  readonly kind: "annularSector";
  readonly center: ScenePoint;
  readonly rInner: number;
  readonly rOuter: number;
  readonly thetaStart: number;
  readonly sweepRad: number;
  readonly fillOnly?: boolean;
};

type SceneTextPrimitive = {
  readonly kind: "text";
  readonly content: string;
  readonly size: number;
  readonly hAlign: "left" | "center" | "right";
  readonly angleRad: number;
  readonly anchor: ScenePoint;
  readonly dominantBaseline?: "alphabetic" | "middle";
};

type SceneGroupNode = {
  readonly kind: "group";
  readonly name: string;
  readonly children: SceneNode[];
};

type SceneNode =
  | SceneLinePrimitive
  | SceneArcPrimitive
  | SceneTrianglePrimitive
  | SceneCirclePrimitive
  | SceneRoundedRectPrimitive
  | SceneAnnularSectorPrimitive
  | SceneTextPrimitive
  | SceneGroupNode;

/**
 * Shape returned by {@link tideDiagramToScene} (see `SceneDocument` in `sceneModel.mjs`).
 */
export type TideSceneDocument = {
  readonly version: number;
  readonly meta: {
    readonly title: string;
    readonly previewFrame: {
      readonly minX: number;
      readonly maxX: number;
      readonly minY: number;
      readonly maxY: number;
    };
  };
  readonly root: SceneGroupNode;
};

/** Open object passed into diagram-generation; keys mirror the spec consumed by `buildDiagram`. */
export type DiagramGenerationSpec = Record<string, unknown>;

export type DiagramGenerationStyleRuntime = {
  readonly roleColorsByName: Map<
    string,
    {
      readonly color?: string;
      readonly strokeColor?: string;
      readonly fillColor?: string;
      readonly strokeWidth?: number;
      readonly opacity?: number;
      readonly fontWeight?: 400 | 700;
    }
  >;
  readonly nameToRole: Map<string, string>;
  readonly lineStyleByName: Map<string, string>;
};

export type DiagramGenerationOutput = {
  readonly diagram: TideDiagramDocument;
  readonly scene: TideSceneDocument;
  readonly styleRuntime: DiagramGenerationStyleRuntime;
};

export type DiagramGenerationCollaborator = {
  readonly generate: (spec: DiagramGenerationSpec) => DiagramGenerationOutput;
};

/**
 * Stable, app-facing entrypoint for diagram-generation orchestration.
 * Runtime-safe: composes pure modules from src/diagram-generation and product config from src/diagram-config.
 */
export function createDiagramGenerationCollaborator(): DiagramGenerationCollaborator {
  const styleRuntime = loadStyleModel(
    homeTideStyleModel,
  ) as DiagramGenerationStyleRuntime;
  return {
    generate(spec: DiagramGenerationSpec): DiagramGenerationOutput {
      const diagram = buildDiagram(spec) as TideDiagramDocument;
      const scene = tideDiagramToScene(diagram) as TideSceneDocument;
      return { diagram, scene, styleRuntime };
    },
  };
}

export {
  annularBandMaxX,
  buildDiagram,
  computeNextTideEventCore,
  formatIntervalHoursMinutes,
  parseCanonicalTimeOrThrow,
  renderSceneSvg,
} from "../diagram-generation/index.mjs";
