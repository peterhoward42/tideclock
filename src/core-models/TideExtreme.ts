export type TideExtremeType = 'high' | 'low';

export class TideExtreme {
  public type: TideExtremeType;
  public timeUtc: string;
  public heightMetres: number;

  constructor(type: TideExtremeType, timeUtc: string, heightMetres: number) {
    this.type = type;
    this.timeUtc = timeUtc;
    this.heightMetres = heightMetres;
  }
}
