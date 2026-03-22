// tide-predictions.svelte.ts

export type TideExtremeType = 'high' | 'low';

export interface TideExtreme {
    type: TideExtremeType; // 'high' or 'low'
    height: number; // metres
    time: Date; // UTC
}

export function createTidePredictionsModel() {
    // Internal reactive state.
    //
    // This is kept private so that callers cannot mutate the model directly.
    // The intention is to preserve a strict interface: all writes go through
    // setAll, and all reads go through getAll.
    let _extremes = $state<TideExtreme[]>([]);

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
        // Design choice:
        // We do not expose the underlying state variable itself.
        // Consumers read through this method, which preserves encapsulation.
        //
        // Reactivity still works as expected because this method reads the
        // reactive state. Any reactive context (e.g. templates, $derived, $effect)
        // that calls getAll() will update automatically when setAll replaces the array.
        return _extremes;
    }

    return {
        setAll,
        getAll
    };
}

export type TidePredictionsModel = ReturnType<typeof createTidePredictionsModel>;