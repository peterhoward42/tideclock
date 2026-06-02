/**
 * proxyUserId.ts — Opaque per-browser installation id (ULID) for telemetry correlation.
 * Persisted in `localStorage`; initialized at boot via {@link initProxyUserIdAtBoot}.
 * Kind: Adapter / boundary (client identity). Does not emit telemetry events.
 */

import { ulid } from 'ulid';

/** Canonical `localStorage` key for the proxy user id (one browser profile / device). */
export const PROXY_USER_ID_KEY = 'tideclock.proxyUserId';

/** 26-character Crockford Base32 ULID (case-insensitive on read). */
export type ProxyUserId = string;

/** Read-side persistence seam for the proxy user id. */
export interface ProxyUserIdLoader {
  getItem(key: string): string | null;
}

/** Write-side persistence seam for the proxy user id. */
export interface ProxyUserIdStorer {
  setItem(key: string, value: string): void;
}

const ULID_PATTERN = /^[0-7][0-9A-HJKMNP-TV-Z]{25}$/;

/** Returns true when `value` is a well-formed ULID string. */
export function isValidUlid(value: string): value is ProxyUserId {
  return value.length === 26 && ULID_PATTERN.test(value);
}

export interface GetOrCreateProxyUserIdInput {
  readonly loader: ProxyUserIdLoader;
  readonly storer: ProxyUserIdStorer;
  /** Override for tests or an alternate slot; production uses {@link PROXY_USER_ID_KEY}. */
  readonly storageKey?: string;
  /** Test seam; production mints via `ulid`. */
  readonly mintId?: () => string;
}

/**
 * Returns a persisted proxy user id, minting and storing one when missing or invalid.
 * Returns `undefined` when storage is unavailable or throws (e.g. private mode).
 */
export function getOrCreateProxyUserId({
  loader,
  storer,
  storageKey = PROXY_USER_ID_KEY,
  mintId = ulid
}: GetOrCreateProxyUserIdInput): ProxyUserId | undefined {
  try {
    const existing = loader.getItem(storageKey);
    if (existing !== null && isValidUlid(existing)) {
      return existing;
    }
    const id = mintId();
    if (!isValidUlid(id)) {
      return undefined;
    }
    storer.setItem(storageKey, id);
    return id;
  } catch {
    return undefined;
  }
}

let bootProxyUserId: ProxyUserId | undefined;

/** Value set during app boot; `undefined` when storage was unavailable. */
export function runtimeProxyUserId(): ProxyUserId | undefined {
  return bootProxyUserId;
}

/** Loads or creates the proxy user id and caches it for {@link runtimeProxyUserId}. */
export function initProxyUserIdAtBoot(
  input: GetOrCreateProxyUserIdInput
): ProxyUserId | undefined {
  bootProxyUserId = getOrCreateProxyUserId(input);
  return bootProxyUserId;
}
