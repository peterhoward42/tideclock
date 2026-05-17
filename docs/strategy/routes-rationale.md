# Routes rationale

This document records **why the main routes exist** and what I hope each one achieves. It is written for future me, collaborators, and anyone trying to understand product intent without reverse‑engineering the menu. It complements [elevator-pitch](../specs/elevator-pitch.md) (what the app is) and the planning notes under `docs/planning/` (how individual features were specified).

Routing is hash-based: `#/home`, `#/location`, and so on. Unknown hashes fall back to home. Legacy placeholders (`#/settings`, `#/acknowledgements`, etc.) normalize to home.

---

## North star (shared context)

The Tide Dial is for people in UK coastal places — residents and visitors — who care about **today’s tide rhythm**, especially **how long until the next high or low**, not just a table of numbers. It is deliberately **visual and instrument-like**: a website that should feel closer to an appliance on a kitchen shelf or a wall screen than to a conventional tide app.

It does not try to beat tide tables on raw data. Its identity is **presentation and emphasis**. Most of the product’s value lives on **one screen**; everything else exists to support setup, trust, ambient display, curiosity, or a human connection with me as the maker.

---

## Route map

| Hash | Route id | Menu label (typical) | Role |
|------|----------|----------------------|------|
| `#/` / `#/home` | `home` | *(diagram; nav on the dial)* | The instrument |
| `#/location` | `location` | Set **your** location | Personalise the dial |
| `#/onwall` | `onwall` | Stick it on the wall | Ambient / wall-mounted use |
| `#/story` | `story` | Story | Why it exists; meet the author |
| `#/about` | `about` | About | Trust, safety, legal, version |
| `#/tidenerd` | `tidenerd` | Tide Nerd *(under For nerds)* | Playful tide science |
| `#/softwarenerd` | `softwarenerd` | Software Nerd *(under For nerds)* | How it is built |

---

## Home (`#/home`)

**What it is.** The tide dial itself: the smile-shaped day curve, tide markers, the green “now” hand, and the emphasis on the **next** tidal event. This is the only route without a top title bar; the diagram *is* the chrome.

**Why it exists.** This is the product. Every other route is in service of getting people here, keeping them oriented, or supporting a secondary goal without polluting the main view.

**What I hope to gain.**

- A calm, scannable answer to “what’s happening with the tide **now** and **next**?” without mental arithmetic.
- An experience that rewards **looking** more than reading — closer to a museum instrument than a settings app.
- Enough onboarding (rotation hint on phone portrait; minimal conceptual key in landscape; seeded-location framing) to prevent wild misreadings, **without** turning the first visit into a tutorial. See `docs/planning/onboarding.md`: the goal is gradual interpretation, not exhaustive explanation.
- For installed / standalone use: wake lock and PWA affordances tied to this route so a wall or kitchen tablet can stay alive and fullscreen. See `docs/planning/pwa-rationale.md`.

**What deliberately stays off this route.** Legal copy, long author narrative, install how-tos, and nerd deep-dives — so the dial keeps its atmosphere.

---

## Location (`#/location`)

**What it is.** Search and pick the place whose tides drive the diagram. Same header pattern as other secondary routes; on phones, landscape is encouraged when the layout needs room.

**Why it exists.** The dial is meaningless without a place. First-time visitors see a **seeded default** (Looe) so something alive appears immediately; this route is where they make it **theirs**.

**What I hope to gain.**

- Low friction from “interesting demo” to “my harbour / my bridge / my beach.”
- A clear separation between **where the data comes from** (location messaging on home) and **how the diagram works** (conceptual key on home) — they should not be merged.
- Rich, searchable place names in data, with display rules that keep labels honest on the dial (`docs/planning/dial-location-name-policy.md`).

---

## Stick it on the wall (`#/onwall`)

**What it is.** A dedicated page for the **ambient display** use case: tablet on a shelf, screen in a guest house, pub, or hire desk — with photography and platform-specific install steps (reusing install-flow logic from the home menu).

**Why it exists.** PWA features (install, standalone chrome, wake lock, landscape bias) are not a generic “add to home screen” checkbox; they support a specific fantasy from the elevator pitch: **left running on a wall**. I was unhappy with cramming both the **value proposition** and the **how-to** into an expanding menu row (`docs/planning/framing-for-pwa.md`, `docs/planning/stick-it-on-the-wall.md`). A route gives room to sell the idea and walk through installation without cluttering the instrument or the menu.

**What I hope to gain.**

- Visitors who might never think “PWA” still understand: *this is meant to stay on a screen*.
- Better conversion to installed, always-on mode — which unlocks wake lock and the “appliance” feel described in `docs/planning/pwa-rationale.md`.
- Explicit non-goals remain non-goals: not offline-first, not push notifications, not kiosk lockdown.

The menu still exposes **Keep screen awake** for people already on home; this route is the story and the install path.

---

## Story (`#/story`)

