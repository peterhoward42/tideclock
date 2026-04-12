# Designing a process to fetch latitude and longitude for towns

This task is to design a process to be performed by AI to lookup the latitude and
longitude of a list of UK places.

Do not run this process yet. The scope of this task is limited to planning, design and collaboration with me the human on the design.

When you are ready to **try a controlled slice** (not the full corpus), use the copy-paste agent instructions in **[`get-lat-lon-agent-prompt.md`](./get-lat-lon-agent-prompt.md)**, which point back here for requirements and conclusions.

## The nature of the input list

- Coastal place lists live under **`tools/towns2/coastal/`** — text files named by county or region, e.g. **`cornwall.txt`**
- Each text file contains place names - one on each line
- When geocoding is run, results are written under **`tools/towns2/coastal-geocoded/`** — one **`.tsv`** per input file with the **same stem** (e.g. `cornwall.tsv` alongside the logical pairing to `cornwall.txt`). See **`get-lat-lon-agent-prompt.md`** for merge rules when processing a line range in multiple runs.

## The nature of the places to deal with
- The place names are of diverse types
- For example they can be:
    -  town, village or hamlet names
    -  a named tourist attraction
    -  a named beach
- Each place name is a name that a human would recognise as being a location on or near the coast.
- The place names may contain more than one place that a human might regards as being
  essentially the same. But they should be treated individually. Their almost-equivalence need not and should not be inferred nor used in the logic

## The problems scale

The number of input place names is greater than 10,000 and less than 50,000.

## The task

- Working out how to prompt cursor to perform this task in a way that is likely to succeed.
- It may include a preparatory step to optimise the shape of the input data
- It may need to be broken down into a smaller chunks to overcome token memory limitations of doing it all in one go. We have a precedent for tackling that kind of
divisision if it is needed in /tools/towns2/scripts - which uses cursor's scripting abilities.
- Principal conclusions from design discussion are recorded in this file (below). The **agent prompt** for Cursor lives in **[`get-lat-lon-agent-prompt.md`](./get-lat-lon-agent-prompt.md)**. Additional detailed workings may go in another markdown file sibling to this one if needed.

## Conclusions from design discussion

### Matching philosophy (human map vs formal gazetteer)

An earlier approach in this same narrow scope treated resolution as **formal, engineered referencing** (gazetteers, OS-style datasets, and similar). That fit poorly: those sources optimize for authoritative identifiers and stable names, while the coastal lists optimize for **what a human would recognize on a map** along a stretch of coast (settlements, beaches, landmarks, informal labels). The names were collected with that human-intuitive lens, so **lat/lon correlation is inherently fuzzy** and is an interpretation task more than a lookup into a shared keyspace.

**Expectation:** the process will not resolve every name; achievable coverage remains to be seen. Prefer **clear non-resolution** over a confident-looking wrong pin (for example snapping to the nearest administratively named place).

### Implications for the primary process

- Treat **county file context** as part of disambiguation (“which ambiguous coastal label we mean”), not only as a batching key.
- Prompting and judgment should favor the **feature the name evokes on that coast**; external geocoders are tools to support that reading, not automatic ground truth.
- **Mechanism is not fixed upfront:** the agent may use any tools available (search, maps, APIs) as long as results are checked against the human-map and county-coast reading. Tightening to a specific backend is a follow-up if smoke tests show systematic failure.
- Support **explicit outcomes** per line where needed (e.g. resolved vs ambiguous vs not found), not only lat/lon or silence.

The existing rule stands for the **primary** pass: **do not infer “same place” across lines** from similarity alone—each line is processed on its own merits.

### Possible later pass (gap fill)

A **separate, optional** pass may try to fill gaps: for a name that failed, consider **neighbors in source order** (the line immediately before or after) that **did** resolve. If the failed name is **sufficiently similar** to such a neighbor, it may be reasonable to **reuse that neighbor’s lat/lon** as a judged patch.

That heuristic is intentionally **not** part of the main correlation logic; it trades strict correctness for **useful tide times in an informal app**, where list adjacency often correlates with geographic proximity and a shared pin is proportionate.

### Reproducibility (to decide when implementing)

Whether reruns must yield identical coordinates for the same line, or whether small shifts between equally plausible coastal features are acceptable, can be decided when the concrete workflow is specified.
