# Tide Clock – Initial Repository Skeleton

## Goals
Establish clear architectural boundaries early to guide all future development and AI-assisted code generation.

---

## Directory Structure

```
src/
  domain/
    tideModel.ts
    tideExtremes.ts
    tideSampling.ts
    timeMath.ts

  application/
    tideService.ts
    tideCache.ts
    refreshPolicy.ts
    appClock.ts
    settingsStore.ts
    consentStore.ts

  geometry/
    dialGeometry.ts
    tideProfileGeometry.ts
    markerGeometry.ts
    labelGeometry.ts

  ui/
    components/
      TideClock.svelte
      StaticFrame.svelte
      TideLayer.svelte
      LiveOverlay.svelte

    routes/
      Home.svelte
      Settings.svelte
      About.svelte
      Acknowledgements.svelte
      Support.svelte
      Cookies.svelte

  infrastructure/
    apiClient.ts
    storage.ts
    router.ts

  test/
    domain/
    geometry/
    application/
```

---

## Layer Responsibilities

### domain/
Pure logic only.
No side effects, no DOM, no HTTP.

### application/
Coordinates domain + infrastructure.
Handles lifecycle and policies.

### geometry/
Transforms domain outputs into renderable geometry.

### ui/
Rendering and interaction only.

### infrastructure/
External concerns (API, storage, routing).

---

## Coding Conventions

- Prefer pure functions
- Avoid hidden state
- Keep modules small and focused
- Use explicit types/interfaces
- No UI logic in domain or geometry

---

## Testing Strategy

- Unit tests for domain and geometry first
- Application layer tested with mocks
- Minimal UI testing

---

## First Tasks

1. Create empty modules for each file
2. Add type definitions in domain layer
3. Implement basic sine interpolation
4. Write unit tests for interpolation
5. Build simple SVG prototype

---

## Notes for AI Code Generation

- Respect folder boundaries strictly
- Do not introduce cross-layer coupling
- Prefer composition over inheritance
- Add tests alongside new logic

---

## Summary
This skeleton is intentionally minimal but strongly structured. It is designed to act as a stable foundation for iterative, AI-assisted development.
