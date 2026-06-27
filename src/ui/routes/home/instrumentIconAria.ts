/** Short accessibility labels for diagram instrument icon toggles. */

export function fullScreenIconAriaLabel(active: boolean): string {
  return active ? "Exit fullscreen" : "Really fullscreen";
}

export function keepAwakeIconAriaLabel(userWants: boolean): string {
  return userWants ? "Keep screen awake is on" : "Keep screen awake is off";
}
