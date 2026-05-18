/**
 * tideRefreshController.ts — Shell tide refresh: serial guard + async completion policy.
 * Owns monotonic load serial so late responses cannot overwrite a newer location’s result.
 * Caller supplies I/O and binds callbacks to UI state. Kind: Application orchestration.
 */
import type { TideExtremesAtLocation } from "../core-models/TideExtremesAtLocation";
import type { Town } from "../data/townSchema";
import { ProxyQuotaExhaustedError } from "../data-pipelines/proxyV1Types";

export type TideRefreshControllerDeps = {
  readonly loadTideExtremesForCurrentCivilDay: (
    latitude: number,
    longitude: number
  ) => Promise<TideExtremesAtLocation | undefined>;
  /** Recorded after a successful load (e.g. current civil-day window start from the system clock). */
  readonly civilDayWindowStartMsAfterSuccessfulLoad: () => number;
};

export type TideRefreshCallbacks = {
  readonly onLoading: () => void;
  readonly onSuccess: (payload: {
    readonly extremes: TideExtremesAtLocation;
    readonly civilDayWindowStartMs: number;
  }) => void;
  readonly onLoadFailed: () => void;
  /** Operator upstream quota exhausted; not a generic load failure. */
  readonly onQuotaExhausted?: () => void;
  /** Only when the in-flight load is still current; not called for stale completions. */
  readonly onLoadRejected?: (error: unknown) => void;
};

export type TideRefreshController = {
  readonly refreshTidesForTown: (town: Town) => void;
};

export function createTideRefreshController(
  deps: TideRefreshControllerDeps,
  callbacks: TideRefreshCallbacks
): TideRefreshController {
  let tideLoadSerial = 0;

  function refreshTidesForTown(town: Town): void {
    const serial = ++tideLoadSerial;
    callbacks.onLoading();
    void (async () => {
      try {
        const result = await deps.loadTideExtremesForCurrentCivilDay(town.lat, town.lon);
        if (serial !== tideLoadSerial) {
          return;
        }
        if (result !== undefined) {
          callbacks.onSuccess({
            extremes: result,
            civilDayWindowStartMs: deps.civilDayWindowStartMsAfterSuccessfulLoad(),
          });
        } else {
          callbacks.onLoadFailed();
        }
      } catch (e) {
        if (serial !== tideLoadSerial) {
          return;
        }
        callbacks.onLoadRejected?.(e);
        if (e instanceof ProxyQuotaExhaustedError) {
          callbacks.onQuotaExhausted?.();
        } else {
          callbacks.onLoadFailed();
        }
      }
    })();
  }

  return { refreshTidesForTown };
}
