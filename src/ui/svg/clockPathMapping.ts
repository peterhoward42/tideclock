import {
  DEFAULT_DIVISION_TICK_LENGTH,
  divisionTickSegmentsGeometry,
} from '../../clock-presentation/clockDivisionGeometry';
import type { ClockSceneModel } from '../../clock-presentation/clockSceneModel';
import { REFERENCE_RADIUS } from '../../clock-presentation/normalizedDialSpace';

/**
 * ViewBox for dial content in centred normalized space: origin at dial centre, ±{@link REFERENCE_RADIUS}.
 */
export const CLOCK_DIAL_VIEW_BOX = `-50 -50 100 100`;

function fmt(n: number): string {
  const s = n.toFixed(6);
  return s === '-0.000000' ? '0.000000' : s;
}

export type SvgLineAttrs = {
  readonly x1: string;
  readonly y1: string;
  readonly x2: string;
  readonly y2: string;
};

export type SvgCircleAttrs = {
  readonly cx: string;
  readonly cy: string;
  readonly r: string;
};

/** SVG-oriented props for the reference ring + hour tick segments (centred user space). */
export type ClockDivisionDialSvgProps = {
  readonly viewBox: string;
  readonly outline: SvgCircleAttrs;
  readonly ticks: readonly SvgLineAttrs[];
};

export type ClockDivisionDialSvgOptions = {
  readonly tickLength?: number;
};

/**
 * Maps division tick geometry to SVG attribute bundles. Coordinates stay centre-based; the viewBox
 * matches {@link CLOCK_DIAL_VIEW_BOX}.
 */
export function clockDivisionDialSvgProps(
  scene: ClockSceneModel,
  options?: ClockDivisionDialSvgOptions,
): ClockDivisionDialSvgProps {
  const tickLength = options?.tickLength ?? DEFAULT_DIVISION_TICK_LENGTH;
  const segments = divisionTickSegmentsGeometry(scene, tickLength);
  return {
    viewBox: CLOCK_DIAL_VIEW_BOX,
    outline: {
      cx: fmt(0),
      cy: fmt(0),
      r: fmt(REFERENCE_RADIUS),
    },
    ticks: segments.map((s) => ({
      x1: fmt(s.inner.x),
      y1: fmt(s.inner.y),
      x2: fmt(s.outer.x),
      y2: fmt(s.outer.y),
    })),
  };
}
