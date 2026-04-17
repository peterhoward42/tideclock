/**
 * extremesSnapshot.ts — Key, serde, and validation for persisted {@link TideExtremesAtLocation} JSON.
 * Consumed by fetch/slice/query layers. Kind: Adapter / boundary (persistence shape). Does not call the proxy.
 */

import { TideExtreme, type TideExtremeType } from '../core-models/TideExtreme';
import { TideExtremesAtLocation } from '../core-models/TideExtremesAtLocation';

/** Canonical `localStorage` key for a JSON snapshot of {@link TideExtremesAtLocation}. */
export const EXTREMES_SNAPSHOT_KEY = 'tide-extremes-at-location';

/** Write-side persistence seam for extremes snapshots (e.g. `localStorage` in production). */
export interface ExtremesStorer {
  setItem(key: string, value: string): void;
}

/** Read-side persistence seam for extremes snapshots. */
export interface ExtremesLoader {
  getItem(key: string): string | null;
}

interface ExtremeRow {
  readonly type: TideExtremeType;
  readonly timeUtc: string;
  readonly heightMetres: number;
}

interface StoredExtremesShape {
  readonly latitude: number;
  readonly longitude: number;
  readonly extremes: readonly ExtremeRow[];
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function isTideExtremeType(value: unknown): value is TideExtremeType {
  return value === 'high' || value === 'low';
}

function isExtremeRow(value: unknown): value is ExtremeRow {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const typed = value as Partial<ExtremeRow>;
  return (
    isTideExtremeType(typed.type) &&
    typeof typed.timeUtc === 'string' &&
    typed.timeUtc.trim() !== '' &&
    !Number.isNaN(Date.parse(typed.timeUtc)) &&
    isFiniteNumber(typed.heightMetres)
  );
}

function isStoredExtremes(value: unknown): value is StoredExtremesShape {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const typed = value as Partial<StoredExtremesShape>;
  return (
    isFiniteNumber(typed.latitude) &&
    isFiniteNumber(typed.longitude) &&
    Array.isArray(typed.extremes) &&
    typed.extremes.every((extreme) => isExtremeRow(extreme))
  );
}

export function serializeExtremesSnapshot(data: Readonly<TideExtremesAtLocation>): string {
  return JSON.stringify(data);
}

export function deserializeExtremesSnapshot(raw: string): TideExtremesAtLocation | undefined {
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!isStoredExtremes(parsed)) {
      return undefined;
    }

    return TideExtremesAtLocation.fromPossiblyUnordered(
      parsed.latitude,
      parsed.longitude,
      parsed.extremes.map((extreme) => new TideExtreme(extreme.type, extreme.timeUtc, extreme.heightMetres))
    );
  } catch {
    return undefined;
  }
}
