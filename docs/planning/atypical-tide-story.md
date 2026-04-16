# Atypical tide-day summary mode

## Purpose

Persist the agreed baseline for days whose tide extrema do not fit the usual
simple story.

## Normal case

- Most civil days present about four tide extrema.
- They are spaced roughly six hours apart.
- They alternate clearly between **High** and **Low**.
- In those cases the app may infer a simple summary:
  - **Tide coming in** or **Tide going out**
  - **High tide in ...** or **Low tide in ...**

## Problem

Some places and dates produce atypical daily patterns. A known example is
**Bournemouth** around some **neap tides**, where a **double-dip high tide**
can yield more than four extrema and break the simplistic alternating model.

The diagram itself remains valid in those cases: it can show all extrema
faithfully. The risk is in the central wording, which may otherwise imply a
false or over-simplified interpretation.

## Decision

When today looks atypical, the app should switch to a different summary mode.

That mode should:

- recognise that today is unusual by inference from the day’s extrema pattern
- stop asserting the simple **in/out** phase story
- stop labeling the next event with overconfident derived properties that rely
  on the simple alternating model
- still allow mention of the next tide event as a concrete fact
- steer the user toward the plotted event metadata instead

## Product intent

The fallback wording should not attempt to explain the tidal mechanics. It
should simply signal that today is a more complex than usual case, and that the
viewer should read the event markers directly.

## Scope for later work

- define the inference rule for **atypical**
- decide the exact fallback copy
- decide whether the next event may still be named only by time, or also by the
  raw event label supplied by upstream data
