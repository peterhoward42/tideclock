// tide-predictions.ts

export type TideExtremeType = "high" | "low";

export interface TideExtreme {
  type: TideExtremeType; // 'high' or 'low'
  height: number; // metres
  time: Date; // UTC
}

export function createTidePredictionsModel() {
  // Internal mutable state, not exposed directly.
  //
  // Callers use setAll / getAll so writes and reads stay explicit.
  let _extremes: TideExtreme[] = [];

  function setAll(extremes: TideExtreme[]) {
    // Design choice:
    // The caller is responsible for supplying data in the correct order.
    // This keeps the model simple and focused on holding and exposing state,
    // rather than also taking on sorting policy.
    //
    // We copy the array rather than storing the caller's array directly.
    // That gives the model a clearer ownership boundary and reduces the
    // risk of outside code mutating the same array after passing it in.
    _extremes = extremes.slice();
  }

  function getAll(): readonly TideExtreme[] {
    // We do not expose the underlying array reference for mutation.
    // Consumers read through this method, which preserves encapsulation.
    return _extremes;
  }

  return {
    setAll,
    getAll,
  };
}

export type TidePredictionsModel = ReturnType<typeof createTidePredictionsModel>;
