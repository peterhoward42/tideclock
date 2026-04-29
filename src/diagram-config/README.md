# Diagram Config Presets

This directory contains human-editable, product-level diagram tuning data.

- Edit `*.preset.ts` files for geometry, sizing, angles, and style bindings.
- `*.types.ts` files hold type definitions so preset files stay data-first.
- Runtime validation and rendering live in `src/diagram-generation`.

Current presets:

- `homeTideDiagram.preset.ts`: Home diagram layout geometry.
- `homeTideStyleModel.preset.ts`: Home diagram color roles and leaf bindings.
