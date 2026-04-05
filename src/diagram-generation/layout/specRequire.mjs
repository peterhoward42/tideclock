/**
 * specRequire.mjs — Small guards for strict diagram spec parsing (finite numbers, objects, strings).
 * Used by layout modules so hosts supply explicit values with no silent fallbacks.
 */

/**
 * @param {unknown} value
 * @param {string} label — dotted path for error messages (e.g. `spec.canvas.width`)
 * @returns {number}
 */
export function requireFiniteNumber(value, label) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`${label} must be a finite number`);
  }
  return value;
}

/**
 * @param {unknown} value
 * @param {string} label
 * @returns {string}
 */
export function requireString(value, label) {
  if (typeof value !== "string") {
    throw new Error(`${label} must be a string`);
  }
  return value;
}

/**
 * @param {unknown} value
 * @param {string} label
 * @returns {Record<string, unknown>}
 */
export function requirePlainObject(value, label) {
  if (value == null || typeof value !== "object") {
    throw new Error(`${label} must be a plain object`);
  }
  return /** @type {Record<string, unknown>} */ (value);
}

/**
 * @param {unknown} value
 * @param {string} label
 * @returns {boolean}
 */
export function requireBoolean(value, label) {
  if (typeof value !== "boolean") {
    throw new Error(`${label} must be a boolean`);
  }
  return value;
}

/**
 * @param {unknown} value
 * @param {string} label
 * @returns {'filled' | 'open'}
 */
export function requireWaitArcArrowStyle(value, label) {
  if (value !== "filled" && value !== "open") {
    throw new Error(`${label} must be "filled" or "open"`);
  }
  return value;
}
