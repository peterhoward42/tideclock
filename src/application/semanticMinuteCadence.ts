const MS_PER_MINUTE = 60_000;

/**
 * Loop B (~minute-scale): aligned to local wall-clock minute boundaries. Invokes `onTick` with
 * `Math.floor(nowMs / 60_000)` when the minute rolls, after an optional immediate sync.
 */
export function subscribeSemanticMinuteCadence(
  onTick: (minuteEpoch: number) => void,
  options?: {
    /** When true (default), call `onTick` once when subscribing. */
    fireImmediately?: boolean;
    /** Injectable clock (ms since Unix epoch); tests only. */
    now?: () => number;
  }
): () => void {
  const now = options?.now ?? (() => Date.now());
  const fireImmediately = options?.fireImmediately ?? true;

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
