# tideclock

Local-first tide clock / civil-day tide diagram prototype.

## Development

```bash
npm install
npm run dev
```

## Debug overlays (Home route)

When working on diagram sizing/centering, you can enable a deterministic overlay that visualizes the
computed framing box used to derive the SVG `viewBox`.

- **`?pf`**: draw the computed `previewFrame` (magenta rectangle + crosshair) inside the SVG.
- **`?outline`**: add a red outline to the root `<svg>` element (helps distinguish “SVG box” vs “content bounds”).
- **`?dom`**: show a small DOM/layout summary panel (rect sizes, viewBox, etc.).

Example:

```text
http://localhost:5173/?pf&outline
```

