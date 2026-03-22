import type { TidePredictionsModel } from "../core-models/tide-predictions";
import type { StorageLike } from "../infrastructure/storage-like";

/** Async loader invoked on cache miss or when stored `expiresAt` (exclusive) is no longer in the future. */
export type Fetcher<T> = () => Promise<T>;

interface CacheRecord<T> {
  value: T;
  fetchedAt: number;
  lat?: number;
  lon?: number;
}

export interface TidePredictionsCacheLocation {
  lat: number;
  lon: number;
}

function cacheLocationMatches(
  record: CacheRecord<TidePredictionsModel>,
  location: TidePredictionsCacheLocation
): boolean {
  return (
    typeof record.lat === "number" &&
    typeof record.lon === "number" &&
    record.lat === location.lat &&
    record.lon === location.lon
  );
}

/** Proxy `expiresAt` is exclusive; treat cached data as fresh while `now < expiresAt`. */
function predictionsStillValid(model: TidePredictionsModel, nowMs: number): boolean {
  if (typeof model.expiresAt !== "string") {
    return false;
  }
  const endMs = Date.parse(model.expiresAt);
  if (Number.isNaN(endMs)) {
    return false;
  }
  return nowMs < endMs;
}

/**
 * TidePredictionsCache JSON-serializes `TidePredictionsModel` under a storage key, serves it while `now < expiresAt` (exclusive end from the proxy), and refetches otherwise.
 */
export class TidePredictionsCache {
  private readonly key: string;
  private readonly storage: StorageLike;

  constructor(options: { key: string; storage?: StorageLike }) {
    this.key = options.key;
    this.storage = options.storage ?? window.localStorage;
  }

  /**
   * getOrFetch returns storage-backed predictions when still valid **for this lat/lon**; otherwise runs `fetcher`, persists, and returns the new model.
   * A hit requires `expiresAt` still in the future and matching coordinates on the stored record (otherwise it is a miss and the fetcher runs).
   */
  async getOrFetch(
    fetcher: Fetcher<TidePredictionsModel>,
    location: TidePredictionsCacheLocation
  ): Promise<TidePredictionsModel> {
    const record = this.readRecord();
    const now = Date.now();
    const stale =
      record !== null && !predictionsStillValid(record.value, now);
    console.log("[tideclock] tides cache: getOrFetch — storage snapshot", {
      key: this.key,
      hasUsableRecord: record !== null,
      stale: record !== null ? stale : undefined,
    });

    const cached = this.readFresh(location);
    if (cached !== null) {
      console.log("[tideclock] tides cache: hit — returning cached model, fetcher will not run", {
        extremes: cached.extremes.length,
      });
      return cached;
    }

    console.log(
      "[tideclock] tides cache: miss — calling fetcher (tide proxy GET /v1/tides should run next)"
    );
    const fresh = await fetcher();
    this.write(fresh, location);
    console.log("[tideclock] tides cache: wrote fresh result to storage", {
      extremes: fresh.extremes.length,
    });
    return fresh;
  }

  /**
   * Removes the cached value entirely.
   */
  clear(): void {
    this.storage.removeItem(this.key);
  }

  private readFresh(location: TidePredictionsCacheLocation): TidePredictionsModel | null {
    const record = this.readRecord();
    if (record === null) {
      return null;
    }

    if (!predictionsStillValid(record.value, Date.now())) {
      return null;
    }

    if (!cacheLocationMatches(record, location)) {
      return null;
    }

    return record.value;
  }

  private readRecord(): CacheRecord<TidePredictionsModel> | null {
    const raw = this.storage.getItem(this.key);
    if (raw === null) {
      return null;
    }

    try {
      const parsed = JSON.parse(raw) as CacheRecord<TidePredictionsModel>;

      if (
        typeof parsed !== "object" ||
        parsed === null ||
        typeof parsed.fetchedAt !== "number" ||
        !("value" in parsed)
      ) {
        this.clear();
        return null;
      }

      return parsed;
    } catch {
      this.clear();
      return null;
    }
  }

  private write(value: TidePredictionsModel, location: TidePredictionsCacheLocation): void {
    const record: CacheRecord<TidePredictionsModel> = {
      value,
      fetchedAt: Date.now(),
      lat: location.lat,
      lon: location.lon,
    };

    this.storage.setItem(this.key, JSON.stringify(record));
  }
}
