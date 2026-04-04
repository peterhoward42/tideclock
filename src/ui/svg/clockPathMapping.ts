/**
 * clockPathMapping.ts — Maps `ClockSceneModel` to SVG attributes (viewBox, outline, tick segments).
 * Consumes clock-presentation geometry. Kind: Presentation. Does not fetch tides.
 */

import {
  DEFAULT_DIVISION_TICK_LENGTH,
  divisionTickSegmentsGeometry,
  type DivisionTickLength,
} from '../../clock-presentation/clockDivisionGeometry';
import type { ClockSceneModel } from '../../clock-presentation/clockSceneModel';
import {
  REFERENCE_DIAMETER,
  REFERENCE_RADIUS,
} from '../../clock-presentation/normalizedDialSpace';

/** Room past the geometric ring so centred strokes are not clipped at the viewBox edge (outline uses stroke-width 1). */
const DIAL_VIEW_BOX_PAD = 0.5;

/**
 * ViewBox for dial content in centred normalized space: origin at dial centre, nominal ±{@link REFERENCE_RADIUS},
 * with extra margin so outline strokes are not clipped at the cardinal tangents.
 */
export const CLOCK_DIAL_VIEW_BOX = `${-REFERENCE_RADIUS - DIAL_VIEW_BOX_PAD} ${-REFERENCE_RADIUS - DIAL_VIEW_BOX_PAD} ${REFERENCE_DIAMETER + 2 * DIAL_VIEW_BOX_PAD} ${REFERENCE_DIAMETER + 2 * DIAL_VIEW_BOX_PAD}`;

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

/**
 * Maps division tick geometry to SVG attribute bundles. Coordinates stay centre-based; the viewBox
 * matches {@link CLOCK_DIAL_VIEW_BOX}.
 *
 * {@link tickLength} defaults to {@link DEFAULT_DIVISION_TICK_LENGTH} from division geometry (same
 * contract as {@link divisionTickSegmentsGeometry}).
 */
export function clockDivisionDialSvgProps(
  scene: ClockSceneModel,
  tickLength: DivisionTickLength = DEFAULT_DIVISION_TICK_LENGTH,
): ClockDivisionDialSvgProps {
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
