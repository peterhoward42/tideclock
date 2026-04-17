/**
 * TideExtremesAtLocation.ts — Coordinates plus ordered extremes for one place.
 * Kind: Definition.
 */

import { TideExtreme } from './TideExtreme';
import { TimeOrderedTideExtrema, toTimeOrderedTideExtrema } from './TimeOrderedTideExtrema';

/** Tide extremes for a fixed lat/lon (always canonical strictly-ascending UTC order). */
export class TideExtremesAtLocation {
  public readonly latitude: number;
  public readonly longitude: number;
  public readonly extremes: TimeOrderedTideExtrema;

  constructor(
    latitude: number,
    longitude: number,
    extremes: TimeOrderedTideExtrema
  ) {
    this.latitude = latitude;
    this.longitude = longitude;
    this.extremes = extremes;
  }

  public static fromPossiblyUnordered(
    latitude: number,
    longitude: number,
    extremes: readonly TideExtreme[],
  ): TideExtremesAtLocation {
    return new TideExtremesAtLocation(latitude, longitude, toTimeOrderedTideExtrema(extremes));
  }
}
