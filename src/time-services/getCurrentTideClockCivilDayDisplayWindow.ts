/**
 * getCurrentTideClockCivilDayDisplayWindow.ts — Builds today’s local half-open civil interval from a time provider.
 * Consumed by civil-day slicing and tide query. Kind: Pure logic over `Date`. Does not read storage.
 */

import {
  SystemTimeNowProvider,
  TideClockCivilDayDisplayWindow,
  type TimeNowProvider
} from './TideClockCivilDayDisplayWindow';

/**
 * Resolves the tide-clock’s local civil-day window for the instant returned by `timeNowProvider`.
 * Callers that mean the host clock should use {@link getCurrentTideClockCivilDayDisplayWindowFromSystemClock}
 * so “real time” is explicit at the call site.
 */
export function getCurrentTideClockCivilDayDisplayWindow(
  timeNowProvider: TimeNowProvider
): TideClockCivilDayDisplayWindow {
  // `now` is an absolute instant; extracting Y/M/D below converts it into local
  // civil fields under the runtime timezone and DST rules.
  const now = timeNowProvider.now();
  const year = now.getFullYear();
  const month = now.getMonth();
  const day = now.getDate();

  // Construct boundaries in local civil time.
  const startLocal = new Date(year, month, day, 0, 0, 0, 0);
  const endLocalExclusive = new Date(year, month, day + 1, 0, 0, 0, 0);

  return new TideClockCivilDayDisplayWindow(startLocal, endLocalExclusive);
}

/** Same as {@link getCurrentTideClockCivilDayDisplayWindow} with {@link SystemTimeNowProvider}. */
export function getCurrentTideClockCivilDayDisplayWindowFromSystemClock(): TideClockCivilDayDisplayWindow {
  return getCurrentTideClockCivilDayDisplayWindow(new SystemTimeNowProvider());
}
