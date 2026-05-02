/**
 * civilHalfDayLayout.mjs — Global diagram input for which civil half-day layout branch to use
 * (before noon vs after noon) without altering `timeNow`, `t_now`, or `θ_now`.
 * See docs/specs/tide-diagram.md §Global civil half-day layout.
 */

/** @typedef {'auto' | 'beforeNoon' | 'afterNoon'} CivilHalfDayLayoutMode */

const VALID = new Set(["auto", "beforeNoon", "afterNoon"]);

/**
 * @param {CivilHalfDayLayoutMode} mode
 * @param {number} tNowHours — fractional civil hours from `timeNow` (same as spec **t_now**)
 * @returns {boolean} **true** = use the **t_now ≤ 12** presentation branch
 */
export function resolveCivilHalfDayIsBeforeNoon(mode, tNowHours) {
  if (mode === "beforeNoon") return true;
  if (mode === "afterNoon") return false;
  return tNowHours <= 12;
}

/**
 * @param {unknown} raw
 * @returns {CivilHalfDayLayoutMode}
 */
export function parseCivilHalfDayLayoutOrThrow(raw) {
  if (raw === undefined || raw === null) {
    return "auto";
  }
  if (typeof raw !== "string" || !VALID.has(raw)) {
    throw new Error(
      'spec.civilHalfDayLayout must be "auto", "beforeNoon", or "afterNoon" when provided',
    );
  }
  return /** @type {CivilHalfDayLayoutMode} */ (raw);
}
