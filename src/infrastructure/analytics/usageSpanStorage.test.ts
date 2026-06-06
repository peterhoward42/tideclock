import { describe, expect, it } from 'vitest';

import {
  readUsageSpanState,
  USAGE_SPAN_STORAGE_KEY,
  writeUsageSpanState,
} from './usageSpanStorage';

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

describe('usageSpanStorage', () => {
  it('Given empty storage When read Then returns empty anchors and emitted set', () => {
    const storage = createMemoryStorage();

    expect(readUsageSpanState(storage)).toEqual({
      firstVisitUtcMs: undefined,
      firstCustomLocUtcMs: undefined,
      emitted: [],
    });
  });

  it('Given persisted anchors When round-tripped Then preserves values', () => {
    const storage = createMemoryStorage();
    writeUsageSpanState(storage, {
      firstVisitUtcMs: 100,
      firstCustomLocUtcMs: 200,
      emitted: ['v_w1', 'launched_as_pwa'],
    });

    expect(readUsageSpanState(storage)).toEqual({
      firstVisitUtcMs: 100,
      firstCustomLocUtcMs: 200,
      emitted: ['v_w1', 'launched_as_pwa'],
    });
    expect(storage.getItem(USAGE_SPAN_STORAGE_KEY)).toContain('"firstVisitUtcMs":100');
  });

  it('Given invalid JSON When read Then returns empty state', () => {
    const storage = createMemoryStorage({
      [USAGE_SPAN_STORAGE_KEY]: '{not json',
    });

    expect(readUsageSpanState(storage)).toEqual({
      firstVisitUtcMs: undefined,
      firstCustomLocUtcMs: undefined,
      emitted: [],
    });
  });
});
