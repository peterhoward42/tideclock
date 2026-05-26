/**
 * Operator-facing copy when proxy monthly credits are exhausted.
 * Quota-only panel — generic load failures use different messaging.
 *
 * @see docs/planning/quota-response.md
 */

export const quotaExhaustedHeadline = "Tide data is paused";

export const quotaExhaustedWorldTidesHref = "https://www.worldtides.info/";
export const quotaExhaustedIntroLead =
  "The Tide Dial gets its tide times from WorldTides (";
export const quotaExhaustedIntroSiteLabel = "worldtides.info";
export const quotaExhaustedIntroEnd = ").";

/** Main paragraphs after the WorldTides intro (lay language; no cache/API jargon). */
export const quotaExhaustedBodyParagraphs = [
  "I pay for a monthly data allowance personally so everyone can use it without the irritation of adverts.",
  "But, if you're seeing this, the dial's had an unusually busy month, and between us, we've used up this month's allowance.",
  "I'll be alerted and top it up — usually within a day.",
] as const;

/** Soft pointer into the nerd route (WorldTides, proxy, fetch windows). */
export const quotaExhaustedSoftwareNerdHref = "#/softwarenerd";
export const quotaExhaustedSoftwareNerdLinkText = "The Software Nerd version";

/** Story route — “Buy me a coffee” lives on that page. */
export const quotaExhaustedStoryHref = "#/story";
export const quotaExhaustedCoffeeAsidePrefix =
  "If you'd care to make a small contribution towards the costs — see the ";
export const quotaExhaustedCoffeeAsideBuyLinkLabel = "Buy me a coffee";
export const quotaExhaustedCoffeeAsideMid = " link on the ";
export const quotaExhaustedCoffeeAsideStoryLinkLabel = "Story page";
export const quotaExhaustedCoffeeAsideEnd = ".";

/** Short line for compact chrome (e.g. TideClock). */
export const quotaExhaustedShortStatus = quotaExhaustedHeadline;
