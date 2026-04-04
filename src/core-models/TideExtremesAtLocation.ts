/**
 * TideExtremesAtLocation.ts — Coordinates plus ordered extremes for one place.
 * Kind: Definition.
 */

import { TideExtreme } from './TideExtreme';

/** Tide extremes for a fixed lat/lon (order follows the snapshot or builder that produced the list). */
export class TideExtremesAtLocation {
  public readonly latitude: number;
  public readonly longitude: number;
  public readonly extremes: readonly TideExtreme[];

  constructor(
    latitude: number,
    longitude: number,
    extremes: readonly TideExtreme[]
  ) {
    this.latitude = latitude;
    this.longitude = longitude;
    this.extremes = extremes;
  }
}
