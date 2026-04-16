/**
 * diagramDevPreviewResolveForHome.ts — Single place that turns URL preview id + loaded extremes into
 * frozen clock, optional extremes override, and banner copy (see docs/planning/diagram-dev-preview-catalog.md).
 */

import type { TideExtremesAtLocation } from "../../core-models/TideExtremesAtLocation";
import type { UtcIsoToLocalCanonicalTime } from "../buildDiagramGenerationSpec";
import { buildDiagramDevPreviewAtypicalTideDay } from "./diagramDevPreviewAtypicalTideDay";
import {
  diagramDevPreviewShortHeadline,
  type DiagramDevPreviewId,
} from "./diagramDevPreviewCatalog";
import { buildDiagramDevPreviewNoMoreTidesTodayClock } from "./diagramDevPreviewNoMoreTidesToday";
import { buildDiagramDevPreviewTimeDeltaMediumClock } from "./diagramDevPreviewTimeDeltaMedium";
import { buildDiagramDevPreviewTimeDeltaShortClock } from "./diagramDevPreviewTimeDeltaShort";

export type HomeDiagramDevPreviewState =
  | { readonly state: "live" }
  | { readonly state: "waiting"; readonly id: DiagramDevPreviewId }
  | {
      readonly state: "inactive";
      readonly id: DiagramDevPreviewId;
      readonly userDetail: string;
    }
  | {
      readonly state: "frozen";
      readonly id: DiagramDevPreviewId;
      readonly userDetail: string;
      readonly frozenEpochMs: number;
      readonly extremesAtLocation: TideExtremesAtLocation;
    };

export function resolveHomeDiagramDevPreview(params: {
  readonly dev: boolean;
  readonly previewId: DiagramDevPreviewId | null;
  readonly tideExtremes: TideExtremesAtLocation | undefined;
  readonly utcIsoToLocalCanonicalTime: UtcIsoToLocalCanonicalTime;
}): HomeDiagramDevPreviewState {
  const { dev, previewId, tideExtremes, utcIsoToLocalCanonicalTime } = params;
  if (!dev || previewId === null) {
    return { state: "live" };
  }
  if (tideExtremes === undefined || tideExtremes.extremes.length === 0) {
    return { state: "waiting", id: previewId };
  }

  switch (previewId) {
    case "no-more-tides-today": {
      const clock = buildDiagramDevPreviewNoMoreTidesTodayClock({
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
      const clock = buildDiagramDevPreviewTimeDeltaShortClock({
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
      const clock = buildDiagramDevPreviewTimeDeltaMediumClock({
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
      const material = buildDiagramDevPreviewAtypicalTideDay({
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

export function formatDiagramDevPreviewBannerLine(
  preview: HomeDiagramDevPreviewState,
): string | null {
  if (preview.state === "live") {
    return null;
  }
  const headline = diagramDevPreviewShortHeadline(preview.id);
  if (preview.state === "waiting") {
    return `Preview: ${headline} (waiting for tide data…)`;
  }
  if (preview.state === "inactive") {
    return `Preview: ${headline} — ${preview.userDetail}`;
  }
  return `Preview: ${headline} (${preview.userDetail})`;
}

export function homeDiagramDevPreviewIsFrozen(
  preview: HomeDiagramDevPreviewState,
): preview is Extract<HomeDiagramDevPreviewState, { state: "frozen" }> {
  return preview.state === "frozen";
}
