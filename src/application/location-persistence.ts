import type { StorageLike } from "../infrastructure/storage-like";

export const LOCATION_STORAGE_KEY = "tideclock:location:v1";

/** Looe, Cornwall — default until the user sets a location (persisted on first load). */
export const DEFAULT_LOCATION_LOOE = { lat: 50.3578, lon: -4.4562 } as const;

function isValidCoordinate(lat: number, lon: number): boolean {
  return (
    Number.isFinite(lat) &&
    Number.isFinite(lon) &&
    lat >= -90 &&
    lat <= 90 &&
    lon >= -180 &&
    lon <= 180
  );
}

/**
 * Reads persisted lat/lon, or `null` if missing or invalid JSON/shape.
 */
export function readLocation(storage: StorageLike): { lat: number; lon: number } | null {
  const raw = storage.getItem(LOCATION_STORAGE_KEY);
  if (raw === null) {
    return null;
  }
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (typeof parsed !== "object" || parsed === null) {
      return null;
    }
    const lat = (parsed as { lat?: unknown }).lat;
    const lon = (parsed as { lon?: unknown }).lon;
    if (typeof lat !== "number" || typeof lon !== "number") {
      return null;
    }
    if (!isValidCoordinate(lat, lon)) {
      return null;
    }
    return { lat, lon };
  } catch {
    return null;
  }
}

/**
 * Persists coordinates (callers should validate before writing).
 */
export function writeLocation(storage: StorageLike, lat: number, lon: number): void {
  storage.setItem(LOCATION_STORAGE_KEY, JSON.stringify({ lat, lon }));
}

/**
 * Returns stored coordinates, or writes and returns {@link DEFAULT_LOCATION_LOOE} when none are stored.
 */
export function loadLocationWithDefaultPersist(
  storage: StorageLike
): { lat: number; lon: number } {
  const existing = readLocation(storage);
  if (existing !== null) {
    return existing;
  }
  writeLocation(storage, DEFAULT_LOCATION_LOOE.lat, DEFAULT_LOCATION_LOOE.lon);
  return { lat: DEFAULT_LOCATION_LOOE.lat, lon: DEFAULT_LOCATION_LOOE.lon };
}
