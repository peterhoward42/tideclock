import { describe, expect, it } from "vitest";
import type { StorageLike } from "../infrastructure/storage-like";
import {
  DEFAULT_LOCATION_LOOE,
  LOCATION_STORAGE_KEY,
  loadLocationWithDefaultPersist,
  readLocation,
  writeLocation,
} from "./location-persistence";

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

describe("location-persistence", () => {
  it("writes and reads coordinates", () => {
    const storage = new FakeStorage();
    writeLocation(storage, 50.1, -4.2);
    expect(readLocation(storage)).toEqual({ lat: 50.1, lon: -4.2 });
  });

  it("returns null for corrupt JSON", () => {
    const storage = new FakeStorage();
    storage.setItem(LOCATION_STORAGE_KEY, "not-json");
    expect(readLocation(storage)).toBeNull();
  });

  it("loadLocationWithDefaultPersist writes Looe when empty", () => {
    const storage = new FakeStorage();
    const loc = loadLocationWithDefaultPersist(storage);
    expect(loc).toEqual({
      lat: DEFAULT_LOCATION_LOOE.lat,
      lon: DEFAULT_LOCATION_LOOE.lon,
    });
    expect(readLocation(storage)).toEqual(loc);
  });

  it("loadLocationWithDefaultPersist leaves existing location unchanged", () => {
    const storage = new FakeStorage();
    writeLocation(storage, 51.5, -0.1);
    const loc = loadLocationWithDefaultPersist(storage);
    expect(loc).toEqual({ lat: 51.5, lon: -0.1 });
  });
});
