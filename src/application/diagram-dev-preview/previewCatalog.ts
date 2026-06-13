/**
 * previewCatalog.ts — Shared wiring for diagram dev previews (see README “Developer previews”).
 * Owns query-param decoding and preview ids, but not scenario-specific clock logic.
 */

export const DIAGRAM_PREVIEW_QUERY_PARAM = "diagramPreview" as const;

/** Whole-hour `timeNow` for inspecting Location placement (`0`–`23`). */
export const TIME_NOW_HOUR_QUERY_PARAM = "timeNowHour" as const;

/** Known dev-preview scenarios for the Home tide diagram. */
export const DIAGRAM_PREVIEW_IDS = [
  "no-more-tides-today",
  "time-delta-short",
  "time-delta-medium",
  "atypical-tide-day",
] as const;

export type DiagramPreviewId = (typeof DIAGRAM_PREVIEW_IDS)[number];

const HEADLINE: Record<DiagramPreviewId, string> = {
  "no-more-tides-today": "no more tides today",
  "time-delta-short": "time-delta-short",
  "time-delta-medium": "time-delta-medium",
  "atypical-tide-day": "atypical tide day",
};

export function diagramPreviewShortHeadline(id: DiagramPreviewId): string {
  return HEADLINE[id];
}

function isDiagramPreviewId(value: string): value is DiagramPreviewId {
  return (DIAGRAM_PREVIEW_IDS as readonly string[]).includes(value);
}

/**
 * Reads the current diagram dev preview id from a raw search string.
 * DEV-only: returns null when not in dev builds or when the id is unknown.
 */
export function diagramPreviewIdFromSearch(
  search: string,
): DiagramPreviewId | null {
  if (!import.meta.env.DEV) return null;
  try {
    const q = new URLSearchParams(search);
    const value = q.get(DIAGRAM_PREVIEW_QUERY_PARAM);
    if (value === null) return null;
    if (isDiagramPreviewId(value)) {
      return value;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Reads a whole-hour dev override for `timeNow` from a raw search string.
 * DEV-only: returns null outside dev builds or when the value is not `0`–`23`.
 */
export function timeNowHourFromSearch(search: string): number | null {
  if (!import.meta.env.DEV) return null;
  try {
    const q = new URLSearchParams(search);
    const value = q.get(TIME_NOW_HOUR_QUERY_PARAM);
    if (value === null) return null;
    const hour = Number.parseInt(value, 10);
    if (!Number.isInteger(hour) || hour < 0 || hour > 23) {
      return null;
    }
    return hour;
  } catch {
    return null;
  }
}
