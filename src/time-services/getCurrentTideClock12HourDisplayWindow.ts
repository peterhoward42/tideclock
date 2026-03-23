import {
  SystemTimeNowProvider,
  TideClock12HourDisplayWindow,
  type TimeNowProvider
} from './TideClock12HourDisplayWindow';

export function getCurrentTideClock12HourDisplayWindow(
  timeNowProvider: TimeNowProvider = new SystemTimeNowProvider()
): TideClock12HourDisplayWindow {
  // `now` is an absolute instant; extracting Y/M/D/H below converts it into local civil fields.
  const now = timeNowProvider.now();
  const year = now.getFullYear();
  const month = now.getMonth();
  const day = now.getDate();
  const hour = now.getHours();

  const startHour = hour < 12 ? 0 : 12;
  const endHour = hour < 12 ? 12 : 24;

  // Construct boundaries in local time. This intentionally follows local timezone and DST
  // transitions instead of assuming "12 hours" is always a fixed UTC millisecond span.
  const startLocal = new Date(year, month, day, startHour, 0, 0, 0);
  const endLocalExclusive = new Date(year, month, day, endHour, 0, 0, 0);

  return new TideClock12HourDisplayWindow(startLocal, endLocalExclusive);
}
