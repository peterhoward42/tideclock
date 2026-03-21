# Tide Clock Application – High Level Outline

## Purpose
A single-purpose, always-on “information appliance” that presents tidal state for a fixed UK location using a clock-like radial display.

The application emphasises clarity, continuity, and calm visual communication over feature richness.

---

## Core Concept
The system models the tide as a **continuous function over time**, derived from discrete high/low extremes provided by a proxy API.

The display is a **12-hour analogue dial** representing:
- current time
- current tide height
- the evolving tide profile across the visible window
- the next high and next low events

---

## Architectural Principles

### 1. Separation of Concerns
The system is divided into distinct layers:

- **Domain**: pure tide mathematics and interpolation
- **Application/Data**: fetching, caching, lifecycle
- **Time**: current time signal and scheduling
- **Geometry/View-model**: mapping domain state to dial geometry
- **UI**: rendering and interaction

---

### 2. Continuous Tide Model
- Input: discrete extreme events (high/low)
- Output: a continuous function
- Interpolation: sinusoidal segments between consecutive extrema

The model supports:
- heightAt(time)
- trendAt(time)
- nextHigh(time)
- nextLow(time)
- sampling across intervals

---

### 3. Rendering Strategy
Rendering is layered:

- Static frame (dial, ticks)
- Semi-static tide geometry (profile)
- Dynamic overlays (current time hand, live markers)

Updates:
- Tide geometry recalculated infrequently
- Time-based overlays updated frequently

---

### 4. Data Lifecycle
- Fetch 3-day tide data from proxy API
- Cache locally
- Refresh near expiry
- Gracefully degrade if offline

---

### 5. UI Philosophy
- Minimal navigation (hamburger menu)
- Configuration is secondary
- Primary screen is dominant and persistent
- Designed for fixed display environments

---

### 6. Technology
- Svelte (SPA, no SvelteKit)
- Static hosting (e.g. Vercel)
- SVG-based rendering
- Client-side routing

---

### 7. Testing Philosophy
- Domain and geometry layers are heavily unit tested
- Pure functions preferred
- UI kept thin and test-light

---

## Summary
This application is best understood as a **mathematical model rendered as a calm, legible visual instrument**, rather than a traditional app.
