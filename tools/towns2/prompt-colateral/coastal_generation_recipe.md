# Coastal Place Name Generation Recipe

## Purpose
Generate a human-style list of coastal place names for a given county.  
The goal is to support search-based location input, not strict geographic accuracy.

---

## Prompt Template

Generate a human-style list of coastal place names in [COUNTY].

Include:
- towns
- villages
- hamlets
- beaches
- coves
- bays
- headlands

The goal is to help users searching for locations, so include both well-known and lesser-known names.

Guidelines:
- Redundancy and overlap are fine
- Do not deduplicate
- Do not worry about strict accuracy
- Prefer names people might realistically type
- Include nearby or related places that users might try if their first search fails

Structure:
- Sweep the coastline in a loose clockwise direction OR group by sub-regions

---

## Multi-Pass Strategy

### Pass 1: Main Sweep
Generate a broad list covering the full coastline.

### Pass 2: Add Depth
Add smaller places, beaches, coves, and less prominent names not already included.

### Pass 3 (Optional): Search Expansion
Add:
- alternative names
- nearby places
- related geographic features

---

## Post-Processing

- Combine all passes into one list
- Keep duplicates

Avoid heavy filtering or strict validation.

---

## Notes

This process prioritizes:
- search usefulness over accuracy
- redundancy over completeness
- human recall over database structure

The resulting dataset should feel like a mental map, not a gazetteer.
