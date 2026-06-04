/**
 * eventType.ts — Closed vocabulary of client telemetry event types.
 * Kind: Definition. Extend when adding new product signals; keep values stable for the ingest API.
 */

/** Canonical `type` field sent to the telemetry ingest API. */
export type TelemetryEventType =
  | 'loaded'
  | 'data_fetch_from_proxy'
  | 'set_custom_loc'
  | 'visited_stick_on_wall'
  | 'visited_install'
  | 'used_screen_awake'
  | 'used_really_full'
  | 'visited_story'
  | 'clicked_thru_to_coffee'
  | 'clicked_thru_to_drawexact'
  | 'visited_tide_nerd'
  | 'visited_sw_nerd'
  | 'visited_about'
  | 'visited_contact'
  | 'error';
