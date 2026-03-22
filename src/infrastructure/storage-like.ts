/**
 * Minimal string key/value persistence contract (matches the relevant subset of
 * the Web `Storage` API used by `localStorage` / `sessionStorage`).
 */
export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}
