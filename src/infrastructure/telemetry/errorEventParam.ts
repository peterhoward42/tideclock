/**
 * errorEventParam.ts — Stable `eventParams` values when telemetry `type` is `'error'`.
 * Kind: Definition. Maps user-visible failure modes to stable ingest strings.
 */

/** Passed as `eventParams` on `type: 'error'` events. */
export type TelemetryErrorEventParam =
  | 'tide_load_failed'
  | 'tide_quota_exhausted'
  | 'diagram_render_failed';
