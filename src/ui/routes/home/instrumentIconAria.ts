/** Short accessibility labels for diagram instrument icon toggles. */

export function fullScreenIconAriaLabel(active: boolean): string {
  return active ? "Exit fullscreen" : "Really fullscreen";
}

export function keepAwakeIconAriaLabel(_userWants: boolean): string {
  return "Keep screen awake";
}
