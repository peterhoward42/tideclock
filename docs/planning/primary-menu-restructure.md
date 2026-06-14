# Primary menu restructure — intent layering

Working notes from product discussion (June 2026). Captures analytics interpretation and a preferred direction for menu simplification. Not an implementation spec.

**Status:** location on the home diagram (done) — next step is fullscreen toggle as a dial icon (top-right)  
**Last updated:** 2026-06-14  
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

The flyout still mixes intents in one flat list. Location already lives on the home diagram (`HomeLocationPanel` — **Change** and **Share**). The remaining clutter is deployment, curiosity, and admin items sitting alongside instrument actions that belong on the dial itself.

---

## Two funnels (do not conflate)

**Outbound curiosity** — post or message offers a dedicated route (`#/tidenerd`, `#/story`, activity-framed utility). The link is the gift; the dial is a quiet second act. Validated by the Cornwall/LinkedIn experiment. Aligns with [pen-response.md](./pen-response.md).

**In-app discovery** — visitor arrived for the instrument, may later be receptive to Story or nerd content. Currently failing because curiosity links sit in a task-oriented panel as bare site-map entries. Aligns with the psychological model in [story-discovery-lifecycle.md](./story-discovery-lifecycle.md).

Menu reform serves the **second** funnel. It complements outbound hooks and the planned time-since-custom-location tease — it does not replace them.

---

## Problem

The issue is not simply “the menu is too long.” It is **unlayered mixing of intents**:

| Intent | Examples | User mode |
| --- | --- | --- |
| **Instrument** | Fullscreen (keep-awake later) | Using the dial now |
| **Deployment** | Install, stick it on the wall | Making the app part of daily / ambient life |
| **Curiosity** | Story, Tide Nerd, Software Nerd | Time and interest for narrative or explanation |
| **Administrative** | About, contact | Compliance, version, email |

Story between utility items reads as **site navigation**, not intrigue. About is intentionally dull (compliance); it must not be treated as a discovery path to Story.

Low Story/nerd numbers from instrument-first visitors may still be **appropriate filtering** until a deliberate invitation fires (timed prompt → Entertainment hub, or outbound link). Outbound curiosity is a separate, working lane.

---

## Three surfaces

Actions are split across three surfaces by intent, not one flat list.

### 1. Home diagram chrome

Instrument tasks while viewing the dial. Not flyout items.

| Affordance | Status |
| --- | --- |
| Location (**Change** / **Share**) | Done |
| Fullscreen on/off | **Next step** — icon tucked into the top-right corner of the dial |
| Menu trigger | Existing (bottom-right) |
| Keep screen awake | Deferred — revisit after fullscreen |

### 2. Home flyout (launched from the dial)

Forward actions and mode switches from the instrument. No wayfinding entries the user does not need.

```
Put it on the wall
Install / Config / Settings     → hub route
Entertainment                   → hub route
Please get in touch
```

No **Home** or **Today's Tides** line — the user is already on the dial.

### 3. Header flyout (all other routes)

Same shared menu component, with **Today's Tides** at the top for wayfinding back to the instrument. The descriptive label names the destination, not the route.

```
Today's Tides
Put it on the wall
Install / Config / Settings     → hub route
Entertainment                   → hub route
Please get in touch
```

---

## Hub routes

Bare menu links failed because curiosity content needs **pitch space**. Two hub routes carry narrative and child access.

### Install / Config / Settings

A dedicated route with narrative and links to:

- Install
- About

Keep-awake placement is open; likely here or on the dial, to be decided separately. Fullscreen does not belong in this hub — it lives on the dial.

### Entertainment

A dedicated route with narrative and links to:

- Story
- Tide Nerd
- Software Nerd

Cold curiosity traffic (outbound) may favour leading with **Tide Nerd**; warm instrument users may favour **Story** as the affinity bridge. The hub can pitch each differently — copy room is the point. Also the destination for a future timed curiosity prompt.

### Please get in touch

Warm, top-level contact entry. Separated from About so compliance stays dull and outreach stays human.

---

## Incremental delivery

Pick off isolated problems rather than landing the full restructure at once.

| Step | Scope |
| --- | --- |
| 1. Location on dial | Done (`HomeLocationPanel`) |
| 2. Fullscreen on dial | Icon, top-right corner; remove from home flyout |
| 3. Context-sensitive home link | Omit from home flyout; **Today's Tides** in header flyout only |
| 4. Flyout restructure + hub routes | Five-item shape, Install/Config/Settings and Entertainment hubs |
| 5. Keep screen awake | Placement TBD |

---

## Complements

- **Timed tease** after first custom location → point at Entertainment (or a specific child), once, dismissible, never blocking the dial.
- **Outbound episodes** with source-aware dedicated routes — primary path for cold nerd traffic.
- Funnel telemetry: menu opens, diagram chrome clicks (location, fullscreen), Entertainment entry, child route visits, prompt shown/dismissed.

---

## Out of scope

- Expecting menu shortening alone to lift nerd/story traffic without Entertainment pitch space, timed prompts, or outbound links.
- Fragile lifecycle signal stacks (PWA install detection, wall heuristics, etc.) — see [story-discovery-lifecycle.md](./story-discovery-lifecycle.md).
