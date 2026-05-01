# Plan: remove preset `canvas`, standalone HTML render, and optional rect-list scene fallback

## 1. Goal

- Stop carrying **misleading pixel `canvas` geometry** next to **k·RefRadius** layout in `homeTideDiagram.preset.ts` and related types, when the live host never uses those numbers for responsive layout.
- Remove **`renderSceneHtml`** (unused in-repo) and any constants/types that exist **only** for that entrypoint.
- Optionally collapse the renderer to a **single scene shape** (group-root + `previewFrame`) so internal “version” branches are easier to reason about.
- Align **`docs/specs/tide-diagram.md`** and the semantic inventory with the new contract once behaviour is defined.

## 2. Progress (multi-session)

When a phase is finished, **add it under Phases done** and **remove it from Phases remaining**. One line per phase is enough for a prompt such as “continue the canvas / scene cleanup plan where we left off.”

### Phases done

- Phase A
- Phase B

### Phases remaining

- Phase C (optional)

## 3. Terminology (no mystery “V2”)

The codebase overloads “version” in two unrelated ways:

| Name | Where | Meaning today |
|------|--------|----------------|
| **Tide diagram document `version`** | `buildDiagram.mjs` → `TideDiagramDocument.version` | Numeric **diagram document** schema (currently `1`). Unrelated to SVG/scene rendering. |
| **Scene graph branch in `renderSceneSvg.mjs`** | `scene.version`, `scene.root`, `scene.elements` | **Presentation-only** fork: either a **legacy rect-list** scene (`elements` + implicit y-down SVG) or the **current** **group-root scene** (`root` kind `"group"`, `version >= 2`, **`meta.previewFrame`** from `tideDiagramToScene`). |

The tide app path is only the second row: `tideDiagramToScene` in `toScene.mjs` always returns `version: 2`, a `root` group, and a `previewFrame` computed from primitives (see comment: “not from legacy spec constants”).

**Legacy rect-list scenes** (`legacySceneToSvg` in `renderSceneSvg.mjs`) are **not** produced by the current pipeline; they are a leftover path for an old `scene.json`-style object with `elements` rectangles. Nothing in this repository’s tests or app code emits that shape today (grep shows only `buildDiagram`’s document `version: 1`, which is a different field).

So: there is **no separate “V1 tide diagram”** in production—only an **unused renderer fallback** for an old **scene file** layout.

## 4. What the live app actually uses

- **Layout aspect and bounds**: CSS fills the figure (`HomeRouteTidePanels.svelte`: SVG `width`/`height` 100%, `inset: 0`) and `preserveAspectRatio="xMidYMid meet"` on the emitted SVG; **content** bounds come from **`meta.previewFrame`**, not from preset `canvas`.
- **Preset `canvas` today**: Fed through `spec` → `buildDiagram` → `TideDiagramDocument.meta.width/height` → `toScene` → `scene.meta`; **`renderSceneSvg`’s group-root path** uses **`meta.height`** only for **`vbY`** and **`canvasH`** in the y-flip transform; **`meta.width`** is unused on that path. So the fixed **420×320** pair is mostly historical noise; **height** still participates in math until we derive it from bounds.

## 5. Phase A — Remove standalone HTML helper (low risk)

**Remove**

- `export function renderSceneHtml` and its HTML template in `src/diagram-generation/render/renderSceneSvg.mjs`.
- `SCENE_HTML_PAD_PX` (only referenced from `renderSceneHtml`).
- JSDoc typedef `RenderSceneHtmlOptions` if it becomes unused.

**Keep**

- `escapeHtml` — still used elsewhere in the same file (e.g. text paths).
- `renderSceneSvg`, `computeViewBox`, `sceneToSvgInline` — shared by the app.

**Verify**

- `src/diagram-generation/index.mjs` already exports only `renderSceneSvg`; no barrel change unless something re-exported `renderSceneHtml` elsewhere (currently it does not).
- Repo-wide grep for `renderSceneHtml` / `SCENE_HTML_PAD`.

**Docs**

- If any README or comments claim a standalone HTML preview entrypoint, delete or reword (optional grep for “renderSceneHtml” / “standalone”).

