import { describe, expect, it, vi } from 'vitest';

import {
  recordFirstCustomLocationIfNeeded,
  runUsageSpanCadenceTick,
} from './usageSpanCadenceRunner';
import { USAGE_SPAN_STORAGE_KEY } from '../infrastructure/analytics/usageSpanStorage';

function createMemoryStorage(initial: Record<string, string> = {}): Storage {
  const map = new Map(Object.entries(initial));
  return {
    get length() {
      return map.size;
    },
    clear() {
      map.clear();
    },
    getItem(key: string) {
      return map.get(key) ?? null;
    },
    key(index: number) {
      return [...map.keys()][index] ?? null;
    },
    removeItem(key: string) {
      map.delete(key);
    },
    setItem(key: string, value: string) {
      map.set(key, value);
    },
  };
}

describe('usageSpanCadenceRunner', () => {
  it('Given first tick When running cadence Then seeds firstVisitUtcMs without tracking it', () => {
    const storage = createMemoryStorage();
    const track = vi.fn<(name: string) => void>();

    runUsageSpanCadenceTick({
      loader: storage,
      storer: storage,
      nowUtcMs: () => 1_000,
      track,
      standalonePwa: () => false,
    });

    expect(track).not.toHaveBeenCalled();
    expect(JSON.parse(storage.getItem(USAGE_SPAN_STORAGE_KEY) ?? '{}')).toEqual({
      firstVisitUtcMs: 1_000,
      emitted: [],
    });
  });

  it('Given no custom anchor yet When recording first custom location Then persists anchor and tracks once', () => {
    const storage = createMemoryStorage();
    const track = vi.fn<(name: string) => void>();

    recordFirstCustomLocationIfNeeded({
      loader: storage,
      storer: storage,
      nowUtcMs: () => 2_000,
      track,
    });
    recordFirstCustomLocationIfNeeded({
      loader: storage,
      storer: storage,
      nowUtcMs: () => 9_000,
      track,
    });

    expect(track).toHaveBeenCalledOnce();
    expect(track).toHaveBeenCalledWith('first_custom_loc');
    expect(JSON.parse(storage.getItem(USAGE_SPAN_STORAGE_KEY) ?? '{}').firstCustomLocUtcMs).toBe(
      2_000,
    );
  });
});
