import { describe, expect, it, vi } from "vitest";
import { createTideRefreshController } from "./tideRefreshController";
import { TideExtremesAtLocation } from "../core-models/TideExtremesAtLocation";
import type { Town } from "../data/townSchema";

const aTown = {
  id: "t1",
  name: "Test",
  lat: 10,
  lon: 20,
  localType: "town",
  county: "C",
  postcodeDistrict: "AB1",
  region: "R",
  country: "UK",
} satisfies Town;

const otherTown = { ...aTown, id: "t2", lat: 11, lon: 21 };

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

describe("createTideRefreshController", () => {
  it("invokes onLoading then onSuccess with civil-day start from deps", async () => {
    const load = vi.fn().mockResolvedValue(extremesA);
    const civilDay = vi.fn().mockReturnValue(99);
    const onLoading = vi.fn();
    const onSuccess = vi.fn();
    const onError = vi.fn();
    const { refreshTidesForTown } = createTideRefreshController(
      {
        loadTideExtremesForCurrentCivilDay: load,
        civilDayWindowStartMsAfterSuccessfulLoad: civilDay,
      },
      { onLoading, onSuccess, onError }
    );
    refreshTidesForTown(aTown);
    expect(onLoading).toHaveBeenCalledTimes(1);
    await vi.waitFor(() => {
      expect(onSuccess).toHaveBeenCalledWith({
        extremes: extremesA,
        civilDayWindowStartMs: 99,
      });
    });
    expect(onError).not.toHaveBeenCalled();
    expect(load).toHaveBeenCalledWith(10, 20);
    expect(civilDay).toHaveBeenCalledTimes(1);
  });

  it("calls onError when load resolves undefined", async () => {
    const load = vi.fn().mockResolvedValue(undefined);
    const onSuccess = vi.fn();
    const onError = vi.fn();
    const { refreshTidesForTown } = createTideRefreshController(
      {
        loadTideExtremesForCurrentCivilDay: load,
        civilDayWindowStartMsAfterSuccessfulLoad: () => 1,
      },
      { onLoading: () => {}, onSuccess, onError }
    );
    refreshTidesForTown(aTown);
    await vi.waitFor(() => expect(onError).toHaveBeenCalledTimes(1));
    expect(onSuccess).not.toHaveBeenCalled();
  });

  it("calls onLoadRejected then onError when load throws", async () => {
    const err = new Error("network");
    const load = vi.fn().mockRejectedValue(err);
    const onLoadRejected = vi.fn();
    const onError = vi.fn();
    const { refreshTidesForTown } = createTideRefreshController(
      {
        loadTideExtremesForCurrentCivilDay: load,
        civilDayWindowStartMsAfterSuccessfulLoad: () => 1,
      },
      { onLoading: () => {}, onSuccess: () => {}, onError, onLoadRejected }
    );
    refreshTidesForTown(aTown);
    await vi.waitFor(() => expect(onError).toHaveBeenCalledTimes(1));
    expect(onLoadRejected).toHaveBeenCalledWith(err);
  });

  it("ignores stale completion when a newer refresh was started", async () => {
    const first = deferred<TideExtremesAtLocation | undefined>();
    const second = deferred<TideExtremesAtLocation | undefined>();
    const load = vi
      .fn()
      .mockImplementationOnce(() => first.promise)
      .mockImplementationOnce(() => second.promise);
    const onSuccess = vi.fn();
    const { refreshTidesForTown } = createTideRefreshController(
      {
        loadTideExtremesForCurrentCivilDay: load,
        civilDayWindowStartMsAfterSuccessfulLoad: () => 1,
      },
      { onLoading: () => {}, onSuccess, onError: () => {} }
    );
    refreshTidesForTown(aTown);
    refreshTidesForTown(otherTown);
    second.resolve(extremesB);
    await vi.waitFor(() =>
      expect(onSuccess).toHaveBeenCalledWith({
        extremes: extremesB,
        civilDayWindowStartMs: 1,
      })
    );
    first.resolve(extremesA);
    await new Promise((r) => setTimeout(r, 10));
    expect(onSuccess).toHaveBeenCalledTimes(1);
  });
});
