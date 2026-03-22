import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LocalStorageFacade } from "./local-storage-facade";

/** Minimal in-memory `Storage` for Node tests (`environment: 'node'`). */
function createMemoryStorage(): Storage {
  const data = new Map<string, string>();
  return {
    get length() {
      return data.size;
    },
    clear() {
      data.clear();
    },
    getItem(key: string) {
      return data.get(key) ?? null;
    },
    key(index: number) {
      return [...data.keys()][index] ?? null;
    },
    removeItem(key: string) {
      data.delete(key);
    },
    setItem(key: string, value: string) {
      data.set(key, value);
    },
  };
}

describe("LocalStorageFacade", () => {
  beforeEach(() => {
    vi.stubGlobal("localStorage", createMemoryStorage());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns null from getItem when the key is absent", () => {
    const facade = new LocalStorageFacade();

    expect(facade.getItem("missing")).toBeNull();
  });

  it("persists values via setItem and reads them back with getItem", () => {
    const facade = new LocalStorageFacade();

    facade.setItem("k", "v");

    expect(facade.getItem("k")).toBe("v");
    expect(localStorage.getItem("k")).toBe("v");
  });

  it("removes a key with removeItem", () => {
    const facade = new LocalStorageFacade();
    facade.setItem("k", "v");

    facade.removeItem("k");

    expect(facade.getItem("k")).toBeNull();
    expect(localStorage.getItem("k")).toBeNull();
  });

  it("shares storage across facade instances", () => {
    const a = new LocalStorageFacade();
    const b = new LocalStorageFacade();

    a.setItem("shared", "1");

    expect(b.getItem("shared")).toBe("1");
  });
});
