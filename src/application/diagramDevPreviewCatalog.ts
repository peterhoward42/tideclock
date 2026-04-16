/**
 * diagramDevPreviewCatalog.ts — Shared wiring for diagram dev previews (see docs/planning/diagram-dev-preview-catalog.md).
 * Owns query-param decoding and preview ids, but not scenario-specific clock logic.
 */

export const DIAGRAM_DEV_PREVIEW_QUERY_PARAM = "diagramPreview" as const;

/** Known dev-preview scenarios for the Home tide diagram. */
export type DiagramDevPreviewId =
  | "no-more-tides-today"
  | "time-delta-short"
  | "time-delta-medium";

/**
 * Reads the current diagram dev preview id from a raw search string.
 * DEV-only: returns null when not in dev builds or when the id is unknown.
 */
export function diagramDevPreviewIdFromSearch(
  search: string,
): DiagramDevPreviewId | null {
  if (!import.meta.env.DEV) return null;
  try {
    const q = new URLSearchParams(search);
    const value = q.get(DIAGRAM_DEV_PREVIEW_QUERY_PARAM);
    if (value === null) return null;
    if (
      value === "no-more-tides-today" ||
      value === "time-delta-short" ||
      value === "time-delta-medium"
    ) {
      return value;
    }
    return null;
  } catch {
    return null;
  }
}

