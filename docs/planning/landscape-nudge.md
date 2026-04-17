# Home route: landscape encouragement

## Purpose

Record agreed product and implementation direction for **encouraging landscape** on the **home** route: a **subtle, non-blocking** hint shown only where spare layout already exists, without alternate diagram layouts, persistence, or dismiss flows. This doc is the source of truth for implementation and review.

**Product context:** The home view is dominated by a civil-day tide diagram (wide “smile” / clock-like arc) described in `docs/specs/elevator-pitch.md`. That presentation is optimised for **wide, short** space. In **narrow, tall** space the same pipeline still runs—the diagram is **fitted** to the slot with letterboxing / scaling—so portrait remains **valid**, not broken.

## Conclusions

1. **Where it lives**  
   Place copy in the **vertical letterbox bands** (spare space above and below the fitted diagram), not in a separate app-chrome banner. Parent containers already unify background so the stage reads as **one instrument**; the hint should sit in that same perceived surface so it feels like ambient guidance in empty padding, not a stacked UI strip.

2. **Nudge, not gate**  
   Do **not** block interaction, force rotation, or imply portrait is erroneous. No full-screen overlays, no occlusion of the arc for emphasis, and no modal treatment.

3. **Audience: phones and tablets (not desktop)**  
   **Tablets are treated the same as phones** for this feature: same hint, same placement, same lifecycle—there is no separate “tablet mode” or toned-down copy. Omit the hint **only when policy says desktop** (wide layout viewport: a narrow browser window on a laptop is still desktop, not “hold the device wider”). Foldables and split-screen are covered by whatever `deviceClass` and `aspectClass` the viewport produces; no extra product branches.

   In `displayOptimisation` terms (`src/ui/displayOptimisation.ts`): `deviceClass` is **`"mobile"` or `"tablet"`** for in-scope devices; **`"desktop"`** is always out of scope.

4. **No dismiss, snooze, or storage**  
   If the user stays in portrait, **nothing else happens**: no “don’t show again,” no localStorage, no second strategy. The line may remain visible whenever the predicate is true.

5. **Single layout path**  
   Do **not** add a separate portrait layout, different diagram geometry, or fit/letterbox branches keyed on “hint visible.” The hint consumes only slack that the existing deterministic fit already produces.

6. **Policy from one module**  
   Use `src/ui/displayOptimisation.ts` (`displayOptimisation`: `aspectClass`, `deviceClass`) as the **only** source for whether to show the hint. Do not duplicate orientation logic with parallel breakpoints or `matchMedia` unless inner width/height cannot express the rule.

   - **Show when:** `aspectClass === "portrait"` **and** (`deviceClass === "mobile"` **or** `deviceClass === "tablet"`).

7. **Minimum slack (implementation guardrail)**  
   On real phones, portrait vs landscape is usually **clear**; deterministic layout still means band height is a **function** of viewport and chrome. If vertical slack falls below a **small threshold** (enough for readable type and touch-safe margins), **omit** the hint rather than squeezing copy into a sliver. Threshold is a fixed, testable constant—not a reflow workaround.

8. **Scope**  
   Home route only (`src/ui/routes/Home.svelte` or a small child colocated with the diagram stage). Other routes are not the same arc; a global message would be misleading.

## Non-goals

- Desktop messaging (including narrow windows that still classify as `deviceClass === "desktop"`).
- Full-screen “rotate device” overlays, modal gates, or kiosk-style locking in the normal tab.
- Tracking dismissals or acknowledgments; localStorage (or equivalent) for this feature.
- A second diagram spec or CSS layout mode for portrait keyed on the hint.
- `screen.orientation` unless a future need cannot be expressed from **inner width/height**; default is **not** to add it.

## Implementation sketch

- Subscribe to `displayOptimisation` in home (prefer **local to Home** for obvious scope).
- Derive `showLandscapeHint` with a **pure** expression: portrait **and** (`deviceClass` is mobile or tablet) **and** (when wired) slack ≥ threshold if the diagram stage exposes or allows measurement of that slack.
- Typography and tone: **subtle**, calm, aligned with the elevator pitch (instrument reads clearer in a wider view)—not apologetic about letterboxing, not lecturing about “wrong” orientation.
- Accessibility: informational text; **no required interaction**; avoid stealing focus; keep decorative punctuation out of assistive labels if copy includes informal glyphs.
- DOM detail: reuse the same **stage** hierarchy and backgrounds as the diagram so the hint does not read as foreign chrome; exact parent/child wiring is an implementation follow-up.

## Related documents and code

- Product framing: `docs/specs/elevator-pitch.md`
- PWA / appliance context (broader orientation goals): `docs/planning/pwa-rationale.md`
- Header chrome vs diagram height (separate concern): `docs/planning/home-landscape-header-space.md`
- Viewport policy: `src/ui/displayOptimisation.ts` and `src/ui/displayOptimisation.test.ts`
- Home shell: `src/ui/App.svelte`, `src/ui/routes/Home.svelte`, `src/app.css` (`.content--home`, safe-area)
