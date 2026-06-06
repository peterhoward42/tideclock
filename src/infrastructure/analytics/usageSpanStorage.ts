/**
 * usageSpanStorage.ts — UTC anchors and emitted milestone ids for retention telemetry.
 * Kind: Adapter / boundary. Per browser profile on this origin.
 */

import type { UsageSpanLoader, UsageSpanStorer } from './usageSpanStorage.types';

export type { UsageSpanLoader, UsageSpanStorer } from './usageSpanStorage.types';

export const USAGE_SPAN_STORAGE_KEY = 'tideclock.usageSpans';

export type UsageSpanState = Readonly<{
  firstVisitUtcMs: number | undefined;
  firstCustomLocUtcMs: number | undefined;
  emitted: readonly string[];
}>;

const EMPTY_STATE: UsageSpanState = {
  firstVisitUtcMs: undefined,
  firstCustomLocUtcMs: undefined,
  emitted: [],
};

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((entry) => typeof entry === 'string');
}

function parseUsageSpanState(raw: string): UsageSpanState {
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') {
      return EMPTY_STATE;
    }
    const record = parsed as Record<string, unknown>;
    const firstVisitUtcMs = isFiniteNumber(record.firstVisitUtcMs)
      ? record.firstVisitUtcMs
      : undefined;
    const firstCustomLocUtcMs = isFiniteNumber(record.firstCustomLocUtcMs)
      ? record.firstCustomLocUtcMs
      : undefined;
    const emitted = isStringArray(record.emitted) ? record.emitted : [];
    return { firstVisitUtcMs, firstCustomLocUtcMs, emitted };
  } catch {
    return EMPTY_STATE;
  }
}

export function readUsageSpanState(loader: UsageSpanLoader): UsageSpanState {
  try {
    const raw = loader.getItem(USAGE_SPAN_STORAGE_KEY);
    if (raw === null) {
      return EMPTY_STATE;
    }
    return parseUsageSpanState(raw);
  } catch {
    return EMPTY_STATE;
  }
}

export function writeUsageSpanState(storer: UsageSpanStorer, state: UsageSpanState): void {
  try {
    storer.setItem(
      USAGE_SPAN_STORAGE_KEY,
      JSON.stringify({
        firstVisitUtcMs: state.firstVisitUtcMs,
        firstCustomLocUtcMs: state.firstCustomLocUtcMs,
        emitted: [...state.emitted],
      }),
    );
  } catch {
    // ignore quota / private mode
  }
}
