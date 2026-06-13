import { describe, expect, it, vi } from "vitest";
import { createTideRefreshController } from "./tideRefreshController";
import type { TideRefreshCallbacks } from "./tideRefreshController";
import { TideExtremesAtLocation } from "../core-models/TideExtremesAtLocation";
import type { Town } from "../data/townSchema";
import { ProxyQuotaExhaustedError } from "../data-pipelines/proxyV1Types";

const aTown = {
  name: "Test",
  lat: 10,
  lon: 20,
  localType: "town",
  county: "C",
  postcodeDistrict: "AB1",
  region: "R",
  country: "UK",
} satisfies Town;

const otherTown = { ...aTown, lat: 11, lon: 21 };

const extremesA = TideExtremesAtLocation.fromPossiblyUnordered(1, 2, []);
const extremesB = TideExtremesAtLocation.fromPossiblyUnordered(3, 4, []);

function deferred<T>(): {
  promise: Promise<T>;
  resolve: (v: T) => void;
} {
  let resolve!: (v: T) => void;
  const promise = new Promise<T>((r) => {
    resolve = r;
  });
  return { promise, resolve };
}

class FixedTideLoader {
  readonly calls: Array<{ lat: number; lon: number }> = [];

  constructor(
    private readonly result:
      | TideExtremesAtLocation
      | undefined
      | Promise<TideExtremesAtLocation | undefined>
  ) {}

  loadTideExtremesForCurrentCivilDay = (
    lat: number,
    lon: number
  ): Promise<TideExtremesAtLocation | undefined> => {
    this.calls.push({ lat, lon });
    return Promise.resolve(this.result);
  };
}

class RejectingTideLoader {
  readonly calls: Array<{ lat: number; lon: number }> = [];

  constructor(private readonly error: unknown) {}

  loadTideExtremesForCurrentCivilDay = (
    lat: number,
    lon: number
  ): Promise<TideExtremesAtLocation | undefined> => {
    this.calls.push({ lat, lon });
    return Promise.reject(this.error);
  };
}

class QueuedTideLoader {
  readonly calls: Array<{ lat: number; lon: number }> = [];

  constructor(
    private readonly queue: Array<
      () => Promise<TideExtremesAtLocation | undefined>
    >
  ) {}

  loadTideExtremesForCurrentCivilDay = (
    lat: number,
    lon: number
  ): Promise<TideExtremesAtLocation | undefined> => {
    this.calls.push({ lat, lon });
    const next = this.queue.shift();
    if (!next) {
      throw new Error("QueuedTideLoader: no response queued");
    }
    return next();
  };
}

class FixedCivilDayStart {
  callCount = 0;

  constructor(private readonly ms: number) {}

  civilDayWindowStartMsAfterSuccessfulLoad = (): number => {
    this.callCount++;
    return this.ms;
  };
}

class RecordingRefreshCallbacks {
  loadingCount = 0;
  successes: Array<{
    extremes: TideExtremesAtLocation;
    civilDayWindowStartMs: number;
  }> = [];
  loadFailedCount = 0;
  rejectedErrors: unknown[] = [];
  quotaExhaustedCount = 0;

  asCallbacks(): TideRefreshCallbacks {
    return {
      onLoading: () => {
        this.loadingCount++;
      },
      onSuccess: (payload) => {
        this.successes.push(payload);
      },
      onLoadFailed: () => {
        this.loadFailedCount++;
      },
      onLoadRejected: (error) => {
        this.rejectedErrors.push(error);
      },
      onQuotaExhausted: () => {
        this.quotaExhaustedCount++;
      },
    };
  }
}

