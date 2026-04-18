import type { TideExtremesAtLocation } from "../../../core-models/TideExtremesAtLocation";

/** Tide prediction pipeline snapshot from the app shell into the home route. */
export type TidePredictionsLoadState = {
  readonly status: "loading" | "ready" | "error";
};

export interface HomeRouteProps {
  readonly tideLoadState: TidePredictionsLoadState;
  readonly tideExtremes: TideExtremesAtLocation | undefined;
  readonly townName: string;
  /** Dev-only copy from shell when `?tideUxPreview=` is active; null in production or when idle. */
  readonly tideUxDevPreviewBannerLine: string | null;
}
