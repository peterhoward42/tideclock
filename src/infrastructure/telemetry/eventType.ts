/**
 * eventType.ts — Closed vocabulary of client telemetry event types (no per-event payload).
 * Kind: Definition. Extend when adding new product signals; keep values stable for the ingest API.
 */

/** Canonical `type` field sent to the telemetry ingest API. */
export type TelemetryEventType =
  | 'loaded'
  | 'set_custom_loc'
  | 'opened_menu_from_diagram'
  | 'opened_menu_from_header'
  | 'visited_stick_on_wall'
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
