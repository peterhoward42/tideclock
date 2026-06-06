/**
 * usageSpanCadenceRunner.ts — Minute-tick orchestration for retention anchors and milestones.
 * Kind: Application helper. Composes storage, evaluation, and analytics track().
 */

import {
  ensureFirstVisitAnchor,
  evaluateUsageSpanMilestones,
  isStandaloneDisplayMode,
} from './usageSpanCadence';
import type { TelemetryEventType } from '../infrastructure/analytics/eventType';
import {
  readUsageSpanState,
  writeUsageSpanState,
  type UsageSpanState,
} from '../infrastructure/analytics/usageSpanStorage';
import type {
  UsageSpanLoader,
  UsageSpanStorer,
} from '../infrastructure/analytics/usageSpanStorage.types';

export type UsageSpanCadenceDeps = Readonly<{
  loader: UsageSpanLoader;
  storer: UsageSpanStorer;
  nowUtcMs: () => number;
  track: (name: TelemetryEventType) => void;
  standalonePwa: () => boolean;
}>;

function persistState(storer: UsageSpanStorer, state: UsageSpanState): void {
  writeUsageSpanState(storer, state);
}

/** Seeds first-visit anchor if needed; evaluates and emits due span/PWA milestones. */
export function runUsageSpanCadenceTick(deps: UsageSpanCadenceDeps): void {
  const nowUtcMs = deps.nowUtcMs();
  let state = readUsageSpanState(deps.loader);

  const visitAnchor = ensureFirstVisitAnchor(nowUtcMs, state.firstVisitUtcMs);
  if (visitAnchor.seeded) {
    state = { ...state, firstVisitUtcMs: visitAnchor.firstVisitUtcMs };
    persistState(deps.storer, state);
  }

  const evaluation = evaluateUsageSpanMilestones({
    nowUtcMs,
    firstVisitUtcMs: state.firstVisitUtcMs,
    firstCustomLocUtcMs: state.firstCustomLocUtcMs,
    emittedMilestoneIds: new Set(state.emitted),
    standalonePwa: deps.standalonePwa(),
  });

  for (const eventName of evaluation.eventsToTrack) {
    deps.track(eventName);
  }

  if (evaluation.newlyEmittedIds.length === 0) {
    return;
  }

  persistState(deps.storer, {
    ...state,
    emitted: [...state.emitted, ...evaluation.newlyEmittedIds],
  });
}

export type RecordFirstCustomLocationDeps = Readonly<{
  loader: UsageSpanLoader;
  storer: UsageSpanStorer;
  nowUtcMs: () => number;
  track: (name: TelemetryEventType) => void;
}>;

/** Persists the custom-location anchor and emits `first_custom_loc` once. */
export function recordFirstCustomLocationIfNeeded(deps: RecordFirstCustomLocationDeps): void {
  const state = readUsageSpanState(deps.loader);
  if (state.firstCustomLocUtcMs !== undefined) {
    return;
  }

  const nowUtcMs = deps.nowUtcMs();
  persistState(deps.storer, {
    ...state,
    firstCustomLocUtcMs: nowUtcMs,
  });
  deps.track('first_custom_loc');
}

export function createBrowserUsageSpanCadenceDeps(
  track: (name: TelemetryEventType) => void,
): UsageSpanCadenceDeps | undefined {
  if (typeof localStorage === 'undefined') {
    return undefined;
  }
  return {
    loader: localStorage,
    storer: localStorage,
    nowUtcMs: () => Date.now(),
    track,
    standalonePwa: isStandaloneDisplayMode,
  };
}

export function createBrowserFirstCustomLocationDeps(
  track: (name: TelemetryEventType) => void,
): RecordFirstCustomLocationDeps | undefined {
  if (typeof localStorage === 'undefined') {
    return undefined;
  }
  return {
    loader: localStorage,
    storer: localStorage,
    nowUtcMs: () => Date.now(),
    track,
  };
}
