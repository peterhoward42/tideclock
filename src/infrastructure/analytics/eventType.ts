/**
 * eventType.ts — Closed vocabulary of Vercel Web Analytics custom event names.
 * Kind: Definition. Extend when adding new product signals; keep values stable across dashboards.
 */

import type { UsageSpanEventType } from './usageSpanEvents';

/** Custom event name passed to Vercel `track()`. */
export type TelemetryEventType =
  | 'opened_menu'
  | 'expanded_for_nerds'
  | 'chose_custom_loc'
  | 'url_location_applied'
  | 'url_location_failed'
  | 'first_custom_loc'
  | 'launched_as_pwa'
  | UsageSpanEventType
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
