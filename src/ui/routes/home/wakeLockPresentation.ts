/**
 * What the home-route wake lock implementation reports for UI copy.
 */

export type WakeLockPresentation =
  | { kind: "not_supported" }
  | {
      kind: "inactive";
      reason: "user_off" | "background" | "request_failed";
    }
  | { kind: "active" };
