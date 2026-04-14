import { describe, expect, it } from 'vitest';
import type { Town } from '../data/townSchema';
import { loadCurrentLocation, storeCurrentLocation } from './currentLocation';
import {
  CURRENT_LOCATION_KEY,
  deserializeCurrentLocation,
  serializeCurrentLocation,
  type CurrentLocationLoader,
  type CurrentLocationStorer
} from './currentLocationSnapshot';

const exampleTown: Town = {
  id: 'osgb4000000074540474',
  name: 'Southampton',
  lat: 50.9097,
  lon: -1.4044,
  localType: 'City',
  county: 'Hampshire',
  postcodeDistrict: 'SO14',
  region: 'South East',
  country: 'England'
};

/** FakeCurrentLocationStorer captures writes so tests can assert key/value persistence. */
class FakeCurrentLocationStorer implements CurrentLocationStorer {
  public writes: Array<{ key: string; value: string }> = [];

  setItem(key: string, value: string): void {
    this.writes.push({ key, value });
  }
}

/** FakeCurrentLocationLoader returns preseeded values to model storage hit/miss scenarios. */
class FakeCurrentLocationLoader implements CurrentLocationLoader {
  private readonly byKey: Record<string, string | null>;

  constructor(byKey: Record<string, string | null>) {
    this.byKey = byKey;
  }

  getItem(key: string): string | null {
    return this.byKey[key] ?? null;
  }
}

describe('currentLocationSnapshot', () => {
  it('serializes and deserializes a town', () => {
    const raw = serializeCurrentLocation(exampleTown);
    const parsed = deserializeCurrentLocation(raw);
    expect(parsed).toEqual(exampleTown);
  });

  it('returns undefined for malformed json', () => {
    expect(deserializeCurrentLocation('{not-json')).toBeUndefined();
  });

  it('returns undefined when required fields are missing', () => {
    const raw = JSON.stringify({
      id: 'x',
      name: 'Y',
      lat: 1,
      lon: 2
    });
    expect(deserializeCurrentLocation(raw)).toBeUndefined();
  });
});

describe('currentLocation read/write', () => {
  it('stores serialized town with default key', () => {
    const storer = new FakeCurrentLocationStorer();
    storeCurrentLocation(exampleTown, { storer });
    expect(storer.writes).toEqual([
      {
        key: CURRENT_LOCATION_KEY,
        value: JSON.stringify(exampleTown)
      }
    ]);
  });

  it('loads a town from storage', () => {
    const loader = new FakeCurrentLocationLoader({
      [CURRENT_LOCATION_KEY]: JSON.stringify(exampleTown)
    });
    const loaded = loadCurrentLocation({ loader });
    expect(loaded).toEqual(exampleTown);
  });

  it('returns undefined when key is absent or malformed', () => {
    const missing = new FakeCurrentLocationLoader({});
    expect(loadCurrentLocation({ loader: missing })).toBeUndefined();

    const malformed = new FakeCurrentLocationLoader({
      [CURRENT_LOCATION_KEY]: '{"oops":true}'
    });
    expect(loadCurrentLocation({ loader: malformed })).toBeUndefined();
  });

  it('uses an explicit storage key when provided', () => {
    const customKey = 'alt-current-location';
    const storer = new FakeCurrentLocationStorer();
    storeCurrentLocation(exampleTown, { storer, storageKey: customKey });
    expect(storer.writes).toEqual([
      {
        key: customKey,
        value: JSON.stringify(exampleTown)
      }
    ]);

    const loader = new FakeCurrentLocationLoader({
      [customKey]: JSON.stringify(exampleTown)
    });
    expect(loadCurrentLocation({ loader, storageKey: customKey })).toEqual(exampleTown);
  });
});
