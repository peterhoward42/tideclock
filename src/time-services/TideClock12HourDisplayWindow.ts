// TideClock12HourDisplayWindow captures one half-day display interval in local civil time.
// These boundaries are intentionally local-clock cutoffs (00:00/12:00), not fixed UTC durations.
export class TideClock12HourDisplayWindow {
  // startLocal is inclusive.
  public readonly startLocal: Date;
  // endLocalExclusive is exclusive.
  public readonly endLocalExclusive: Date;

  constructor(startLocal: Date, endLocalExclusive: Date) {
    this.startLocal = new Date(startLocal.getTime());
    this.endLocalExclusive = new Date(endLocalExclusive.getTime());
  }
}

// TimeNowProvider isolates clock access so callers/tests can control which instant
// is interpreted under the runtime's local timezone and DST rules.
export interface TimeNowProvider {
  now(): Date;
}

// SystemTimeNowProvider uses the host machine's current local time regime.
export class SystemTimeNowProvider implements TimeNowProvider {
  now(): Date {
    return new Date();
  }
}
