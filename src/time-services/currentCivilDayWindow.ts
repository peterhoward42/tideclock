/**
 * currentCivilDayWindow.ts — Builds today’s local half-open civil interval from a time provider.
 * Consumed by civil-day slicing and tide query. Kind: Pure logic over `Date`. Does not read storage.
 */

import {
  CivilDayWindow,
  SystemTimeNowProvider,
  type TimeNowProvider
} from './civilDayWindow';

/**
 * Resolves the tide-clock’s local civil-day window for the instant returned by `timeNowProvider`.
 * Callers that mean the host clock should use {@link civilDayWindowFromHostClock}
 * so “real time” is explicit at the call site.
 */
export function getCurrentCivilDayWindow(
  timeNowProvider: TimeNowProvider
): CivilDayWindow {
  // `now` is an absolute instant; extracting Y/M/D below converts it into local
  // civil fields under the runtime timezone and DST rules.
  const now = timeNowProvider.now();
  const year = now.getFullYear();
  const month = now.getMonth();
  const day = now.getDate();

  // Construct boundaries in local civil time.
  const startLocal = new Date(year, month, day, 0, 0, 0, 0);
  const endLocalExclusive = new Date(year, month, day + 1, 0, 0, 0, 0);

  return new CivilDayWindow(startLocal, endLocalExclusive);
}

/** Same as {@link getCurrentCivilDayWindow} with {@link SystemTimeNowProvider}. */
export function civilDayWindowFromHostClock(): CivilDayWindow {
  return getCurrentCivilDayWindow(new SystemTimeNowProvider());
}
