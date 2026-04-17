/**
 * tideUxDevPreviewCatalog.ts — Dev-only stimuli for tide *load-path* UX (environmental / runtime
 * failures: offline, slow hang, empty upstream slice). See diagram-dev-preview for frozen diagram
 * snapshots; this catalog does not replace proxy integration tests.
 */

import { TideExtremesAtLocation } from "../../core-models/TideExtremesAtLocation";

export const TIDE_UX_DEV_PREVIEW_QUERY_PARAM = "tideUxPreview" as const;

/** Scenarios that drive the same UI states as real Category-B outcomes. */
export const TIDE_UX_DEV_PREVIEW_IDS = [
  "load-failed",
  "load-stuck",
  "no-extremes-today",
] as const;

export type TideUxDevPreviewId = (typeof TIDE_UX_DEV_PREVIEW_IDS)[number];

const HEADLINE: Record<TideUxDevPreviewId, string> = {
  "load-failed": "tide load failed (simulated)",
  "load-stuck": "tide load stuck loading (simulated)",
  "no-extremes-today": "ready, no extremes for civil day (simulated)",
};

export function tideUxDevPreviewShortHeadline(id: TideUxDevPreviewId): string {
  return HEADLINE[id];
}

function isTideUxDevPreviewId(value: string): value is TideUxDevPreviewId {
  return (TIDE_UX_DEV_PREVIEW_IDS as readonly string[]).includes(value);
}

/**
 * Reads tide UX dev preview id from a raw search string.
 * DEV-only: returns null in production builds or for unknown ids.
 */
export function tideUxDevPreviewIdFromSearch(search: string): TideUxDevPreviewId | null {
  if (!import.meta.env.DEV) return null;
  try {
    const q = new URLSearchParams(search);
    const value = q.get(TIDE_UX_DEV_PREVIEW_QUERY_PARAM);
    if (value === null) return null;
    if (isTideUxDevPreviewId(value)) {
      return value;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * When non-null, the shell should await this instead of hitting storage/proxy so Home shows the
 * same panels as real loads. `load-stuck` never settles (infinite loading).
 */
export function tideUxDevPreviewMaybeOverrideLoad(
  previewId: TideUxDevPreviewId | null,
  latitude: number,
  longitude: number,
): Promise<TideExtremesAtLocation | undefined> | null {
  if (!import.meta.env.DEV || previewId === null) {
    return null;
  }
  switch (previewId) {
    case "load-failed":
      return Promise.resolve(undefined);
    case "load-stuck":
      return new Promise(() => {});
    case "no-extremes-today":
      return Promise.resolve(
        TideExtremesAtLocation.fromPossiblyUnordered(latitude, longitude, []),
      );
    default: {
      const _exhaustive: never = previewId;
      return _exhaustive;
    }
  }
}
