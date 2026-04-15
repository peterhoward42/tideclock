/**
 * diagramGenerationCollaborator.ts — Types and factory for `src/diagram-generation` (diagram + scene + styles).
 * Product style defaults: `src/diagram-config/homeTideStyleModel.ts`; `loadStyleModel` from diagram-generation.
 * Keeps app and tests on this boundary instead of `.mjs` internals. Kind: Adapter / boundary.
 * Does not source tide data.
 */

import { homeTideStyleModel } from "../diagram-config";
import {
  buildDiagram,
  loadStyleModel,
  tideDiagramToScene,
} from "../diagram-generation/index.mjs";

/** Matches `tideDiagramModel.mjs` diagram-space coordinates. */
type DiagramPoint = { readonly x: number; readonly y: number };

type RefArcSpec = {
  readonly center: DiagramPoint;
  readonly refRadius: number;
  readonly sweepRad: number;
  readonly thetaLeft: number;
  readonly thetaRight: number;
};

type TickMarkSpec = {
  readonly hour: number;
  readonly theta: number;
  readonly start: DiagramPoint;
  readonly end: DiagramPoint;
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

type DiagramTimeNowClockInst = {
  readonly hhmm: DiagramTextInst;
  readonly secondsColon: DiagramTextInst;
  readonly seconds: DiagramTextInst;
};

type CentreFrameArcSpec = {
  readonly center: DiagramPoint;
  readonly radius: number;
  readonly sweepRad: number;
  readonly thetaLeft: number;
  readonly thetaRight: number;
};

type DiagramLineSeg = {
  readonly start: DiagramPoint;
  readonly end: DiagramPoint;
};

type TimeDeltaDiagram = {
  readonly countdownStripes: DiagramTextInst[] | null;
  readonly timeDeltaEmptyMessage: DiagramTextInst | null;
};

type CentreFrameDiagram = {
  readonly frameArc: CentreFrameArcSpec;
};

type TideLabelTextInst = {
  readonly content: string;
  readonly fontSize: number;
  readonly anchor: DiagramPoint;
  readonly angleRad: number;
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
  readonly heightLabel: TideLabelTextInst;
  readonly timeLabel: TideLabelTextInst;
  readonly timePointer: TideTimePointerSpec;
};

type NowPointerTriangleDiagram = {
  readonly center: DiagramPoint;
  readonly vertex: DiagramPoint;
  readonly outerArcStart: DiagramPoint;
  readonly outerArcSweepRad: number;
};

type NowPointerDiagram = {
  readonly timeHours: number;
  readonly theta: number;
  readonly nowLabelBranch: "A" | "B";
  readonly radialLine: DiagramLineSeg | null;
  readonly nowLabel: TideLabelTextInst | null;
  readonly triangle?: NowPointerTriangleDiagram;
};

type NextPointerDiagram = {
  readonly timeHours: number;
  readonly theta: number;
  readonly radialLine: DiagramLineSeg;
  readonly circle: { readonly center: DiagramPoint; readonly radius: number };
};

type ArcArrowMeta = {
  readonly at: "end";
  readonly lengthK: number;
  readonly widthK: number;
  readonly insetK: number;
  readonly style: "filled" | "open";
  readonly scaleWithStroke: boolean;
};

type WaitArcDiagram = {
  readonly center: DiagramPoint;
  readonly radius: number;
  readonly thetaStart: number;
  readonly sweepRad: number;
  readonly arrow?: ArcArrowMeta;
};

type AnnularBandDiagram = {
  readonly center: DiagramPoint;
  readonly rInner: number;
  readonly rOuter: number;
  readonly thetaLeft: number;
  readonly sweepRad: number;
};

type InsideTrackDiagram = {
  readonly center: DiagramPoint;
  readonly radius: number;
  readonly thetaLeft: number;
  readonly sweepRad: number;
};

type HomeMenuTriggerDiagram = {
  readonly center: DiagramPoint;
  readonly radius: number;
  readonly labelSize: number;
  readonly label: string;
};

/**
 * Shape returned by {@link buildDiagram} in `buildDiagram.mjs` (see JSDoc on `TideDiagramDocument`
 * in `tideDiagramModel.mjs`). App code treats this as the diagram-generation boundary contract.
 */
export type TideDiagramDocument = {
  readonly version: number;
  readonly meta: { readonly title: string; readonly width: number; readonly height: number };
  readonly refArc: RefArcSpec;
  readonly insideTrack: InsideTrackDiagram;
  readonly tickMarks: TickMarkSpec[];
  readonly tickLabels: TickLabelSpec[];
  readonly tideMarks: TideMarkDiagram[];
  readonly nowPointer: NowPointerDiagram;
  readonly nextPointer: NextPointerDiagram | null;
  readonly waitArc: WaitArcDiagram | null;
  readonly annularBand: AnnularBandDiagram;
  readonly homeMenuTrigger: HomeMenuTriggerDiagram;
  readonly timeDeltaDiagram: TimeDeltaDiagram;
  readonly centreFrameDiagram: CentreFrameDiagram;
  readonly timeNowDate: DiagramTextInst;
  readonly timeNowClock: DiagramTimeNowClockInst;
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

type SceneNowWedgeOutlinePrimitive = {
  readonly kind: "nowWedgeOutline";
  readonly center: ScenePoint;
  readonly vertex: ScenePoint;
  readonly outerArcStart: ScenePoint;
  readonly outerArcSweepRad: number;
};

type SceneCirclePrimitive = {
  readonly kind: "circle";
  readonly center: ScenePoint;
  readonly radius: number;
};

type SceneAnnularSectorPrimitive = {
  readonly kind: "annularSector";
  readonly center: ScenePoint;
  readonly rInner: number;
  readonly rOuter: number;
  readonly thetaStart: number;
  readonly sweepRad: number;
};

type SceneTextPrimitive = {
  readonly kind: "text";
  readonly content: string;
  readonly size: number;
  readonly hAlign: "left" | "center" | "right";
  readonly angleRad: number;
  readonly anchor: ScenePoint;
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
  | SceneNowWedgeOutlinePrimitive
  | SceneCirclePrimitive
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
    readonly width: number;
    readonly height: number;
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
    { readonly color?: string; readonly strokeColor?: string; readonly fillColor?: string }
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
