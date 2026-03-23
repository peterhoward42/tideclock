import { TideExtreme } from './TideExtreme';

export class TideExtremesAtLocation {
  public latitude: number;
  public longitude: number;
  public extremes: TideExtreme[];

  constructor(latitude: number, longitude: number, extremes: TideExtreme[]) {
    this.latitude = latitude;
    this.longitude = longitude;
    this.extremes = extremes;
  }
}
