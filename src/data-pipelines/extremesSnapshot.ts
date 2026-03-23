import { TideExtreme, type TideExtremeType } from '../core-models/TideExtreme';
import { TideExtremesAtLocation } from '../core-models/TideExtremesAtLocation';

export const EXTREMES_SNAPSHOT_KEY = 'tide-extremes-at-location';

export interface ExtremesStorer {
  setItem(key: string, value: string): void;
}

export interface ExtremesLoader {
  getItem(key: string): string | null;
}

interface ExtremeRow {
  type: TideExtremeType;
  timeUtc: string;
  heightMetres: number;
}

interface StoredExtremesShape {
  latitude: number;
  longitude: number;
  extremes: ExtremeRow[];
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

export function serializeExtremesSnapshot(data: TideExtremesAtLocation): string {
  return JSON.stringify(data);
}

export function deserializeExtremesSnapshot(raw: string): TideExtremesAtLocation | undefined {
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!isStoredExtremes(parsed)) {
      return undefined;
    }

    return new TideExtremesAtLocation(
      parsed.latitude,
      parsed.longitude,
      parsed.extremes.map((extreme) => new TideExtreme(extreme.type, extreme.timeUtc, extreme.heightMetres))
    );
  } catch {
    return undefined;
  }
}
