/**
 * Production operator notice — flip `OPERATOR_NOTICE_ACTIVE` and redeploy to show visitors
 * a full-screen message instead of the tide dial (no routes, no tide load).
 */

/** Set to `true` before deploy; `false` when the app should run normally again. */
export const OPERATOR_NOTICE_ACTIVE = false;
