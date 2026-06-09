# Sharing a tide dial location

**Status:** UX settled — ready for implementation planning  
**Last updated:** 2026-06-09

---

## Context

- Product framing: [docs/specs/elevator-pitch.md](../specs/elevator-pitch.md) — instrument-like tide dial for UK coastal places; share links support “send someone the same view”.
- **Receiver path (done):** [location-from-url.md](./location-from-url.md) — `?place=…&county=…` on boot, URL always wins, params kept in the address bar, user-facing errors when lookup fails. Documented on About.
- **Sender path (this plan):** one-tap copy of the share link for the place currently on the diagram.

---

## Objective

Make it easy for someone viewing The Tide Dial to copy a link that opens the same coastal place for the recipient.

Example target URL (canonical form):

```
https://thetidedial.page/?place=Looe&county=Cornwall
```

Both `place` and `county` are required and must match corpus spelling (same normalization as the Location picker — `normalizeTownSearchText` in `bakedTowns2.ts`).

---

## What already exists

| Piece | Where |
| --- | --- |
| Parse `place` + `county` from URL | `src/ui/homeUrlQuery.ts` — `placeAndCountyFromSearch` |
| Resolve pair → `Town` | `src/data/resolveTownFromPlaceAndCounty.ts` |
| Boot precedence (URL over storage) | `src/ui/resolveBootLocation.ts`, `App.svelte` |
| Error copy for bad links | `src/ui/urlLocationErrorCopy.ts` |
| About-page contract | `src/ui/routes/AboutRoute.svelte` — “Share a place” |
| Clipboard helper | `src/ui/copyEmail.ts` — `copyTextToClipboard` |

**Not built yet:** `buildShareUrlForTown`, in-diagram CTA, copy confirmation UI, address-bar sync on menu location change.

---

## Decided UX

### D1 — Action: clipboard only

Tap share → build URL from `currentTown` → `copyTextToClipboard`. **No** `navigator.share` / native mobile share sheet.

Rationale: one predictable behaviour everywhere; most users know how to paste from the clipboard.

On clipboard failure (`copyTextToClipboard` returns `false`): **swallow silently** — no dialog, no error copy (same as `CopyableEmail`). Failure is uncommon in prod (see §Clipboard failure); address-bar sync (D4) is an incidental fallback for users who copy from the browser chrome.

### D2 — CTA: in-diagram, SVG-native, icon + short label

- **Placement:** bottom-right, **right-justified to `B_right`**. Vertical position from **`homeShareTrigger.aboveBottom`** (k·`RefRadius`, distance above `B_bottom`) — tuned in `homeLayout.preset.ts`, **not** computed relative to **BRHCLocation** (place name length varies).
- **Appearance:** single SVG **`text()`** node — short label plus **Unicode glyph** (e.g. `Share ↗`), same typographic family as the BRHC stack (muted role, brightens on hover). Not a circle control; not a separate line-built icon primitive.
- **Wiring:** top-level scene group `HomeShareTrigger` (sibling of `HomeMenuTrigger`, excluded from `B_*` expansion). Pointer wire like `menuSvgTriggerWire.ts`.
- **Visibility:** when tides are `ready` and there is no URL-location error; hide during loading/error panels and while the first-visit explainer is open (optional refinement).

### D3 — Feedback: centred, dismissable conventional UI

After a successful copy, show a **centred overlay card** (HTML/Svelte, not in the SVG) so the user can read and absorb what happened.

- Precedent styling: menu-flyout card treatment (`HomeFullscreenBrowserAdviceOverlay`, `HomeDefaultLocationExplainerOverlay`).
- `role="dialog"` with explicit dismiss (e.g. **OK** or **Done**).
- Suggested copy:
  - **Lead:** “Link copied”
  - **Body:** one line that the link opens tides for `{place}, {county}`; optional monospace echo of the URL (truncated on narrow viewports) so power users can verify.
- The diagram CTA label does **not** change state (no inline “Copied”).
- Show the dialog **only** when copy succeeds (`if (!ok) return` before opening overlay).

### D4 — Address bar sync — **DECIDED: yes**

When `setCurrentLocation` runs with `source: "menu"`, `history.replaceState` adds or updates `?place=…&county=…` (strip dev-only query flags). Pairs with receiver D5 (params kept on share links). Makes browser address-bar copy and in-diagram Share produce the same URL.

---

## Clipboard failure (accepted, not surfaced)

`copyTextToClipboard` returns `false` when `navigator.clipboard.writeText` throws. On HTTPS at `thetidedial.page` after a direct Share tap, this should be **rare** (insecure context, missing API, lost user gesture if `writeText` is deferred, etc.). **No dedicated failure UI** — `if (!ok) return` and do not open the success dialog. Call `writeText` promptly in the click handler to minimise avoidable failures.

---

## CTA constraint (product)

The share control lives **on the diagram**, not in the header or hamburger flyout. Precedent for SVG placement and pointer wiring: **HomeMenuTrigger** (`docs/specs/tide-diagram.md` §HomeMenuTrigger; `menuSvgTriggerWire.ts`, `HomeRouteTidePanels.svelte`).

---

## Likely touch points (implementation sketch)

| Area | Notes |
| --- | --- |
| `buildShareUrlForTown(town)` (new, pure) | `origin` + `?place=` + encoded name/county; tests for encoding edge cases |
| `homeLayout.preset.ts` + types | `homeShareTrigger: { aboveBottom, fontHeight?, … }` |
| `buildDiagram.mjs` + `toScene.mjs` | `HomeShareTrigger` text group at `B_right` |
| `homeStyleModel.preset.ts` | Style role for share label |
| `shareSvgTriggerWire.ts` (new) | Click → handler in `HomeRoute.svelte` |
| `HomeShareLinkCopiedOverlay.svelte` (new) | Centred dismissable dialog; mounted from `HomeRouteTidePanels` |
| `HomeRoute.svelte` | Build URL → clipboard; on success open overlay + analytics (`copied_location_link`) |
| `setCurrentLocation` + `history.replaceState` | Sync `?place&county` when `source === "menu"` |
| `syncShareParamsInLocationBar(town)` (new, pure) | Build query string; used by share URL builder and address-bar sync |

---

## Out of scope (for now)

- `navigator.share` / native share sheet
- Short slugs (`/looe`) or opaque `loc=<townId>` links
- Share from non-home routes
- Social preview cards / Open Graph per place
- QR encoding of place-specific URLs (brand QR remains site root)
- Line-built icon primitive for share

---

## Conversation log

| Date | Notes |
| --- | --- |
| 2026-06-09 | Starter doc; receiver path references concrete modules. UX discussion started. |
| 2026-06-09 | **Placement:** bottom-right, `aboveBottom·R` from `B_bottom`, right-aligned to `B_right`. **CTA:** SVG text with Unicode glyph + “Share”. **Action:** clipboard only. **Feedback:** centred dismissable HTML overlay, not inline CTA state. |
| 2026-06-09 | **D4:** address-bar sync on menu location change. Clipboard failure: swallow silently (no error dialog). |
