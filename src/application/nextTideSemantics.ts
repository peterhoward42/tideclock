import {
  computeNextTideEventCore,
  formatIntervalHoursMinutes,
  parseCanonicalTimeOrThrow,
} from '../diagram-generation/index.mjs';
import type { DiagramGenerationSpec } from './diagramGenerationCollaborator';

/**
 * Minute-scale next-tide semantics: single derivation per tick, consumed by diagram layout
 * instead of re-scanning `tideMarks.markers`. Shapes mirror diagram-generation parsers
 * (`timeCanonical.mjs`, `tideEvents.mjs`).
 *
 * @see docs/planning/dynamics-planning.md — Next-event derivation, phased plan steps 1–3.
 * Inject into diagram specs as `spec.semantic.nextTide` (same shape as `nextTide` here, or `null`).
 */

/** Marker row fields used when scanning for the next tide (`computeNextTideEventCore`). */
export type DeriveNextTideSemanticsMarker = {
  readonly time: string;
  readonly highOrLow: string;
};

/**
 * Spec subset required for {@link deriveNextTideSemantics}. Values from
 * {@link buildDiagramGenerationSpec} satisfy this; {@link DiagramGenerationSpec} is accepted for
 * callers that assemble the full diagram object as a generic record.
 */
export type DeriveNextTideSemanticsSpec = {
  readonly timeNow: string;
  readonly tideMarks: {
    readonly markers: readonly DeriveNextTideSemanticsMarker[];
  };
};

/** Parsed `spec.timeNow` in the same sense as `parseCanonicalTimeOrThrow`. */
export type DiagramParsedTimeNow = {
  readonly canonical: string;
  /** Seconds since local midnight; `86400` only when `isRightEndpoint` (24:00:00). */
  readonly seconds: number;
  /** Fractional hours from the canonical parser (`seconds / 3600`). */
  readonly hours: number;
  readonly isRightEndpoint: boolean;
};

/**
 * Next qualifying tide marker at or after `timeNow` within the civil day, plus TimeDelta text.
 * `null` when no marker qualifies (same decision as `computeNextTideEventCore` → null).
 */
export type DiagramNextTideEvent = {
  /** Absolute seconds since midnight for the marker time. */
  readonly secondsSinceMidnight: number;
  /** Marker tide kind (`highOrLow` in spec). */
  readonly kind: string;
  /**
   * Forward interval from current `timeNow` to this event (`formatIntervalHoursMinutes` in tideEvents).
   * CentreCluster TimeDelta uses this after the fixed glue segment.
   */
  readonly timeDeltaIntervalText: string;
};

/**
 * One semantic refresh worth of next-event facts for NowPointer, TimeDelta, NextPointer, and WaitArc.
 * When `nextTide` is `null`, layout omits NextPointer and WaitArc; centre cluster keeps frame and **NoMoreTidesToday**; clock readout is **TimeNowLabel** at diagram root (see tide-diagram spec).
 * When there is no next tide or the gap is under one hour, diagram-generation also omits the Now radial line, Now label, and WaitArc (not the Now triangle) so they do not occlude NextPointer.
 * Angular layout uses `timeNow.hours` and `nextTide.secondsSinceMidnight / 3600` with `timeToTheta`.
 */
export type DerivedNextTideSemantics = {
  readonly timeNow: DiagramParsedTimeNow;
  readonly nextTide: DiagramNextTideEvent | null;
};

function diagramParsedTimeNowFromParser(
  p: ReturnType<typeof parseCanonicalTimeOrThrow>,
): DiagramParsedTimeNow {
  return {
    canonical: p.canonical,
    seconds: p.seconds,
    hours: p.hours,
    isRightEndpoint: p.isRightEndpoint,
  };
}

/**
 * Single application-layer derivation of next-tide semantics for a civil-day diagram spec.
 * Uses the same marker scan and interval formatting as `computeNextTideEventFromSpec` /
 * layout callers in diagram-generation.
 *
 * @param spec — `timeNow` plus `tideMarks.markers` (same inputs `computeNextTideEventCore` reads).
 */
export function deriveNextTideSemantics(
  spec: DeriveNextTideSemanticsSpec,
  options?: { readonly timeNowLabel?: string },
): DerivedNextTideSemantics;
export function deriveNextTideSemantics(
  spec: DiagramGenerationSpec,
  options?: { readonly timeNowLabel?: string },
): DerivedNextTideSemantics;
export function deriveNextTideSemantics(
  spec: DeriveNextTideSemanticsSpec | DiagramGenerationSpec,
  options?: { readonly timeNowLabel?: string },
): DerivedNextTideSemantics {
  const label = options?.timeNowLabel ?? 'spec.timeNow';
  const parsedRaw = parseCanonicalTimeOrThrow(spec.timeNow, label);
  const timeNow = diagramParsedTimeNowFromParser(parsedRaw);
  const core = computeNextTideEventCore(
    spec as Record<string, unknown>,
    parsedRaw,
  );
  if (core == null) {
    return { timeNow, nextTide: null };
  }
  const forwardSeconds = core.seconds - parsedRaw.seconds;
  return {
    timeNow,
    nextTide: {
      secondsSinceMidnight: core.seconds,
      kind: core.kind,
      timeDeltaIntervalText: formatIntervalHoursMinutes(forwardSeconds),
    },
  };
}
