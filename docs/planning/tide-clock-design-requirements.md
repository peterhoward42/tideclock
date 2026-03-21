# Tide Clock Design Requirements

## Core Principle
Preserve the conventional analogue clock mapping (12-hour dial = real clock time). Do not reinterpret the dial as relative time.

## Key Design Decisions

### 1. Use Real Clock Time
- Hour markers retain their normal meaning.
- Users instantly understand timing without cognitive effort.

### 2. Show Future Events Only
- Mark **next high tide** (solid marker).
- Mark **next low tide** (hollow marker).
- Place markers at their actual clock times.

### 3. Represent Current Tide State Centrally
- Use a smooth sine-based model for tidal height.
- Map height → radius of an organic central shape.
- Shape “breathes” over time.

### 4. Imply Motion Instead of Showing History
- Expanding shape → rising tide.
- Contracting shape → falling tide.
- Large radius → near or just after high tide.
- Small radius → near or just after low tide.

No explicit past events required.

### 5. Avoid Mode Switching
- Single, always-readable display.
- No toggles, pages, or alternate interpretations.

## Design Philosophy

> Do not show everything that is true.  
> Show what makes the correct inference inevitable.

## Outcome

A glanceable, intuitive display that answers:
- How high is the tide now?
- Is it rising or falling?
- When is the next high or low tide?
- How urgent is action (e.g. leaving before high tide)?

While remaining:
- cognitively effortless
- visually elegant
- culturally familiar
