import { describe, expect, it, beforeEach } from 'vitest';
import {
  PROXY_USER_ID_KEY,
  getOrCreateProxyUserId,
  initProxyUserIdAtBoot,
  isValidUlid,
  runtimeProxyUserId,
  type ProxyUserIdLoader,
  type ProxyUserIdStorer
} from './proxyUserId';

const VALID_ULID = '01ARZ3NDEKTSV4RRFFQ69G5FAV';
const OTHER_ULID = '01ARZ3NDEKTSV4RRFFQ69G5FAW';

class FakeProxyUserIdStorer implements ProxyUserIdStorer {
  public writes: Array<{ key: string; value: string }> = [];
  private readonly backing = new Map<string, string>();

  setItem(key: string, value: string): void {
    this.writes.push({ key, value });
    this.backing.set(key, value);
  }

  snapshot(key: string): string | undefined {
    return this.backing.get(key);
  }
}

class FakeProxyUserIdLoader implements ProxyUserIdLoader {
  constructor(private readonly byKey: Record<string, string | null>) {}

  getItem(key: string): string | null {
    return this.byKey[key] ?? null;
  }
}

describe('isValidUlid', () => {
  it('accepts a canonical 26-character ULID', () => {
    expect(isValidUlid(VALID_ULID)).toBe(true);
  });

  it('rejects wrong length and non-Crockford characters', () => {
    expect(isValidUlid('')).toBe(false);
    expect(isValidUlid('01ARZ3NDEKTSV4RRFFQ69G5FA')).toBe(false);
    expect(isValidUlid('01ARZ3NDEKTSV4RRFFQ69G5FAV!')).toBe(false);
    expect(isValidUlid('01ARZ3NDEKTSV4RRFFQ69G5FAI')).toBe(false);
  });
});

describe('getOrCreateProxyUserId', () => {
  it('returns an existing valid id without writing', () => {
    const storer = new FakeProxyUserIdStorer();
    const loader = new FakeProxyUserIdLoader({
      [PROXY_USER_ID_KEY]: VALID_ULID
    });
    const id = getOrCreateProxyUserId({ loader, storer });
    expect(id).toBe(VALID_ULID);
    expect(storer.writes).toEqual([]);
  });

  it('mints, persists, and returns when the key is absent', () => {
    const storer = new FakeProxyUserIdStorer();
    const loader = new FakeProxyUserIdLoader({});
    const id = getOrCreateProxyUserId({
      loader,
      storer,
      mintId: () => VALID_ULID
    });
    expect(id).toBe(VALID_ULID);
    expect(storer.writes).toEqual([{ key: PROXY_USER_ID_KEY, value: VALID_ULID }]);
    expect(storer.snapshot(PROXY_USER_ID_KEY)).toBe(VALID_ULID);
  });

  it('replaces malformed stored values with a newly minted id', () => {
    const storer = new FakeProxyUserIdStorer();
    const loader = new FakeProxyUserIdLoader({
      [PROXY_USER_ID_KEY]: 'not-a-ulid'
    });
    const id = getOrCreateProxyUserId({
      loader,
      storer,
      mintId: () => OTHER_ULID
    });
    expect(id).toBe(OTHER_ULID);
    expect(storer.writes).toEqual([{ key: PROXY_USER_ID_KEY, value: OTHER_ULID }]);
  });

  it('uses an explicit storage key when provided', () => {
    const customKey = 'alt.proxyUserId';
    const storer = new FakeProxyUserIdStorer();
    const loader = new FakeProxyUserIdLoader({});
    getOrCreateProxyUserId({
      loader,
      storer,
      storageKey: customKey,
      mintId: () => VALID_ULID
    });
    expect(storer.writes).toEqual([{ key: customKey, value: VALID_ULID }]);
  });

  it('returns undefined when storage operations throw', () => {
    const throwingLoader: ProxyUserIdLoader = {
      getItem() {
        throw new Error('denied');
      }
    };
    const storer = new FakeProxyUserIdStorer();
    expect(getOrCreateProxyUserId({ loader: throwingLoader, storer })).toBeUndefined();
  });

  it('returns undefined when mintId produces an invalid value', () => {
    const storer = new FakeProxyUserIdStorer();
    const loader = new FakeProxyUserIdLoader({});
    expect(
      getOrCreateProxyUserId({
        loader,
        storer,
        mintId: () => 'bad'
      })
    ).toBeUndefined();
    expect(storer.writes).toEqual([]);
  });
});

describe('initProxyUserIdAtBoot / runtimeProxyUserId', () => {
  beforeEach(() => {
    initProxyUserIdAtBoot({
      loader: new FakeProxyUserIdLoader({}),
      storer: new FakeProxyUserIdStorer(),
      mintId: () => VALID_ULID
    });
  });

  it('exposes the boot-time id via runtimeProxyUserId', () => {
    expect(runtimeProxyUserId()).toBe(VALID_ULID);
  });
});
