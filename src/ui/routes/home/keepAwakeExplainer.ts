/** Copy for the dismissable keep-awake explainer shown after each diagram-icon toggle. */

export function formatKeepAwakeExplainerMessage(enabled: boolean): string {
  if (enabled) {
    return "Now your screen will stay awake";
  }
  return "Now your screen can sleep as normal";
}
