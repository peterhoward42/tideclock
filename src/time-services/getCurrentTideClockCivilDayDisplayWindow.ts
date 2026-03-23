import {
  SystemTimeNowProvider,
  TideClockCivilDayDisplayWindow,
  type TimeNowProvider
} from './TideClockCivilDayDisplayWindow';

export function getCurrentTideClockCivilDayDisplayWindow(
  timeNowProvider: TimeNowProvider = new SystemTimeNowProvider()
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

