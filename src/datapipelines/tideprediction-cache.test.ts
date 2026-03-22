import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { TidePredictionsModel } from "../core-models/tide-predictions.svelte";
import { TidePredictionsCache, type StorageLike } from "./tideprediction-cache";

/** In-memory stand-in for `StorageLike` — no `window` required. */
class FakeStorage implements StorageLike {
  private readonly data = new Map<string, string>();

  getItem(key: string): string | null {
    return this.data.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.data.set(key, value);
  }

  removeItem(key: string): void {
    this.data.delete(key);
  }
}

/** Plain data that round-trips through `JSON.stringify` like real cached payloads. */
function modelStub(payload: Record<string, unknown> = {}): TidePredictionsModel {
  return payload as unknown as TidePredictionsModel;
}

describe("TidePredictionsCache", () => {
  const key = "test-cache-key";
  const maxAgeMs = 60_000;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2025-01-15T12:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("fetches when storage is empty and persists the result", async () => {
    const storage = new FakeStorage();
    const cache = new TidePredictionsCache({ key, maxAgeMs, storage });
    const model = modelStub({ id: "a" });
    const fetcher = vi.fn(async () => model);

    const out = await cache.getOrFetch(fetcher);

    expect(out).toBe(model);
    expect(fetcher).toHaveBeenCalledTimes(1);
    const raw = storage.getItem(key);
    expect(raw).not.toBeNull();
    const parsed = JSON.parse(raw!) as { value: Record<string, unknown>; fetchedAt: number };
    expect(parsed.fetchedAt).toBe(Date.now());
    expect(parsed.value).toEqual({ id: "a" });
  });

  it("returns cached data without calling the fetcher when fresh", async () => {
    const storage = new FakeStorage();
    const t0 = Date.now();
    const model = modelStub({ id: "cached" });
    storage.setItem(key, JSON.stringify({ value: model, fetchedAt: t0 }));
    const cache = new TidePredictionsCache({ key, maxAgeMs, storage });
    const fetcher = vi.fn(async () => modelStub({ id: "other" }));

    const out = await cache.getOrFetch(fetcher);

    expect(out).toEqual({ id: "cached" });
    expect(fetcher).not.toHaveBeenCalled();
  });

  it("refetches when the cached record is older than maxAgeMs", async () => {
    const storage = new FakeStorage();
    const staleTime = Date.now() - maxAgeMs - 1;
    const staleModel = modelStub({ id: "stale" });
    storage.setItem(
      key,
      JSON.stringify({ value: staleModel, fetchedAt: staleTime })
    );
    const cache = new TidePredictionsCache({ key, maxAgeMs, storage });
    const freshModel = modelStub({ id: "fresh" });
    const fetcher = vi.fn(async () => freshModel);

    const out = await cache.getOrFetch(fetcher);

    expect(out).toBe(freshModel);
    expect(fetcher).toHaveBeenCalledTimes(1);
    const parsed = JSON.parse(storage.getItem(key)!) as {
      value: { id: string };
      fetchedAt: number;
    };
    expect(parsed.value.id).toBe("fresh");
    expect(parsed.fetchedAt).toBe(Date.now());
  });

  it("treats age equal to maxAgeMs as still fresh", async () => {
    const storage = new FakeStorage();
    const t0 = Date.now() - maxAgeMs;
    const model = modelStub({ id: "edge" });
    storage.setItem(
      key,
      JSON.stringify({ value: model, fetchedAt: t0 })
    );
    const cache = new TidePredictionsCache({ key, maxAgeMs, storage });
    const fetcher = vi.fn(async () => modelStub({ id: "no" }));

    const out = await cache.getOrFetch(fetcher);

    expect(out).toEqual({ id: "edge" });
    expect(fetcher).not.toHaveBeenCalled();
  });

  it("clear removes the cache entry", () => {
    const storage = new FakeStorage();
    storage.setItem(key, "{}");
    const cache = new TidePredictionsCache({ key, maxAgeMs, storage });

    cache.clear();

    expect(storage.getItem(key)).toBeNull();
  });

  it("refetches and clears storage when stored JSON is invalid", async () => {
    const storage = new FakeStorage();
    storage.setItem(key, "not-json{");
    const cache = new TidePredictionsCache({ key, maxAgeMs, storage });
    const freshModel = modelStub({ id: "after-invalid" });
    const fetcher = vi.fn(async () => freshModel);

    const out = await cache.getOrFetch(fetcher);

    expect(out).toBe(freshModel);
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(() => JSON.parse(storage.getItem(key)!)).not.toThrow();
  });

  it("refetches and clears when the parsed record is not a valid shape", async () => {
    const storage = new FakeStorage();
    storage.setItem(key, JSON.stringify({ fetchedAt: "not-a-number", value: {} }));
    const cache = new TidePredictionsCache({ key, maxAgeMs, storage });
    const freshModel = modelStub({ id: "reshaped" });
    const fetcher = vi.fn(async () => freshModel);

    await cache.getOrFetch(fetcher);

    expect(fetcher).toHaveBeenCalledTimes(1);
    const parsed = JSON.parse(storage.getItem(key)!) as { fetchedAt: number };
    expect(typeof parsed.fetchedAt).toBe("number");
  });

  it("refetches when value is missing from the record", async () => {
    const storage = new FakeStorage();
    storage.setItem(key, JSON.stringify({ fetchedAt: Date.now() }));
    const cache = new TidePredictionsCache({ key, maxAgeMs, storage });
    const fetcher = vi.fn(async () => modelStub({ id: "recovered" }));

    await cache.getOrFetch(fetcher);

    expect(fetcher).toHaveBeenCalledTimes(1);
  });
});
