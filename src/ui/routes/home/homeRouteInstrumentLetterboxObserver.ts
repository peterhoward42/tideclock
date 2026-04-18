/**
 * Resize-driven measurement of vertical letterbox slack for the home instrument figure.
 */

import { verticalLetterboxSlackMidMeetPx } from "../../homeLandscapeHint";

export function mountInstrumentVerticalLetterboxSlackObserver(
  figure: HTMLElement,
  onSlackPx: (px: number) => void,
): () => void {
  const measure = (): void => {
    const svg = figure.querySelector("svg") as SVGSVGElement | null;
    const vb = svg?.viewBox?.baseVal;
    if (svg == null || vb == null) {
      onSlackPx(0);
      return;
    }
    onSlackPx(
      verticalLetterboxSlackMidMeetPx(
        figure.clientWidth,
        figure.clientHeight,
        vb.width,
        vb.height,
      ),
    );
  };

  const ro = new ResizeObserver(() => {
    queueMicrotask(measure);
  });
  ro.observe(figure);
  queueMicrotask(measure);

  return () => {
    ro.disconnect();
  };
}
