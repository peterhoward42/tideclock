# Diagram Config Presets

This directory contains human-editable, product-level diagram tuning data.

- Edit `*.preset.ts` files for geometry, sizing, angles, and style bindings.
- `*.types.ts` files hold type definitions so preset files stay data-first.
- Runtime validation and rendering live in `src/diagram-generation` (see [`README.md`](../diagram-generation/README.md)).

Current presets:

- `homeLayout.preset.ts`: Home diagram layout geometry.
- `homeStyleModel.preset.ts`: Home diagram color roles and leaf bindings.
