# Tide Diagram Spec: Phase 2 Heading Skeleton

## Purpose

Create the reader-first heading skeleton for `docs/specs/tide-diagram.md` before any prose migration or semantic tightening.

This phase is structure-only: no normative meaning changes, no rule deletions, and no wording compression yet.

## Guardrails

- Keep all retained Phase 1 statement IDs (`S001`-`S123`) mappable.
- Do not edit normative text in this phase; only establish destination sections.
- Keep section names aligned with the target outline keys (`TB-1`..`TB-7`).

## New heading skeleton (draft)

### 1. Role and boundaries (`TB-1`)

- Scope of this specification.
- Host responsibilities and boundaries.
- Paint-order override seam constraints.

### 2. Core conventions (`TB-2`)

- `§Origin` (diagram model space)
- `§Axes`
- `§Sizing`
- `§Polar` (RefArc geometry and derived angles)
- `§Time and theta(t)` (canonical time and mapping)
- Radial lines and radial segments

### 3. Global contract (`TB-3`)

- Strict diagram input overview.
- Required global input shape by top-level key.
- Global validation and throw behavior.
- Global `timeNow` contract.
- Shared error conditions (time sentinel policy, duplicate marker times, invalid overrides).

### 4. Scene model contracts (`TB-4`)

- Scene primitive families and current scope.
- Named top-level element contract.
- Element leaf/subgroup naming contracts.
- Style-binding exact-match contract.
- Paint-order override seam references.

### 5. Element specs (`TB-5`)

Apply the fixed element template per section:

- Inputs (element-specific)
- Geometry / placement
- Scene emission (names)
- Validation failures
- Notes (non-normative; optional)

Planned element order:

1. RefArc
2. InsideTrack
3. MainLabel
4. TickMarks
5. TickLabels
6. TideMarks
7. Hand
8. TimeNow readout (`TimeNowLocation`, `TimeNowDate`, `TimeNowClock`)
9. CentreFrame
10. AnnularBand
11. HomeMenuTrigger

### 6. Behavioral branches (`TB-6`)

- `timeNow`-driven branch behavior.
- `TimeDelta` countdown path.
- `TimeDelta` no-next-marker path (`NoMoreTidesToday`).
- Atypical summary behavior (`atypicalTideSummary`).
- Host derivation policy hooks referenced by behavior.

### 7. Interpretation and deferred topics (`TB-7`)

- Interpretation defaults for undefined details.
- Explicitly deferred concerns and non-normative notes.

## Move-map stub (old -> new)

This map is intentionally coarse in Phase 2 and will be expanded during Phase 3/5 reconciliation.

- `Role`, `Host responsibilities` -> `TB-1`
- `Conventions` (`§Origin`, `§Axes`, `§Sizing`, `§Polar`, `§Time and theta(t)`) -> `TB-2`
- `Strict diagram input` + global validation rules -> `TB-3`
- `Diagram elements` naming and `Style binding names` -> `TB-4`
- Element-specific geometry/layout sections -> `TB-5`
- `TimeDelta` branch-specific behavior -> `TB-6`
- Interpretation notes and deferred topics -> `TB-7`

## Exit criteria for Phase 2

- Heading skeleton agreed and stable.
- Every retained Phase 1 statement has a clear destination section key.
- Ready for Phase 3 content move and dedup pass.
