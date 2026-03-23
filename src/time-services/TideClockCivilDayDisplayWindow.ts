// TideClockCivilDayDisplayWindow captures the current civil-day interval in local civil time.
// Interval is half-open: includes local 00:00, excludes local 00:00 of the next day.
export class TideClockCivilDayDisplayWindow {
  // startLocal is inclusive (local civil time).
  public readonly startLocal: Date;
  // endLocalExclusive is exclusive (local civil time).
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

