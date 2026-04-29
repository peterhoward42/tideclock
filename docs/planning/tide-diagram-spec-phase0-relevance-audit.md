# Tide Diagram Spec: Phase 0 Relevance Audit

## Purpose

Pre-pass relevance audit for `docs/specs/tide-diagram.md` per `docs/planning/tide-diagram-spec-writing-improvement-plan.md` Phase 0.

Classification rule used:

- **Retain (runtime-backed):** statement has at least one implementation reference in generator/layout/scene/runtime path.
- **Candidate remove/relocate:** statement is not runtime-backed, or is test-only / planning-only.

## Statement-to-code evidence table (clustered)

| ID | Statement cluster | Runtime refs | Test refs | Classification | Decision |
| --- | --- | --- | --- | --- | --- |
| A001 | Strict input contract: required objects, finite-number checks, throw-on-invalid | `src/diagram-generation/layout/buildDiagram.mjs`, `src/diagram-generation/layout/specRequire.mjs`, `src/diagram-generation/layout/timeDeltaDiagram.mjs`, `src/diagram-generation/layout/tideMarks.mjs` | `src/application/diagramSemanticInjection.test.ts` | Runtime-backed | Retain |
| A002 | Canonical time format, `HH:MM:SS`, sentinel `24:00:00` handling | `src/diagram-generation/model/timeCanonical.mjs`, consumers in `buildDiagram.mjs`/`timeDeltaDiagram.mjs`/`tideMarks.mjs` | `src/application/buildDiagramGenerationSpec.test.ts` | Runtime-backed | Retain |
| A003 | `timeNow` must not be `24:00:00` | `src/diagram-generation/layout/buildDiagram.mjs`, `src/diagram-generation/layout/timeDeltaDiagram.mjs` | `src/application/diagramSemanticInjection.test.ts` | Runtime-backed | Retain |
| A004 | RefArc geometry, `refArcAngles`, `theta(t)` mapping | `src/diagram-generation/model/tideDiagramModel.mjs`, usage in layout modules | snapshot coverage via collaborator tests | Runtime-backed | Retain |
| A005 | Tick marks (0..24) and tick labels subset + label validation | `src/diagram-generation/layout/buildDiagram.mjs` | `src/application/diagramSemanticInjection.test.ts` | Runtime-backed | Retain |
| A006 | Tide marker row requirements, duplicate-time errors, marker-time sentinel ban | `src/diagram-generation/layout/tideMarks.mjs` | `src/application/buildDiagramGenerationSpec.test.ts` | Runtime-backed | Retain |
| A007 | TimePointer geometry and stroked scene emission | `src/diagram-generation/layout/tideMarks.mjs`, `src/diagram-generation/mapping/toScene.mjs` | collaborator snapshot tests | Runtime-backed | Retain |
| A008 | Hand geometry, pointer-pip similarity, radial-order validation | `src/diagram-generation/layout/buildDiagram.mjs`, `src/diagram-generation/mapping/toScene.mjs` | `src/application/diagramGenerationCollaborator.test.ts` | Runtime-backed | Retain |
| A009 | Time-now readout (location/date/clock), baseline and right-alignment policy | `src/diagram-generation/layout/buildDiagram.mjs`, `src/diagram-generation/model/tideDiagramModel.mjs`, `src/diagram-generation/mapping/toScene.mjs` | snapshot coverage | Runtime-backed | Retain |
| A010 | TimeDelta countdown/empty-day branching and copy rules (including atypical branch) | `src/diagram-generation/layout/timeDeltaDiagram.mjs`, `src/diagram-generation/model/tideEvents.mjs` | `src/application/buildDiagramGenerationSpec.test.ts`, dev-preview tests | Runtime-backed | Retain |
| A011 | CentreFrame geometry and independence from TimeDelta inputs | `src/diagram-generation/layout/centreFrame.mjs` | snapshot coverage | Runtime-backed | Retain |
| A012 | AnnularBand geometry and closed-sector model | `src/diagram-generation/layout/buildDiagram.mjs`, `src/diagram-generation/mapping/toScene.mjs` | snapshot coverage | Runtime-backed | Retain |
| A013 | Named element / leaf-name contracts for style binding and host hooks | `src/diagram-generation/mapping/toScene.mjs`, `src/diagram-config/homeTideStyleModel.preset.ts`, `src/ui/routes/home/homeRouteDiagramDom.ts` | `src/application/diagramGenerationCollaborator.test.ts` | Runtime-backed | Retain |
| A014 | Paint-order override seam (`before`/`after`, uniqueness, ambiguity/cycle checks) | `src/diagram-generation/mapping/toScene.mjs` | `src/application/diagramGenerationCollaborator.test.ts` | Runtime-backed | Retain |
| A015 | MainLabel behavior (radius, side selection, offset policy, dynamic content source) | `src/diagram-generation/layout/buildDiagram.mjs` | snapshot coverage | Runtime-backed | Retain |
| A016 | HomeMenuTrigger contract and derived placement from tick-label bounds | `src/diagram-generation/layout/buildDiagram.mjs`, `src/diagram-generation/mapping/toScene.mjs`, `src/ui/routes/home/homeRouteMenuSvgTriggerWire.ts` | collaborator + route tests | Runtime-backed | Retain |
| A017 | Trailing `o todo` items (`collisions`, `truncations`) | no runtime enforcement | none | Not runtime-backed | Relocate out of master spec (planning note) |

## Removals / relocations logged in Phase 0

No normative statements were removed in this pass.

One non-normative section is marked for relocation during rewrite:

- `o todo` tail list (`collisions`, `truncations`) -> move to planning/deferred concerns section outside the normative body.

## Notes from audit

- Several constraints are runtime-enforced in multiple modules; Phase 1 inventory should map each normative statement once, then point to canonical runtime evidence.
- TimeDelta and CentreFrame are generated in diagram model but intentionally hidden in scene output by a temporary renderer switch (`SHOW_TIME_DELTA_AND_CENTRE_FRAME = false` in `toScene.mjs`); this is implementation behavior, not a spec removal signal.
- Host-derivation notes (for `timeDelta.tidePhasePair`) are represented in application-layer code (`buildDiagramGenerationSpec` path), so they remain relevant as cross-layer contract text.

## Ready for next step (Phase 1)

Next action: build the semantic inventory table for retained normative statements (one row per statement, with source-section to target-section mapping).
