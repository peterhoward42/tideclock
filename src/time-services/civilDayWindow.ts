/**
 * civilDayWindow.ts — Local civil-day bounds plus injectable “now” for time seams.
 * Shared by slicing and query code. Kind: Definition + small service types. Does not fetch tides.
 *
 * Half-open local civil-day bounds: inclusive start at local midnight, exclusive end
 * at the next local midnight. `Date` values use the host’s local calendar when read
 * via `getFullYear` / `getMonth` / `getDate` etc.
 */
export interface CivilDayLocalInterval {
  readonly startLocal: Date;
  readonly endLocalExclusive: Date;
}

/**
 * The tide-clock “today” window: one local calendar day as a half-open interval.
 * Instances defensively copy the constructor dates so callers cannot mutate stored bounds.
 */
export class CivilDayWindow implements CivilDayLocalInterval {
  public readonly startLocal: Date;
  public readonly endLocalExclusive: Date;

  constructor(startLocal: Date, endLocalExclusive: Date) {
    const start = new Date(startLocal.getTime());
    const end = new Date(endLocalExclusive.getTime());
    if (end.getTime() <= start.getTime()) {
      throw new Error('CivilDayWindow: endLocalExclusive must be strictly after startLocal');
    }
    this.startLocal = start;
    this.endLocalExclusive = end;
  }
}

/**
 * Supplies the current instant when resolving which local civil day is active.
 * Tests inject fixed instants; the app uses {@link SystemTimeNowProvider}.
 */
export interface TimeNowProvider {
  now(): Date;
}

/** Host clock; `now()` is interpreted under the runtime’s local timezone and DST rules. */
export class SystemTimeNowProvider implements TimeNowProvider {
  now(): Date {
    return new Date();
  }
}
