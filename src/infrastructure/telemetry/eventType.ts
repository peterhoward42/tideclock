/**
 * eventType.ts — Closed vocabulary of Vercel Web Analytics custom event names.
 * Kind: Definition. Extend when adding new product signals; keep values stable across dashboards.
 */

/** Custom event name passed to Vercel `track()`. */
export type TelemetryEventType =
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
