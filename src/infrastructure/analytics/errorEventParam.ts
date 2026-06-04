/**
 * errorEventParam.ts — Stable `reason` values for the `error` custom event.
 * Kind: Definition. Maps user-visible failure modes to stable analytics strings.
 */

/** Passed as `reason` on `error` events. */
export type TelemetryErrorEventParam =
  | 'tide_load_failed'
  | 'tide_quota_exhausted'
  | 'diagram_render_failed';
