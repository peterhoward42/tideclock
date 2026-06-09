# Town corpus dedupe — duplicate `place` + `county` rows

Remove three erroneous duplicate geocoded rows so `Town.name` + `Town.county` is unique in the shipped corpus.

**Status:** planned — not started  
**Last updated:** 2026-06-09  
**Related:** [location-from-url.md](./location-from-url.md) (URL deep links assume unique `place`+`county`; dedupe is **out of scope** for that work until done separately)

---

## Goal

Collapse six shipped towns (three duplicate pairs) to three, by deleting extra rows in coastal-geocoded TSVs. After rebuild, exact `place`+`county` lookup is unambiguous for the full corpus.

---

## Root cause

The coastal **source lists** (`tools/towns2/coastal/*.txt`) have **one line per place**. The duplicates are **extra geocoded TSV rows**, not duplicate txt lines.

| Issue | Where |
| --- | --- |
| Id assignment | `t2:{county-stem}:{line_index}` — `line_index` = 1-based line in `coastal/{county}.txt` |
| Build | `node tools/towns2/buildCompact.mjs` → `src/data/towns2.compact.json` |
| Shipped lookup | `towns2ByTownId` in `src/data/bakedTowns2.ts` |

---

## The three pairs

### 1. Llansanffraid Glan Conwy, Conwy

| Action | id | coords | notes |
| --- | --- | --- | --- |
| **Keep** | `t2:conwy:30` | 53.2682, -3.7962 | OS Open Names-style centroid |
| **Delete** | `t2:conwy:31` | 53.268, -3.796 | Erroneous second row; txt line 31 is **Glan Conwy** (already `t2:conwy:32`) |

Source: `tools/towns2/coastal/conwy.txt` line 30 only lists “Llansanffraid Glan Conwy”.

### 2. Noses Point, Durham

| Action | id | coords | notes |
| --- | --- | --- | --- |
| **Keep** | `t2:durham:60` | 54.82403, -1.318719 | Wikimedia / Geograph |
| **Delete** | `t2:durham:61` | 54.8237073, -1.3206983 | Second geocode for same headland (OSM “Nose’s Point”) |

Source: `tools/towns2/coastal/durham.txt` line 61 only lists “Noses Point”. Choice of which row to keep is arbitrary for tide purposes.

### 3. Polmaise lagoons, Stirling

| Action | id | coords | notes |
| --- | --- | --- | --- |
| **Keep** | `t2:stirling:150` | 56.1088, -3.8725 | |
| **Delete** | `t2:stirling:151` | 56.1088, -3.8725 | Identical coords and notes — literal duplicate row |

Source: `tools/towns2/coastal/stirling.txt` line 151 only lists “Polmaise lagoons”.

---

## ID gaps — do they matter?

**No.** Do not renumber `coastal/*.txt` or shift `line_index` to close gaps.

| Concern | Verdict |
| --- | --- |
| App / `towns2ByTownId` | Ids are opaque map keys; no sequential assumption |
| Build pipeline | Emits only resolved TSV rows; absent index = no id |
| txt ↔ `line_index` | txt line can exist while `t2:…:{n}` is absent from JSON |
| **Renumbering** | **Avoid** — changes ids for all later lines in that county; breaks persisted `current-location` |
| Deleted id in storage | `loadTownPick` → `undefined` → Looe default / re-pick; negligible for these ids |

After dedupe, `t2:conwy:31`, `t2:durham:61`, and `t2:stirling:151` simply cease to exist in the shipped corpus.

---

## Phases

### 1. Delete duplicate TSV rows

Remove one row from each file (keep/delete as table above):

- `tools/towns2/coastal-geocoded/conwy.tsv` — delete `line_index` 31
- `tools/towns2/coastal-geocoded/durham.tsv` — delete `line_index` 61
- `tools/towns2/coastal-geocoded/stirling.tsv` — delete `line_index` 151

Do **not** edit `tools/towns2/coastal/*.txt`.

### 2. Rebuild and verify

```bash
node tools/towns2/buildCompact.mjs
npm test
```

Confirm shipped count drops by 3 (15,274 → 15,271). Optional: script or test asserting no two towns share normalized `name|county`.

### 3. Update planning cross-references

Note completion in [location-from-url.md](./location-from-url.md) conversation log; `ambiguous` URL error path becomes unreachable for real places (keep handling as defensive).

---

## Out of scope

- Fixing other txt↔TSV `place_name` mismatches beyond these three duplicates
- `localType` tie-breakers or slug URLs
- Migrating users who persisted a deleted id (accept fallback behaviour)

---

## Conversation log

| Date | Notes |
| --- | --- |
| 2026-06-09 | Identified 3 duplicate pairs (6 rows); TSV-only fix; gaps in id suffix are fine; split from URL-location work. |
