import { describe, expect, it, beforeEach } from "vitest";
import {
  readKeepAwakeEnabled,
  writeKeepAwakeEnabled,
  readStandaloneSetupHiddenForever,
  writeStandaloneSetupHiddenForever,
} from "./pwaPreferences";

describe("pwaPreferences", () => {
  const store: Record<string, string> = {};
  const mockStorage: Storage = {
    get length() {
      return Object.keys(store).length;
    },
    clear: () => {
      for (const k of Object.keys(store)) {
        delete store[k];
      }
    },
    getItem: (k: string) => (k in store ? store[k] : null),
    key: (i: number) => Object.keys(store)[i] ?? null,
    removeItem: (k: string) => {
      delete store[k];
    },
    setItem: (k: string, v: string) => {
      store[k] = v;
    },
  };

  beforeEach(() => {
    for (const k of Object.keys(store)) {
      delete store[k];
    }
  });

  it("round-trips keep-screen-awake flag", () => {
    expect(readKeepAwakeEnabled(mockStorage)).toBe(false);
    writeKeepAwakeEnabled(mockStorage, true);
    expect(readKeepAwakeEnabled(mockStorage)).toBe(true);
    writeKeepAwakeEnabled(mockStorage, false);
    expect(readKeepAwakeEnabled(mockStorage)).toBe(false);
  });

  it("records standalone setup hidden forever", () => {
    expect(readStandaloneSetupHiddenForever(mockStorage)).toBe(false);
    writeStandaloneSetupHiddenForever(mockStorage);
    expect(readStandaloneSetupHiddenForever(mockStorage)).toBe(true);
  });
});
