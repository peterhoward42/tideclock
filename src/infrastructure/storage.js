// @ts-check

const KEY_PREFIX = 'tideclock:'

/**
 * @param {string} key
 * @returns {string | null}
 */
export function getItem(key) {
  if (typeof localStorage === 'undefined') {
    return null
  }
  try {
    return localStorage.getItem(KEY_PREFIX + key)
  } catch {
    return null
  }
}

/**
 * @param {string} key
 * @param {string} value
 */
export function setItem(key, value) {
  if (typeof localStorage === 'undefined') {
    return
  }
  try {
    localStorage.setItem(KEY_PREFIX + key, value)
  } catch {
    /* ignore quota / privacy mode */
  }
}
