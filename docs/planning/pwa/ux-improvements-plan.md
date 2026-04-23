# PWA UX improvements plan

This document captures UX improvements for Tideclock's PWA experience beyond default browser behavior. It is intentionally iterative: use this as the working draft for feedback rounds, decisions, and scope updates.

## Problem statement

Current PWA behavior works technically, but key value moments are easy to miss:

- Browser install prompts are fleeting and can disappear without a clear recovery path.
- Users may not understand why installation improves the Tideclock experience.
- Orientation guidance exists, but can be made more contextual and actionable.
- Wake lock behavior is implemented, but users may not understand when/why it helps, especially for on-charge "always on" usage.

## UX goals

- Make installation discoverable at any time, not only when browser prompts appear.
- Explain user benefits in plain language (fit, focus, always-on reliability).
- Keep orientation guidance helpful, lightweight, and dismissible.
- Make keep-awake behavior explicit, user-controlled, and honest about platform limits.
- Avoid nagging: prompts should be sparse, stateful, and easy to dismiss.

## Product principles

- Progressive enhancement, never hard requirement.
- User intent first: all install/fullscreen/wake requests should remain gesture-driven.
- Honest capability messaging: no promises the web platform cannot guarantee.
- Persistent affordances over one-time interruptions.
- Small, composable features that can ship independently.

## Candidate improvements

## 1) Persistent install entry point

Add a durable `Install app` entry in app UI (menu/settings/help), available even after the browser's default prompt is gone.

- If `beforeinstallprompt` is available, trigger it from explicit user action.
- If unavailable, show platform-specific manual install instructions.
- Keep this entry discoverable after initial dismissal.

## 2) Install benefit explainer

Add a compact explanation of why app install is useful for Tideclock:

- Better home route fit (less browser chrome competing for space).
- Better support for immersive usage patterns.
- Better context for wake/orientation enhancements.

Format options:

- Inline banner/card (dismissible).
- Small "Why install?" info sheet from menu.
- One-time tooltip in home route context.

## 3) Setup helper for installed mode

Optional first-run helper when launched in standalone mode:

1. Suggest landscape orientation for best diagram fit.
2. Explain and offer keep-awake preference.

Requirements:

- Fully skippable.
- "Don't show again" support.
- Can be reopened from settings/help.

## 4) Keep-awake UX controls

Expose wake behavior as explicit UX, not invisible background logic:

- Show a `Keep screen awake` toggle (home or settings).
- Explain tradeoffs (battery/heat when not charging).
- Show state feedback (`active`, `inactive`, or `not supported`).
- When possible, prefer contextual suggestion for on-charge sessions.

## 5) Orientation nudge refinement

Upgrade current orientation suggestion from passive hint to contextual guidance:

- Trigger only when portrait materially hurts readability.
- Keep dismissible with a remembered preference.
- Add concise "why landscape helps" explanation.
- Never block usage in portrait mode.

## 6) Reminder and recovery heuristics

Design gentle rules for resurfacing key suggestions without nagging:

- Re-show install reminder only after time/use thresholds.
- Stop reminders after explicit dismissal preference.
- Avoid stacking multiple prompts in one session.

## Proposed rollout phases

### Phase 1 (quick wins)

- Persistent `Install app` entry point.
- Install explainer copy (short, benefit-led).
- Dismissal persistence for install/orientation nudges.

### Phase 2 (core UX uplift)

- Installed-mode setup helper.
- Keep-awake toggle + clear status UX.
- Contextual orientation nudge improvements.

### Phase 3 (measurement + tuning)

- Instrument basic events (view/click/accept/dismiss).
- Tune reminder cadence based on real behavior.
- Refine copy and entry points based on usage patterns.

## Scope and tradeoff decisions to make

- How often (if ever) to resurface install reminders after dismissal.
- Whether keep-awake defaults to off/on/prompted in standalone.
- How much platform-specific instruction detail to include inline.
- Whether orientation guidance appears in onboarding, in-context only, or both.

## Draft event metrics (optional but recommended)

- Install CTA shown / clicked.
- `beforeinstallprompt` available / fired / accepted / dismissed.
- Manual install help opened.
- Orientation nudge shown / dismissed / disabled.
- Keep-awake toggled on/off.
- Wake lock acquisition success/failure (aggregated reason categories only).

## Risks and mitigations

- Prompt fatigue -> strict frequency caps and easy dismissal.
- Platform inconsistency -> capability detection + fallback copy.
- Overpromising "always-on" behavior -> explicit limits in copy.
- UX clutter on home route -> progressive disclosure and compact controls.

## Current assumptions

- Existing wake lock and orientation-lock implementation remain best-effort.
- Service worker remains out of scope unless explicitly revisited.
- UX improvements should integrate with existing home route controls and PWA docs.

## Iteration log

Use this section to capture each planning round's conclusions.

### Round 1 (2026-04-23)

- Established scope direction: improved install discoverability, better benefit communication, explicit keep-awake UX, and refined orientation guidance.
- Agreed to create a dedicated planning doc to iterate against before coding further changes.

### Next feedback prompts

- Which 1-2 ideas should be treated as MVP for the next implementation pass?
- Preferred location for persistent `Install app` entry (menu, settings, home banner, or mixed)?
- Should keep-awake be a toggle, a one-time prompt, or both?
- How assertive should orientation guidance be (subtle, moderate, or prominent)?
