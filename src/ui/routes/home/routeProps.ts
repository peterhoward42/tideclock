import type { TideExtremesAtLocation } from "../../../core-models/TideExtremesAtLocation";
import type { Town } from "../../../data/townSchema";

export type UrlLocationErrorReason = "missing_param" | "unknown" | "ambiguous";

/** Shell tide presentation: quota is distinct from generic load failure. */
export type TidePresentation =
  | { readonly kind: "loading" }
  | { readonly kind: "ready" }
  | { readonly kind: "loadFailed" }
  | { readonly kind: "quotaExhausted" }
  | {
      readonly kind: "urlLocationError";
      readonly reason: UrlLocationErrorReason;
      readonly place: string | null;
      readonly county: string | null;
    }
  | { readonly kind: "operatorNotice" };

export interface RouteProps {
  readonly tidePresentation: TidePresentation;
  readonly tideExtremes: TideExtremesAtLocation | undefined;
  /** Active coastal place; used for share-link copy when tides are ready. */
  readonly currentTown: Town | undefined;
  readonly townName: string;
  /** Dev-only copy from shell when `?tideUxPreview=` is active; null in production or when idle. */
  readonly tidePreviewBannerLine: string | null;
  /** First visit with no persisted town: caption explains the shipped default until dismissed. */
  readonly defaultLocationExplainerOpen: boolean;
  /** Place line for the orientation layer, e.g. `Looe (Cornwall)`. */
  readonly defaultLocationExplainerPlaceLine: string;
  readonly onDismissDefaultLocationExplainer: () => void;
}
