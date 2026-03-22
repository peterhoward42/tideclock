/**
 * UI-facing lifecycle for tide data relative to the current persisted location command path.
 */
export type TidePredictionsLoadState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "ready" }
  | { status: "error" };
