/**
 * resolveForHome.ts — Dev preview resolver: frozen clock, optional extremes override, and banner copy (see README “Developer previews”).
 */

import type { TideExtremesAtLocation } from "../../core-models/TideExtremesAtLocation";
import type { UtcIsoToLocalCanonicalTime } from "../buildDiagramSpec";
import { buildAtypicalTideDayPreview } from "./atypicalTideDay";
import {
  diagramPreviewShortHeadline,
  type DiagramPreviewId,
} from "./previewCatalog";
import { buildNoMoreTidesTodayClock } from "./noMoreTidesToday";
import { buildTimeDeltaMediumClock } from "./timeDeltaMedium";
import { buildTimeDeltaShortClock } from "./timeDeltaShort";

export type HomeDiagramPreviewState =
  | { readonly state: "live" }
  | { readonly state: "waiting"; readonly id: DiagramPreviewId }
  | {
      readonly state: "inactive";
      readonly id: DiagramPreviewId;
      readonly userDetail: string;
    }
  | {
      readonly state: "frozen";
      readonly id: DiagramPreviewId;
      readonly userDetail: string;
      readonly frozenEpochMs: number;
      readonly extremesAtLocation: TideExtremesAtLocation;
    };

export function resolveHomeDiagramPreview(params: {
  readonly dev: boolean;
  readonly previewId: DiagramPreviewId | null;
  readonly tideExtremes: TideExtremesAtLocation | undefined;
  readonly utcIsoToLocalCanonicalTime: UtcIsoToLocalCanonicalTime;
}): HomeDiagramPreviewState {
  const { dev, previewId, tideExtremes, utcIsoToLocalCanonicalTime } = params;
  if (!dev || previewId === null) {
    return { state: "live" };
  }
  if (tideExtremes === undefined || tideExtremes.extremes.length === 0) {
    return { state: "waiting", id: previewId };
  }

  switch (previewId) {
    case "no-more-tides-today": {
      const clock = buildNoMoreTidesTodayClock({
        extremesAtLocation: tideExtremes,
        utcIsoToLocalCanonicalTime,
      });
      if (clock.kind !== "active") {
        return {
          state: "inactive",
          id: previewId,
          userDetail:
            "unavailable for this day's extremes (last tide too close to end of civil day)",
        };
      }
      return {
        state: "frozen",
        id: previewId,
        userDetail: "frozen time for diagram",
        frozenEpochMs: clock.frozenEpochMs,
        extremesAtLocation: tideExtremes,
      };
    }
    case "time-delta-short": {
      const clock = buildTimeDeltaShortClock({
        extremesAtLocation: tideExtremes,
        utcIsoToLocalCanonicalTime,
      });
      if (clock.kind !== "active") {
        return {
          state: "inactive",
          id: previewId,
          userDetail: "unavailable for this day's extremes",
        };
      }
      return {
        state: "frozen",
        id: previewId,
        userDetail: "frozen time close to next tide",
        frozenEpochMs: clock.frozenEpochMs,
        extremesAtLocation: tideExtremes,
      };
    }
    case "time-delta-medium": {
      const clock = buildTimeDeltaMediumClock({
        extremesAtLocation: tideExtremes,
        utcIsoToLocalCanonicalTime,
      });
      if (clock.kind !== "active") {
        return {
          state: "inactive",
          id: previewId,
          userDetail: "unavailable for this day's extremes",
        };
      }
      return {
        state: "frozen",
        id: previewId,
        userDetail: "frozen time a short while before next tide",
        frozenEpochMs: clock.frozenEpochMs,
        extremesAtLocation: tideExtremes,
      };
    }
    case "atypical-tide-day": {
      const material = buildAtypicalTideDayPreview({
        extremesAtLocation: tideExtremes,
      });
      if (material.kind !== "active") {
        return {
          state: "inactive",
          id: previewId,
          userDetail: "unavailable (no tide extremes loaded)",
        };
      }
      return {
        state: "frozen",
        id: previewId,
        userDetail:
          "synthetic five-tide local day, frozen time in countdown window",
        frozenEpochMs: material.frozenEpochMs,
        extremesAtLocation: material.extremesAtLocation,
      };
    }
    default: {
      const _exhaustive: never = previewId;
      return _exhaustive;
    }
  }
}

export function formatDiagramPreviewBanner(
  preview: HomeDiagramPreviewState,
): string | null {
  if (preview.state === "live") {
    return null;
  }
  const headline = diagramPreviewShortHeadline(preview.id);
  if (preview.state === "waiting") {
    return `Preview: ${headline} (waiting for tide data…)`;
  }
  if (preview.state === "inactive") {
    return `Preview: ${headline} — ${preview.userDetail}`;
  }
  return `Preview: ${headline} (${preview.userDetail})`;
}

export function homeDiagramPreviewIsFrozen(
  preview: HomeDiagramPreviewState,
): preview is Extract<HomeDiagramPreviewState, { state: "frozen" }> {
  return preview.state === "frozen";
}
