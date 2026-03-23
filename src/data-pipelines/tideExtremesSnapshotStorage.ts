import { TideExtreme, type TideExtremeType } from '../core-models/TideExtreme';
import { TideExtremesAtLocation } from '../core-models/TideExtremesAtLocation';

export const TIDE_EXTREMES_LOCAL_STORAGE_KEY = 'tide-extremes-at-location';

export interface TideExtremesStorer {
  setItem(key: string, value: string): void;
}

export interface TideExtremesLoader {
  getItem(key: string): string | null;
}

interface TideExtremeSnapshot {
  type: TideExtremeType;
  timeUtc: string;
  heightMetres: number;
}

interface TideExtremesAtLocationSnapshot {
  latitude: number;
  longitude: number;
  extremes: TideExtremeSnapshot[];
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function isTideExtremeType(value: unknown): value is TideExtremeType {
  return value === 'high' || value === 'low';
}

function isTideExtremeSnapshot(value: unknown): value is TideExtremeSnapshot {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const typed = value as Partial<TideExtremeSnapshot>;
  return (
    isTideExtremeType(typed.type) &&
    typeof typed.timeUtc === 'string' &&
    typed.timeUtc.trim() !== '' &&
    !Number.isNaN(Date.parse(typed.timeUtc)) &&
    isFiniteNumber(typed.heightMetres)
  );
}

function isTideExtremesAtLocationSnapshot(value: unknown): value is TideExtremesAtLocationSnapshot {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const typed = value as Partial<TideExtremesAtLocationSnapshot>;
  return (
    isFiniteNumber(typed.latitude) &&
    isFiniteNumber(typed.longitude) &&
    Array.isArray(typed.extremes) &&
    typed.extremes.every((extreme) => isTideExtremeSnapshot(extreme))
  );
}

export function serializeTideExtremesAtLocation(data: TideExtremesAtLocation): string {
  return JSON.stringify(data);
}

export function deserializeTideExtremesAtLocation(raw: string): TideExtremesAtLocation | undefined {
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!isTideExtremesAtLocationSnapshot(parsed)) {
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
