# Graphics workflow

**Loop:** Spec inputs (YAML/JSON) in repo → JS builds a scene graph (lines, arcs, text) from the model → write a **fixed-path** preview artifact → look at it → iterate spec/code.

**Preview file:** Prefer one **HTML file with inline SVG** at a stable path (e.g. `generated/preview.html`) so double-click always opens in the browser. Plain SVG is fine if your Mac opens it in a browser by default.

**Open without Finder:** After generation, run `open <path-to-preview.html>` (orchestrated in Cursor, or an npm script that runs generate then `open`).

**Scope:** Geometry-first; styling can be minimal placeholders. SVG is an output, not the core abstraction—the scene graph is.
