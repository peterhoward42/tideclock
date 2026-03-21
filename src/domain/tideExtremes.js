// @ts-check

/**
 * @typedef {'high' | 'low'} TideKind
 */

/**
 * One high or low water extreme used to build the continuous tide model.
 *
 * @typedef {Object} TideExtreme
 * @property {number} time Unix timestamp in milliseconds.
 * @property {number} height Height in metres relative to chart datum.
 * @property {TideKind} kind
 */

export {}
