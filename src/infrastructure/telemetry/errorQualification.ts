/**
 * errorQualification.ts — Enum qualifiers for `type: 'error'` telemetry (no free-form detail).
 * Kind: Definition. Maps user-visible failure modes to stable ingest values.
 */

/** Required when {@link TelemetryEventType} is `'error'`; omitted for all other event types. */
export type TelemetryErrorQualification =
  | 'tide_load_failed'
  | 'tide_quota_exhausted'
  | 'diagram_render_failed';
