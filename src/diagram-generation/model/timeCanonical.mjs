const CANONICAL_TIME_RE = /^(\d{2}):(\d{2}):(\d{2})$/;

/**
 * Parse strict canonical time "HH:MM:SS".
 * Allows "24:00:00" only as a special sentinel (right endpoint of the civil day).
 *
 * @param {unknown} value
 * @param {string} label — included in thrown `Error` messages (caller context)
 * @returns {{ canonical: string, seconds: number, hours: number, isRightEndpoint: boolean }}
 * @throws {Error} non-string, bad format, out-of-range components (other than `24:00:00`)
 */
export function parseCanonicalTimeOrThrow(value, label) {
  if (typeof value !== "string") {
    throw new Error(`${label} must be a canonical time string "HH:MM:SS"`);
  }
  const m = CANONICAL_TIME_RE.exec(value);
  if (!m) {
    throw new Error(`${label} must match strict canonical format "HH:MM:SS"`);
  }
  const hh = Number(m[1]);
  const mm = Number(m[2]);
  const ss = Number(m[3]);

  if (hh === 24 && mm === 0 && ss === 0) {
    return {
      canonical: value,
      seconds: 24 * 3600,
      hours: 24,
      isRightEndpoint: true,
    };
  }

  if (hh < 0 || hh > 23 || mm < 0 || mm > 59 || ss < 0 || ss > 59) {
    throw new Error(
      `${label} has out-of-range components; expected HH 00..23 and MM/SS 00..59, or "24:00:00"`,
    );
  }

  const seconds = hh * 3600 + mm * 60 + ss;
  return {
    canonical: value,
    seconds,
    hours: seconds / 3600,
    isRightEndpoint: false,
  };
}

/**
 * First five characters of a strict canonical time (`HH:MM`).
 *
 * Precondition: `canonical` is a string that already satisfied
 * {@link parseCanonicalTimeOrThrow} (length and colons as in `HH:MM:SS`). Callers that
 * only have raw spec data must parse first; this helper does not re-validate.
 *
 * @param {string} canonical
 * @returns {string}
 */
export function formatCanonicalHHMM(canonical) {
  return canonical.slice(0, 5);
}
