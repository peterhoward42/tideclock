# PWA UX improvements plan

This document captures UX improvements for Tideclock's PWA experience beyond default browser behavior. It is intentionally iterative: use this as the working draft for feedback rounds, decisions, and scope updates.

## Problem statement

Current PWA behavior works technically, but key value moments are easy to miss:

- Browser install prompts are fleeting and can disappear without a clear recovery path.
- Users may not understand why installation improves the Tideclock experience.
- Wake lock behavior is implemented, but users may not understand when/why it helps, especially for on-charge "always on" usage.

## UX goals

- Make installation discoverable at any time, not only when browser prompts appear.
- Explain user benefits in plain language (fit, focus, always-on reliability).
- Make keep-awake behavior explicit, user-controlled, and honest about platform limits.
- Avoid nagging: prefer persistent affordances over repeated reminders.

## Product principles

- Progressive enhancement, never hard requirement.
- User intent first: all install/fullscreen/wake requests should remain gesture-driven.
- Honest capability messaging: no promises the web platform cannot guarantee.
- Persistent affordances over one-time interruptions.
- Small, composable features that can ship independently.

## Candidate improvements

## 1) First-class install menu entry

Add a durable, first-class `Install app` entry in the primary menu (not nested under settings), available even after the browser's default prompt is gone.

- If `beforeinstallprompt` is available, trigger it from explicit user action.
- If unavailable, show platform-specific manual install instructions.
- Keep this entry always discoverable after any dismissal.

## 2) Install benefit explainer within install flow

Use the `Install app` experience itself to explain why install is useful for Tideclock.

- Better home route fit (less browser chrome competing for space).
- Better support for immersive usage patterns.
- Better context for keep-awake behavior.

Implementation direction:

- Do not add a separate inline banner/card.
- Do not add one-off tooltip treatment.
- Keep explanation content attached to the install entry/action so guidance is symmetric and easy to rediscover.

## 3) Setup helper for installed mode

Optional first-run helper when launched in standalone mode:

1. Explain and offer keep-awake preference.

Requirements:

- Fully skippable.
- "Don't show again" support.
- Can be reopened from menu/help.

## 4) Keep-awake UX controls

Expose wake behavior as explicit UX, not invisible background logic:

- Show a `Keep screen awake` toggle (home or settings/menu surface).
- Explain tradeoffs (battery/heat when not charging).
- Show state feedback (`active`, `inactive`, or `not supported`).
- When possible, prefer contextual suggestion for on-charge sessions.

## 5) Orientation guidance status

Orientation guidance is already in a good state and does not need additional feature work in this pass.

- Keep the existing in-context portrait letterbox hint behavior.
- Do not add onboarding-specific orientation steps.
- Continue to avoid blocking portrait usage.

## 6) Reminder and recovery heuristics

Use a low-interruption strategy for install and setup suggestions.

- Rely on the persistent menu entry as the primary recovery path.
- Do not add timed or threshold-based install reminder resurfacing.
- Avoid stacking multiple prompts in one session.

## Proposed rollout phases

### Phase 1 (quick wins)

- First-class `Install app` menu entry.
- Install explainer copy embedded in install flow.
- Keep-awake copy/status polish where already exposed.

### Phase 2 (core UX uplift)

- Installed-mode setup helper focused on keep-awake preference.
- Keep-awake toggle + clear status UX (if not already complete).
- Navigation polish to keep install/help surfaces easy to rediscover.

### Phase 3 (stabilization and tuning)

- Refine copy and entry-point placement based on qualitative feedback.
- Tighten edge-case handling for unsupported APIs and platform variance.
- Reassess lightweight instrumentation options if backend support is introduced.

## Scope and tradeoff decisions to make

- Whether keep-awake default should be off, on, or prompted in standalone mode.
- How much platform-specific install instruction detail to include inline.
- Exact placement of keep-awake controls between home and menu/settings surfaces.

## Measurement status

Event metrics are currently deferred because there is no general-purpose backend/event pipeline in place.

If telemetry becomes available later, capture only lightweight, product-level signals:

- Install CTA clicked.
- `beforeinstallprompt` available / fired / accepted / dismissed.
- Manual install help opened.
- Keep-awake toggled on/off.
- Wake lock acquisition success/failure (aggregated reason categories only).

## Risks and mitigations

- Prompt fatigue -> avoid timed resurfacing and keep one persistent recovery entry.
- Platform inconsistency -> capability detection + fallback copy.
- Overpromising "always-on" behavior -> explicit limits in copy.
- UX clutter on home route -> keep install guidance in menu-driven flow.

## Current assumptions

- Existing wake lock and orientation-lock implementation remain best-effort.
- Existing orientation hint behavior remains as-is for this pass.
- Service worker remains out of scope unless explicitly revisited.
- UX improvements should integrate with existing home route controls and PWA docs.

## Iteration log

Use this section to capture each planning round's conclusions.

### Round 1 (2026-04-23)

- Established scope direction: improved install discoverability, better benefit communication, explicit keep-awake UX, and refined orientation guidance.
- Agreed to create a dedicated planning doc to iterate against before coding further changes.

### Round 2 (2026-04-24)

- Chose a first-class menu `Install app` entry as the primary install affordance.
- Chose to keep install benefits inside the install flow rather than separate banners/tooltips.
- Removed additional orientation work from scope; existing orientation nudge remains.
- Deferred metrics instrumentation until a backend/event pipeline exists.

### Next feedback prompts

- Should the installed-mode setup helper ship in the same release as the menu install entry, or one release later?
- For keep-awake preference, should first-run behavior be default-off or prompt-once?
- Where should platform-specific manual install instructions live: compact inline copy or an expanded help panel?
