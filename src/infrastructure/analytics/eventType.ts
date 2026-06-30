/**
 * eventType.ts — Closed vocabulary of Vercel Web Analytics custom event names.
 * Kind: Definition. Extend when adding new product signals; keep values stable across dashboards.
 */

import type { UsageSpanEventType } from './usageSpanEvents';

/** Custom event name passed to Vercel `track()`. */
export type TelemetryEventType =
  | 'opened_menu'
  | 'chose_custom_loc'
  | 'url_location_applied'
  | 'url_location_failed'
  | 'copied_location_link'
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
  | 'visited_about'
  | 'visited_install_config'
  | 'visited_entertainment'
  | 'visited_contact'
  | 'error';
