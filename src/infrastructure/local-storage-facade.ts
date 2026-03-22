import type { StorageLike } from "./storage-like";

/**
 * LocalStorageFacade implements {@link StorageLike} by delegating to the global `localStorage` API (browser tests may stub it).
 */
export class LocalStorageFacade implements StorageLike {
  getItem(key: string): string | null {
    return localStorage.getItem(key);
  }

  setItem(key: string, value: string): void {
    localStorage.setItem(key, value);
  }

  removeItem(key: string): void {
    localStorage.removeItem(key);
  }
}