**What it is.** Personal narrative: the flooded road and kayak, delight in tidal places, a career of making information visible, and why I still build software for pleasure in semi-retirement. It replaced a thinner “Meet the author” entry (`docs/planning/story.md`).

**Why it exists.** Publicly it is background for the app’s creation. Privately it is how I introduce **myself** and invite engagement — especially from people whose world overlaps (visual systems, diagrams, coastal life). About stays factual and short; Story carries warmth and motive.

**What I hope to gain.**

- Trust and humanity without putting a memoir on the dial.
- A natural path to **Contact** (the menu panel, or `#/home?contact=1` from a link on this page).
- Optional **virtual coffee** support in a short inset after the Ramsgate photo (appreciation before conversation; see `docs/planning/fundme.md`) — not in the main menu.
- Optional mention of other work (e.g. DrawExact) for the right reader, without making the app a portfolio site.

Software Nerd explicitly points readers here for author intent rather than architecture.

---

## About (`#/about`)

**What it is.** Version (build commit), safety disclaimer, pointer to Story, World Tides copyright/API acknowledgement, and cookie/storage policy (`docs/planning/about-route.md`).

**Why it exists.** Legal and operational honesty: leisure-only, not for navigation or safety-critical use; attribute data; be clear that location is stored **locally** and identity is not collected.

**What I hope to gain.**

- A single trustworthy place for “is this official / safe / current?” questions.
- Separation of **compliance** (About) from **connection** (Story) so neither tone infects the other.
- A stable URL if I ever need to link terms or safety text from elsewhere.

---

## Tide Nerd (`#/tidenerd`)

**What it is.** Entertaining, riddle-led explanations of why the sea rises and falls — bath analogies first, a short “what pedants would say” nod after (`docs/planning/tide-nerds.md`). It will grow topic by topic.

**Why it exists.** After someone has **used** the dial, curiosity is a gift. I want to reward it without weighing down the main UI or pretending to be a textbook. It also shapes how the product feels in the round: **playful and warm**, not merely competent — and by extension, how people might picture **me** behind it.

**What I hope to gain.**

- Delight and “oh, that’s why” moments for visitors and locals who enjoy coastal places intellectually.
- A place to sequence ideas (moon lump, earth spin, sun and springs/neaps, …) that have natural cognitive dependencies.
- Clear positioning: **entertainment and fun**, not navigation-grade education.
- A tone that makes reaching out feel natural — alongside Story, another path toward **Contact** for people who liked the voice and want to say hello, report something, or suggest an idea.

---

## Software Nerd (`#/softwarenerd`)

**What it is.** A tour of how the app is structured: client layers, PWA, responsive layout, shipping, tide data path, diagram pipeline, timekeeping, tests, and how much was pair-programmed with AI.

**Why it exists.** A parallel audience — engineers and the technically curious — who may care how the instrument is built. It lives under **For nerds** beside Tide Nerd so the main menu does not sprawl.

**What I hope to gain.**

- Credible transparency for developers evaluating or contributing to the repo.
- A home for detail that would bore most tide users but helps **me** document decisions in prose.
- Cross-links to On Wall and Story where product intent matters more than stack traces.

---

## Not routes (but part of the navigation model)

These are intentional **menu** behaviours on home (and sometimes the header), not separate hashes:

| Entry | Mechanism | Rationale |
|-------|-----------|-----------|
| **Keep screen awake** | Expands in menu; wake lock on home | Operational control for wall mode without leaving the dial |
| **Contact** | Expands in menu; `#/home?contact=1` deep-link | Lightweight channel; solo maintenance — set expectations (`docs/planning/contact-menu-item.md`) |
| **For nerds** | Submenu to Tide Nerd / Software Nerd | Keeps nerd routes discoverable without seven top-level links |
| **Fullscreen** | Browser fullscreen when available | Extra chrome removal for display setups |
| **First-run overlays** | On home only | Museum-caption onboarding; see `docs/planning/onboarding.md` |

---

## How routes relate to “surface mode”

Secondary routes share a lighter header and document title (`Location — The Tide Dial`, etc.). Home uses a dark, immersive surface so the dial reads as the primary object. That split is product, not accident: **routes are for tasks and reading; home is for watching the tide.**

---

## Principles when adding or changing routes

1. **Protect the instrument.** If copy is more than a few lines and not needed while watching the tide, it probably belongs on its own route or in the menu — not on the diagram.
2. **One job per route.** About = trust; Story = human; On Wall = ambient install; Nerds = optional depth.
3. **Prefer discovery on home, explanation elsewhere.** The dial should teach itself once minimally anchored.
4. **Hash routes are enough.** No server router required; shareable URLs and simple static hosting matter for a personal project.

---

## Document history

First draft synthesised from `docs/specs/elevator-pitch.md` and planning notes (May 2026). Update this file when route intent changes, not only when filenames or menu labels change.
