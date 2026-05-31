import { describe, expect, it } from "vitest";
import { isOffSiteHttpHref } from "./externalLink";

describe("isOffSiteHttpHref", () => {
  const origin = "https://thetidedial.page";

  it("treats off-site http(s) links as external", () => {
    expect(isOffSiteHttpHref("https://www.quora.com/example", origin)).toBe(true);
    expect(isOffSiteHttpHref("https://www.drawexact.click/", origin)).toBe(true);
  });

  it("ignores in-app hash routes, mailto, and same-origin links", () => {
    expect(isOffSiteHttpHref("#/story", origin)).toBe(false);
    expect(isOffSiteHttpHref("mailto:peterhoward42@gmail.com", origin)).toBe(false);
    expect(isOffSiteHttpHref("https://thetidedial.page/", origin)).toBe(false);
    expect(isOffSiteHttpHref("/story-apple-logo-diagram.png", origin)).toBe(false);
  });
});
