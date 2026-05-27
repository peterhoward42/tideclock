/**
 * minuteCadence.ts — Local wall-clock minute boundary subscription with optional immediate tick.
 * HomeRoute uses this for full tide-diagram regeneration; App uses it for civil-day rollover checks after midnight.
 * Kind: Service (timers). Does not derive tide semantics.
 */

const MS_PER_MINUTE = 60_000;

const wallClockNowMs: () => number = () => Date.now();

export type MinuteCadenceOptions = Readonly<{
  /** When true (default), call `onTick` once when subscribing. */
  fireImmediately?: boolean;
  /** Production omits this and uses wall time; tests inject a fixed clock. */
  now?: () => number;
}>;

/**
 * Loop B (~minute-scale): aligned to local wall-clock minute boundaries. Invokes `onTick` with
 * `Math.floor(nowMs / 60_000)` when the minute rolls, after an optional immediate sync.
 */
export function subscribeMinuteCadence(
  onTick: (minuteEpoch: number) => void,
  options: MinuteCadenceOptions = {}
): () => void {
  const now = options.now ?? wallClockNowMs;
  const fireImmediately = options.fireImmediately ?? true;

  const bump = () => {
    onTick(Math.floor(now() / MS_PER_MINUTE));
  };

  if (fireImmediately) {
    bump();
  }

  let intervalId: ReturnType<typeof setInterval> | undefined;
  const delay = Math.max(0, MS_PER_MINUTE - (now() % MS_PER_MINUTE));
  const timeoutId = setTimeout(() => {
    bump();
    intervalId = setInterval(bump, MS_PER_MINUTE);
  }, delay);

  return () => {
    clearTimeout(timeoutId);
    if (intervalId !== undefined) {
      clearInterval(intervalId);
    }
  };
}
