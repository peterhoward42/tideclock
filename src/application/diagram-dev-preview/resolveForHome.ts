/**
 * resolveForHome.ts — Dev preview resolver: frozen clock, optional extremes override, and banner copy (see README “Developer previews”).
 */

import type { TideExtremesAtLocation } from "../../core-models/TideExtremesAtLocation";
import type { UtcIsoToLocalCanonicalTime } from "../buildDiagramSpec";
import { buildAtypicalTideDayPreview } from "./atypicalTideDay";
import { buildLocationLayoutHourClock } from "./locationLayoutHour";
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
  | { readonly state: "waiting"; readonly hour: number }
  | {
      readonly state: "inactive";
      readonly id: DiagramPreviewId;
      readonly userDetail: string;
    }
  | {
      readonly state: "inactive";
      readonly hour: number;
      readonly userDetail: string;
    }
  | {
      readonly state: "frozen";
      readonly id: DiagramPreviewId;
      readonly userDetail: string;
      readonly frozenEpochMs: number;
      readonly extremesAtLocation: TideExtremesAtLocation;
    }
  | {
      readonly state: "frozen";
      readonly hour: number;
      readonly timeNow: string;
      readonly brhcDatePrefix: string;
      readonly userDetail: string;
      readonly frozenEpochMs: number;
      readonly extremesAtLocation: TideExtremesAtLocation;
    };

function formatLocationLayoutHourLabel(hour: number): string {
  return `${String(hour).padStart(2, "0")}:00`;
}

export function resolveHomeDiagramPreview(params: {
  readonly dev: boolean;
  readonly previewId: DiagramPreviewId | null;
  readonly timeNowHour: number | null;
  readonly tideExtremes: TideExtremesAtLocation | undefined;
  readonly utcIsoToLocalCanonicalTime: UtcIsoToLocalCanonicalTime;
}): HomeDiagramPreviewState {
  const { dev, previewId, timeNowHour, tideExtremes, utcIsoToLocalCanonicalTime } =
    params;
  if (!dev) {
    return { state: "live" };
  }

  if (timeNowHour !== null) {
    if (tideExtremes === undefined || tideExtremes.extremes.length === 0) {
      return { state: "waiting", hour: timeNowHour };
    }
    const clock = buildLocationLayoutHourClock({
      hour: timeNowHour,
      extremesAtLocation: tideExtremes,
    });
    if (clock.kind !== "active") {
      return {
        state: "inactive",
        hour: timeNowHour,
        userDetail: "unavailable (no tide extremes loaded)",
      };
    }
    return {
      state: "frozen",
      hour: timeNowHour,
      timeNow: clock.timeNow,
      brhcDatePrefix: clock.brhcDatePrefix,
      userDetail: "frozen timeNow for layout placement",
      frozenEpochMs: clock.frozenEpochMs,
      extremesAtLocation: tideExtremes,
    };
  }

  if (previewId === null) {
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
  if ("hour" in preview) {
    const label = formatLocationLayoutHourLabel(preview.hour);
    if (preview.state === "waiting") {
      return `Preview: location layout at ${label} (waiting for tide data…)`;
    }
    if (preview.state === "inactive") {
      return `Preview: location layout at ${label} — ${preview.userDetail}`;
    }
    return `Preview: location layout at ${label} (${preview.userDetail})`;
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
