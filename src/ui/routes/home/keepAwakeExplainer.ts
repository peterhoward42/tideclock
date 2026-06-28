/** Copy for the dismissable keep-awake explainer shown after each diagram-icon toggle. */

export function formatKeepAwakeExplainerMessage(enabled: boolean): {
  readonly lead: string;
  readonly body: string;
} {
  if (enabled) {
    return {
      lead: "Keep screen awake is on",
      body: "The display won't dim or switch off while TideDial is open and visible.",
    };
  }
  return {
    lead: "Keep screen awake is off",
    body: "The screen can sleep normally again.",
  };
}
