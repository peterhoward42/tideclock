# Diagram generation (`src/diagram-generation/`)

Pure layout, scene graph, and SVG render for the **home tide diagram**. No network, no `localStorage`, no Svelte.

## Pipeline

```
DiagramSpec (open object from application/buildDiagramSpec)
    → layout/buildDiagram.mjs     TideDiagramDocument
    → mapping/toScene.mjs         SceneDocument
    → render/renderSceneSvg.mjs   SVG string (Home route)
```

Style colours and leaf bindings are loaded at collaborator init from `diagram-config/homeStyleModel.preset.ts` (`presets/styleBindings.mjs`).

## Layout

| Area | Role |
|------|------|
| `layout/buildDiagram.mjs` | Orchestrator: spec → diagram document. |
| `layout/tideMarks.mjs` | Tide mark rows from `spec.tideMarks`. |
| `layout/specRequire.mjs` | Strict spec field guards. |
| `layout/handBossLivePulse.mjs` | Hand boss pulse radius cap (layout + scene bounds). |
| `model/` | Time canonical form, tide events, polar geometry, civil half-day branch. |
| `mapping/toScene.mjs` | Diagram → scene groups (coordinates scaled to preview frame). |
| `render/renderSceneSvg.mjs` | Scene → SVG (roles, line styles, QR plate). |
| `qr/` | QR matrix encode for BrandQR. |

## Config vs generation

- **`diagram-config/`** — human-editable presets (`homeLayout.preset.ts`, `homeStyleModel.preset.ts`).
- **`diagram-generation/`** — algorithms and renderers that consume those values inside a `DiagramSpec`.

## App boundary

Import through `application/diagramCollaborator.ts` only (`createDiagramCollaborator`, `renderSceneSvg`, time/tide helpers). The barrel `index.mjs` exports the minimal surface the collaborator re-exports; do not import `.mjs` internals from UI or routes.

Normative behaviour: [`docs/specs/tide-diagram.md`](../../docs/specs/tide-diagram.md).
