# Tide Dial - Donation / Support Model Notes

## Overall conclusion

A light-touch, personality-driven support model appears to fit *The Tide Dial* very naturally.

The project already presents itself less like a conventional software product and more like:
- a crafted instrument
- a coastal artefact
- a mildly whimsical public utility
- an independently made web object with visible authorship

That makes optional user support feel culturally and emotionally appropriate rather than awkward.

## Important tonal observation

The app is:
- technically serious about tide data
- mildly playful in presentation
- dryly humorous in places
- intentionally human and personal

Examples discussed:
- "Stick it on the wall"
- the warm/jokey "tide nerd" educational sequence
- pages that expose the project's identity and authorship

Because the site already establishes a relationship with the user, support language can feel like a continuation of that relationship rather than a monetisation interruption.

## Recommended framing

Avoid:
- aggressive monetisation language
- guilt-based appeals
- startup-style CTA language
- intrusive floating widgets or banners

Instead, use something understated and human.

Strong candidate phrasing discussed:

> "If you like this / enjoyed this - I have no great objection to you buying me a virtual coffee"

Why this works:
- understated
- low-pressure
- dryly humorous
- recognisably human
- compatible with the site's existing tone

The phrase feels more like hospitality or appreciation than commerce.

## "Buy me a coffee"

The coffee metaphor is already widely established online for lightweight creator support.

This turned out not to be accidental originality, but that is not a problem:
- users immediately understand the interaction
- the metaphor communicates small, voluntary appreciation
- the user's own phrasing still carried a distinctive voice

The specific wording was considered more important than the metaphor itself.

## Recommended payment mechanisms

Most suitable options discussed:

- Ko-fi
- Buy Me a Coffee

Recommendation:
- use the service only as infrastructure
- preserve Tide Dial's own tone in the surrounding copy
- avoid embedding loud branded widgets if possible

A plain text link may fit the atmosphere better than a large support button.

## UX placement (implemented)

- **Not** a main-menu item — would add weight to every menu open and signal monetisation too early in the journey.
- **Story route** (`#/story`), immediately after the Ramsgate product photo and **before** the Contact paragraph and DrawExact epilogue.
- **Pattern:** a short inset aside (bordered panel), not a heading or provider widget; one outbound link via `VIRTUAL_COFFEE_URL` in [`src/support.ts`](../../src/support.ts).
- Copy leads with the “no great objection … virtual coffee” line; a second line notes no ads, no account, entirely optional.

## Future paid features

The project may later justify small paid extras where they directly increase infrastructure/API costs.

Examples discussed:
- tomorrow's tides
- extended forecasts
- more API-intensive features

This was considered psychologically fair because:
- the costs are concrete and explainable
- users already understand forecasting/services as resource-consuming
- monetisation would map naturally to real operational load

Suggested distinction:
- voluntary "coffee" support remains casual and emotional
- infrastructure-heavy premium features are explained pragmatically

## Overall strategic tone

The ideal atmosphere was considered to be:

- the project feels complete without support
- support feels welcome but unnecessary
- the creator remains visible as a human presence
- the site retains calmness, sincerity, and mild charm
- monetisation never dominates the experience
