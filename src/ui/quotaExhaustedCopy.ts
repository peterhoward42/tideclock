/** Interim operator-facing copy when proxy monthly credits are exhausted (see docs/planning/quota-response.md). */

export const quotaExhaustedHeadline = "Tide data is paused";

export const quotaExhaustedBody =
  "The shared tide API I pay for has hit its monthly limit. I’m not showing tide times until that’s fixed — I’d rather leave the dial empty than show something wrong. It usually comes back within a day; changing location or reloading tomorrow will try again.";

/** Short line for compact chrome (e.g. TideClock). */
export const quotaExhaustedShortStatus = quotaExhaustedHeadline;