describe("createTideRefreshController", () => {
  it("invokes onLoading then onSuccess with civil-day start from deps", async () => {
    const load = new FixedTideLoader(extremesA);
    const civilDay = new FixedCivilDayStart(99);
    const callbacks = new RecordingRefreshCallbacks();
    const { refreshTidesForTown } = createTideRefreshController(
      {
        loadTideExtremesForCurrentCivilDay:
          load.loadTideExtremesForCurrentCivilDay,
        civilDayWindowStartMsAfterSuccessfulLoad:
          civilDay.civilDayWindowStartMsAfterSuccessfulLoad,
      },
      callbacks.asCallbacks()
    );
    refreshTidesForTown(aTown);
    expect(callbacks.loadingCount).toBe(1);
    await vi.waitFor(() => {
      expect(callbacks.successes).toEqual([
        {
          extremes: extremesA,
          civilDayWindowStartMs: 99,
        },
      ]);
    });
    expect(callbacks.loadFailedCount).toBe(0);
    expect(load.calls).toEqual([{ lat: 10, lon: 20 }]);
    expect(civilDay.callCount).toBe(1);
  });

  it("calls onLoadFailed when load resolves undefined", async () => {
    const load = new FixedTideLoader(undefined);
    const callbacks = new RecordingRefreshCallbacks();
    const { refreshTidesForTown } = createTideRefreshController(
      {
        loadTideExtremesForCurrentCivilDay:
          load.loadTideExtremesForCurrentCivilDay,
        civilDayWindowStartMsAfterSuccessfulLoad: () => 1,
      },
      callbacks.asCallbacks()
    );
    refreshTidesForTown(aTown);
    await vi.waitFor(() => expect(callbacks.loadFailedCount).toBe(1));
    expect(callbacks.successes).toHaveLength(0);
  });

  it("calls onLoadRejected then onLoadFailed when load throws", async () => {
    const err = new Error("network");
    const load = new RejectingTideLoader(err);
    const callbacks = new RecordingRefreshCallbacks();
    const { refreshTidesForTown } = createTideRefreshController(
      {
        loadTideExtremesForCurrentCivilDay:
          load.loadTideExtremesForCurrentCivilDay,
        civilDayWindowStartMsAfterSuccessfulLoad: () => 1,
      },
      callbacks.asCallbacks()
    );
    refreshTidesForTown(aTown);
    await vi.waitFor(() => expect(callbacks.loadFailedCount).toBe(1));
    expect(callbacks.rejectedErrors).toEqual([err]);
  });

  it("calls onQuotaExhausted but not onLoadFailed when load throws ProxyQuotaExhaustedError", async () => {
    const err = new ProxyQuotaExhaustedError();
    const load = new RejectingTideLoader(err);
    const callbacks = new RecordingRefreshCallbacks();
    const { refreshTidesForTown } = createTideRefreshController(
      {
        loadTideExtremesForCurrentCivilDay:
          load.loadTideExtremesForCurrentCivilDay,
        civilDayWindowStartMsAfterSuccessfulLoad: () => 1,
      },
      callbacks.asCallbacks()
    );
    refreshTidesForTown(aTown);
    await vi.waitFor(() => expect(callbacks.quotaExhaustedCount).toBe(1));
    expect(callbacks.rejectedErrors).toEqual([err]);
    expect(callbacks.loadFailedCount).toBe(0);
  });

  it("ignores stale completion when a newer refresh was started", async () => {
    const first = deferred<TideExtremesAtLocation | undefined>();
    const second = deferred<TideExtremesAtLocation | undefined>();
    const load = new QueuedTideLoader([
      () => first.promise,
      () => second.promise,
    ]);
    const callbacks = new RecordingRefreshCallbacks();
    const { refreshTidesForTown } = createTideRefreshController(
      {
        loadTideExtremesForCurrentCivilDay:
          load.loadTideExtremesForCurrentCivilDay,
        civilDayWindowStartMsAfterSuccessfulLoad: () => 1,
      },
      callbacks.asCallbacks()
    );
    refreshTidesForTown(aTown);
    refreshTidesForTown(otherTown);
    second.resolve(extremesB);
    await vi.waitFor(() =>
      expect(callbacks.successes).toEqual([
        {
          extremes: extremesB,
          civilDayWindowStartMs: 1,
        },
      ])
    );
    first.resolve(extremesA);
    await new Promise((r) => setTimeout(r, 10));
    expect(callbacks.successes).toHaveLength(1);
  });
});
