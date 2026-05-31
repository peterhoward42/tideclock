/** Shared attributes for anchors that leave the app origin. */
export const externalLinkNewTabAttrs = {
  target: "_blank",
  rel: "noopener noreferrer",
} as const;

export function isOffSiteHttpHref(
  href: string,
  pageOrigin: string = typeof window === "undefined" ? "" : window.location.origin,
): boolean {
  if (
    href === "" ||
    href.startsWith("#") ||
    href.startsWith("mailto:") ||
    href.startsWith("tel:")
  ) {
    return false;
  }

  try {
    const url = new URL(href, pageOrigin || "http://localhost");
    return (
      (url.protocol === "http:" || url.protocol === "https:") &&
      url.origin !== pageOrigin
    );
  } catch {
    return false;
  }
}

/** Safety net: off-site http(s) links always open in a new tab. */
export function handleOffSiteLinkClick(event: MouseEvent): void {
  if (
    event.defaultPrevented ||
    event.button !== 0 ||
    event.metaKey ||
    event.ctrlKey ||
    event.shiftKey ||
    event.altKey
  ) {
    return;
  }

  const element = event.target;
  if (!(element instanceof Element)) {
    return;
  }

  const anchor = element.closest("a[href]");
  if (!(anchor instanceof HTMLAnchorElement)) {
    return;
  }

  const href = anchor.getAttribute("href");
  if (href === null || !isOffSiteHttpHref(href)) {
    return;
  }

  event.preventDefault();
  window.open(href, "_blank", "noopener,noreferrer");
}
