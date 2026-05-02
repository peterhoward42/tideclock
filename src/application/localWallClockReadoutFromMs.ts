/**
 * localWallClockReadoutFromMs.ts — Local civil clock strings for the diagram (global `timeNow` and **BLHCBundle** date prefix).
 * Shared by Home and dev preview helpers so frozen previews stay aligned with patched SVG text.
 */

export function localCanonicalTimeNowFromMs(ms: number): string {
  const d = new Date(ms);
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  const ss = String(d.getSeconds()).padStart(2, '0');
  return `${hh}:${mm}:${ss}`;
}

export function localBlhcDatePrefixFromMs(ms: number): string {
  const d = new Date(ms);
  const weekday = d.toLocaleDateString(undefined, { weekday: 'short' });
  const day = String(d.getDate()).padStart(2, '0');
  const month = d.toLocaleDateString(undefined, { month: 'short' });
  return `${weekday} ${day} ${month}`;
}