## 6. Phase B — Eliminate host-supplied `spec.canvas` (core cleanup)

**Intent**: `buildDiagram` / `DiagramGenerationSpec` should not require **`spec.canvas`**. All pixel framing needed for SVG should be derived **after** layout is known—ideally from **`previewFrame`** (and the same rules the renderer already uses for `vbW` / `vbH`).

**Suggested approach** (implementation detail to validate with golden snapshots and visual check):

1. **`buildDiagram.mjs`**
   - Stop reading `spec.canvas`.
   - Either omit `meta.width` / `meta.height` from `TideDiagramDocument.meta` or set them to a documented sentinel only if something downstream still expects numbers temporarily—prefer **narrowing `TideDiagramDocument.meta`** to `{ title }` once `toScene` owns framing (see next bullet).
2. **`toScene.mjs`**
   - After `computeScenePreviewFrame`, set `meta` fields the renderer needs so **`previewFrame` alone** (plus one clear rule) defines **`canvasH`** and **`vbY`**. For example, derive **`canvasH`** from **`previewFrame.maxY`** (or `maxY + pad`) so **`vbY = canvasH - pf.maxY`** no longer depends on an external constant. Confirm equivalence or intentional improvement with existing snapshot tests.
3. **`renderSceneSvg.mjs`**
   - Update `computeViewBox` / `sceneToSvgInline` to use the new `meta` contract; remove fallbacks `|| 400` / `|| 300` if `meta.width`/`height` are no longer meaningful inputs.
4. **Types**
   - `src/diagram-config/homeTideDiagram.types.ts`: drop `canvas` from `HomeTideDiagramLayoutBase`.
   - `src/diagram-config/homeTideDiagram.preset.ts`: remove the `canvas` line.
   - `src/application/diagramGenerationCollaborator.ts`: update `TideDiagramDocument.meta` if width/height are removed.
5. **Tests / fixtures**
   - `src/application/diagramSemanticInjection.test.ts`: remove `canvas` from the fixture type and object.
   - `src/application/__snapshots__/buildDiagramGenerationSpec.test.ts.snap` and any other snapshots that embed `canvas`: regenerate after behaviour is stable.
6. **Specification**
   - `docs/specs/tide-diagram.md` (**Strict diagram input**): remove or rewrite the required **`canvas`** bullet so the contract matches implementation (e.g. “framing is derived in scene mapping / render; not host px”).
   - `docs/planning/tide-diagram-spec-phase1-semantic-inventory.md`: update row **S009** if the strict-input rule changes.

**Risk note**: Changing **`canvasH`** / **`vbY`** math without care can shift or clip the graphic. Treat **golden SVG/scene snapshots** and a **manual Home route check** as mandatory gates.

## 7. Phase C — Optional: single scene format in `renderSceneSvg` (deletion of rect-list path)

**Remove** (only after confirming no external consumers rely on rect-list scenes—currently none in-repo):

- `legacySceneToSvg` and the `if (!useV2) { ... }` branches in `computeViewBox` and `sceneToSvgInline`.
- JSDoc references to `elements` on `SceneRenderInput` if the type is tightened.

**Replace internal wording** “v2” / “v1” in comments with neutral terms: **“group-root scene”** vs **“legacy rect-list scene”**, or simply require **group-root + `previewFrame`** and throw a clear error otherwise.

**Behaviour**: If `scene.version < 2` or `root` is missing, **`renderSceneSvg`** throws with a message that points callers at **`tideDiagramToScene`**.

This phase is **not** required for Phase A or B but reduces confusion and matches how the product actually works.

## 8. Suggested order of work

1. Phase A (isolated delete + grep).
2. Phase B (behaviour + types + spec + snapshots).
3. Phase C (optional hardening / dead-code removal in renderer).

## 9. Done criteria

- No `canvas` on home preset or strict spec requirement for host px size unless the spec explicitly reintroduces an optional host override with documented semantics.
- No `renderSceneHtml` or HTML-only padding constant left behind unused.
- Tests green; Home diagram visually unchanged (or changes documented and accepted).
- `tide-diagram.md` and semantic inventory consistent with the implemented contract.
