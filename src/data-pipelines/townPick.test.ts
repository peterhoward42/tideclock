import { describe, expect, it } from 'vitest';
import type { Town } from '../data/townSchema';
import { loadTownPick, storeTownPick } from './townPick';
import {
  CURRENT_LOCATION_KEY,
  deserializeTownPick,
  serializeTownPick,
  type TownPickLoader,
  type TownPickStorer
} from './townPickSerde';

const exampleTown: Town = {
  name: 'Southampton',
  lat: 50.9097,
  lon: -1.4044,
  localType: 'City',
  county: 'Hampshire',
  postcodeDistrict: 'SO14',
  region: 'South East',
  country: 'England'
};

/** Captures writes so tests can assert key/value persistence. */
class FakeTownPickStorer implements TownPickStorer {
  public writes: Array<{ key: string; value: string }> = [];

  setItem(key: string, value: string): void {
    this.writes.push({ key, value });
  }
}

/** Returns preseeded values to model storage hit/miss scenarios. */
class FakeTownPickLoader implements TownPickLoader {
  private readonly byKey: Record<string, string | null>;

  constructor(byKey: Record<string, string | null>) {
    this.byKey = byKey;
  }

  getItem(key: string): string | null {
    return this.byKey[key] ?? null;
  }
}

describe('townPickSerde', () => {
  it('serializes and deserializes a town', () => {
    const raw = serializeTownPick(exampleTown);
    const parsed = deserializeTownPick(raw);
    expect(parsed).toEqual(exampleTown);
  });

  it('returns undefined for malformed json', () => {
    expect(deserializeTownPick('{not-json')).toBeUndefined();
  });

  it('returns undefined when required fields are missing', () => {
    const raw = JSON.stringify({
      name: 'Y',
      lat: 1,
      lon: 2,
    });
    expect(deserializeTownPick(raw)).toBeUndefined();
  });

  it('accepts legacy snapshots that still include an id field', () => {
    const raw = JSON.stringify({
      id: 't2:cornwall:166',
      ...exampleTown,
    });
    expect(deserializeTownPick(raw)).toEqual(exampleTown);
  });
});

describe('townPick read/write', () => {
  it('stores serialized town with default key', () => {
    const storer = new FakeTownPickStorer();
    storeTownPick(exampleTown, { storer });
    expect(storer.writes).toEqual([
      {
        key: CURRENT_LOCATION_KEY,
        value: JSON.stringify(exampleTown)
      }
    ]);
  });

  it('loads a town from storage', () => {
    const loader = new FakeTownPickLoader({
      [CURRENT_LOCATION_KEY]: JSON.stringify(exampleTown)
    });
    const loaded = loadTownPick({ loader });
    expect(loaded).toEqual(exampleTown);
  });

  it('returns undefined when key is absent or malformed', () => {
    const missing = new FakeTownPickLoader({});
    expect(loadTownPick({ loader: missing })).toBeUndefined();

    const malformed = new FakeTownPickLoader({
      [CURRENT_LOCATION_KEY]: '{"oops":true}'
    });
    expect(loadTownPick({ loader: malformed })).toBeUndefined();
  });

  it('uses an explicit storage key when provided', () => {
    const customKey = 'alt-current-location';
    const storer = new FakeTownPickStorer();
    storeTownPick(exampleTown, { storer, storageKey: customKey });
    expect(storer.writes).toEqual([
      {
        key: customKey,
        value: JSON.stringify(exampleTown)
      }
    ]);

    const loader = new FakeTownPickLoader({
      [customKey]: JSON.stringify(exampleTown)
    });
    expect(loadTownPick({ loader, storageKey: customKey })).toEqual(exampleTown);
  });
});
