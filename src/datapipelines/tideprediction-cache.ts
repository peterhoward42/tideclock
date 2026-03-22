import type { TidePredictionsModel } from "../core-models/tide-predictions";
import type { StorageLike } from "../infrastructure/storage-like";

export type Fetcher<T> = () => Promise<T>;

interface CacheRecord<T> {
  value: T;
  fetchedAt: number;
}

export class TidePredictionsCache {
  private readonly key: string;
  private readonly maxAgeMs: number;
  private readonly storage: StorageLike;

  constructor(options: {
    key: string;
    maxAgeMs: number;
    storage?: StorageLike;
  }) {
    this.key = options.key;
    this.maxAgeMs = options.maxAgeMs;
    this.storage = options.storage ?? window.localStorage;
  }

  /**
   * Returns cached data if it exists and is still fresh.
   * Otherwise fetches, stores, and returns fresh data.
   */
  async getOrFetch(fetcher: Fetcher<TidePredictionsModel>): Promise<TidePredictionsModel> {
    const record = this.readRecord();
    const ageMs = record !== null ? Date.now() - record.fetchedAt : null;
    const stale = record !== null && ageMs !== null && ageMs > this.maxAgeMs;
    console.log("[tideclock] tides cache: getOrFetch — storage snapshot", {
      key: this.key,
      maxAgeMs: this.maxAgeMs,
      hasUsableRecord: record !== null,
      ageMs: ageMs ?? undefined,
      stale: record !== null ? stale : undefined,
    });

    const cached = this.readFresh();
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
    this.write(fresh);
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

  private readFresh(): TidePredictionsModel | null {
    const record = this.readRecord();
    if (record === null) {
      return null;
    }

    const ageMs = Date.now() - record.fetchedAt;
    if (ageMs > this.maxAgeMs) {
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

  private write(value: TidePredictionsModel): void {
    const record: CacheRecord<TidePredictionsModel> = {
      value,
      fetchedAt: Date.now(),
    };

    this.storage.setItem(this.key, JSON.stringify(record));
  }
}