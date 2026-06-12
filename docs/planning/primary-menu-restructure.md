# Primary menu restructure — discovery and intent layering

Working notes from product discussion (June 2026). Captures analytics interpretation, a rejected three-bucket sketch, and a preferred direction for radical menu simplification. Not an implementation spec.

**Status:** discussion captured — next step is location on instrument chrome (see [Next step](#next-step))  
**Last updated:** 2026-06-12  
**Related:** [elevator-pitch.md](../specs/elevator-pitch.md), [story-discovery-lifecycle.md](./story-discovery-lifecycle.md), [pen-response.md](./pen-response.md)

---

## Evidence

Diagnostics show traffic to Story, Tide Nerd, and Software Nerd is **effectively nil** for typical organic visitors — with one exception.

A Cornwall Facebook post and a LinkedIn post asked who was interested in how tides work, with a **direct link to `#/tidenerd`**. After that, the proportion of visitors who had opened Tide Nerd jumped sharply — in fact **higher than home-route visits** in that cohort.

| Signal | Reading |
| --- | --- |
| Nil nerd/story traffic by default | In-app menu is not converting instrument users to curiosity mode |
| Spike after curiosity-framed outbound link | **Curiosity hooks have legs** when the link promise matches the destination |
| Tide Nerd > home in that cohort | Those visitors came for the article, not the dial — success for outbound penetration, not evidence that everyone should discover nerd content via the flyout |

Roughly a third of visitors still open the menu and change location. The menu **works as instrument chrome** for that task. It does **not** work as a discovery channel for narrative or nerd routes.

Current flyout (`PrimaryMenuContent.svelte`) mixes intents in one flat list: Home, location, install, on-wall, keep-awake, fullscreen, Story, for-nerds (expandable), About, contact (expandable).

---

## Two funnels (do not conflate)

**Outbound curiosity** — post or message offers a dedicated route (`#/tidenerd`, `#/story`, activity-framed utility). The link is the gift; the dial is a quiet second act. Validated by the Cornwall/LinkedIn experiment. Aligns with [pen-response.md](./pen-response.md).

**In-app discovery** — visitor arrived for the instrument, may later be receptive to Story or nerd content. Currently failing because curiosity links sit in a task-oriented panel as bare site-map entries. Aligns with the psychological model in [story-discovery-lifecycle.md](./story-discovery-lifecycle.md).

Menu reform serves the **second** funnel. It does not replace outbound hooks or the planned time-since-custom-location tease — it complements them.

---

## Problem framing (refined)

The issue is not simply “the menu is too long.” It is **unlayered mixing of intents**:

| Intent | Items today | User mode |
| --- | --- | --- |
| **Instrument** | Location, keep-awake, fullscreen | Using the dial now |
| **Deployment** | Install, stick it on the wall | Making the app part of daily / ambient life |
| **Curiosity** | Story, for nerds | Time and interest for narrative or explanation |
| **Administrative** | About, contact | Compliance, version, email |

Story between keep-awake and About reads as **site navigation**, not intrigue — even though the label says *here is a story*. About is intentionally dull (compliance); it must not be treated as a discovery path to Story.

Low Story/nerd numbers from instrument-first visitors may still be **appropriate filtering** until a deliberate invitation fires (timed prompt → Entertainment hub, or outbound link). That lifecycle view still holds; the new data adds that **outbound** curiosity is a separate, working lane.

---

## Explored idea: Home · Settings · Entertainment

Sketch: shorten the menu to three top-level entries, each a **hub route** with space to explain and pitch child pages. **Entertainment** would grant psychological permission to leave utility mode.

### What survived

- **Radical menu change is likely beneficial** — flat twelve-purpose list is the wrong shape.
- **Entertainment as a hub** — one named mode switch plus **pitch space** (Tide Nerd works when the Facebook post is the pitch; Story needs tone and timing a one-line menu item cannot provide).
- **Location stays mission-critical** — immediately below Home in the menu, **or** moved into instrument chrome (see [Next step](#next-step)); not demoted as a “setting.”

### What fell apart

- **Settings as a catch-all hub** — Install, on-wall, keep-awake, fullscreen, About, and contact are not one family. Labeling them “settings” undersells install and on-wall and mislabels instrument ops.
- **Demoting install and on-wall** — These are **deployment** paths aligned with the product vision (launcher, wall appliance, guest house, pub, hire desk). They deserve visible prominence, not a preferences drawer.

---

## Preferred direction (conclusion)

**Layer by intent**, not by three opaque buckets.

### Principles

1. **Location** — sacred; header centre and/or dial chrome; only remove from the flyout if another affordance is clearly sufficient (validate header vs menu location clicks first).
2. **Install + on-wall** — stay prominent as **deployment**, not settings. May remain two lines or group under one labeled section (e.g. “Make it yours”) without burying them.
3. **Entertainment** — single flyout entry → hub route pitching Story, Tide Nerd, Software Nerd. Destination for a future timed curiosity prompt as well as manual exploration.
4. **Instrument-only actions** (keep-awake, fullscreen) — contextual on home / referenced from `#/onwall`; avoid pretending they are global “settings.”
5. **About + contact** — administrative tail; contact can stay expandable or live on About.

### Illustrative target shape (not final copy)

```
Home
Set your location          ← until / unless dial-only

— Make it yours —
Install
Stick it on the wall

— More —
Entertainment              → hub route
About
Contact
```

Radical variants still on the table: **sectioned flyout only** (no new routes except Entertainment), or **route-specific menus** (home flyout vs header on secondary routes). Any of these is a meaningful break from the current list.

### Entertainment hub — open choice

Cold curiosity traffic (outbound) may favour leading with **Tide Nerd**; warm instrument users may favour **Story** as the affinity bridge. The hub can pitch each differently — copy room is the point.

### Complements (unchanged from lifecycle doc)

- **Timed tease** after first custom location → point at Entertainment (or a specific child), once, dismissible, never blocking the dial.
- **Outbound episodes** with source-aware dedicated routes — primary path for cold nerd traffic.
- Funnel telemetry before further home UX churn: menu opens, location clicks (header vs menu), Entertainment entry, child route visits, prompt shown/dismissed.

---

## Rejected for this workstream

- Collapsing install, on-wall, and compliance into a **Settings** hub.
- Expecting menu shortening alone to lift nerd/story traffic without Entertainment pitch space, timed prompts, or outbound links.
- Fragile lifecycle signal stacks (PWA install detection, wall heuristics, etc.) — see [story-discovery-lifecycle.md](./story-discovery-lifecycle.md).

---

## Next step

**Move location changing onto the instrument display** (dial chrome), in line with existing SVG affordances (`HomeMenuTrigger`, share trigger; header centre already links to `#/location`).

Rationale:

- Universally useful if it goes well — location is the menu’s proven task.
- Shortens the flyout and reduces duplicate affordances (header label, menu line, dial).
- Simplifies the wider menu-restructure topic before committing to Entertainment hub shape or section labels.

Defer final decisions on Entertainment hub copy, section headings, and timed prompt until location-on-dial is tried.

---

## Conversation log

| Date | Notes |
| --- | --- |
| 2026-06-12 | Diagnostics: nil story/nerd traffic except curiosity-framed `#/tidenerd` posts (Cornwall FB, LinkedIn). Discussed Home/Settings/Entertainment buckets; Settings rejected; Entertainment hub + intent layering retained. Install/on-wall stay deployment-prominent. Next: location on instrument chrome. |
