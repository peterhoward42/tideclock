import type { StorageLike } from "./storage-like";

/**
 * {@link StorageLike} adapter over the browser `localStorage` API.
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
