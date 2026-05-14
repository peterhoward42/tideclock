import type { TideExtremesAtLocation } from "../../../core-models/TideExtremesAtLocation";

/** Tide prediction pipeline snapshot from the app shell into the home route. */
export type TidePredictionsLoadState = {
  readonly status: "loading" | "ready" | "error";
};

export interface RouteProps {
  readonly tideLoadState: TidePredictionsLoadState;
  readonly tideExtremes: TideExtremesAtLocation | undefined;
  readonly townName: string;
  /** Dev-only copy from shell when `?tideUxPreview=` is active; null in production or when idle. */
  readonly tidePreviewBannerLine: string | null;
  /** First visit with no persisted town: caption explains the shipped default until dismissed. */
  readonly defaultLocationExplainerOpen: boolean;
  /** Place line for the orientation layer, e.g. `Looe, Cornwall`. */
  readonly defaultLocationExplainerPlaceLine: string;
  readonly onDismissDefaultLocationExplainer: () => void;
}
