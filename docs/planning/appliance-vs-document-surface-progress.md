# Appliance vs Document surface progress

Cross-session checklist for [`appliance-vs-document-surface-plan.md`](./appliance-vs-document-surface-plan.md).

After completing a package, flip its checkbox and add a short verification note so future sessions can continue without re-deriving state.

## Baseline context

- [x] **Home route visual intent** — Home is intentionally appliance-like with no header; key controls should feel integrated into the instrument face.
- [x] **Document route visual intent** — Non-home routes use a low-key light monochrome style that should be preserved.
- [x] **Shared menu content** — `PrimaryMenuContent` is reused across home and non-home contexts, creating a mode-specific shell requirement.

## Current packages (source-of-truth checklist)

- [ ] **`pkg-surface-contract`** — Introduce global semantic surface/text/border/focus tokens.
- [ ] **`pkg-mode-switch`** — Add deterministic route-level mode marker (`appliance` vs `document`).
- [ ] **`pkg-menu-shell`** — Make home and header menu shells mode-aware via tokens.
- [ ] **`pkg-menu-content-tokenize`** — Tokenize shared menu content styles (no behavior/copy changes).
- [ ] **`pkg-home-appliance-pass`** — Align home supporting surfaces to appliance mode; keep diagram palette unchanged.
- [ ] **`pkg-document-pass`** — Align non-home surfaces to document mode tokens while preserving current tone.
- [ ] **`pkg-utility-enum`** — Add a small, enumerated, token-backed global utility set (if adopted).
- [ ] **`pkg-cleanup-docs`** — Remove drift, codify guardrails, and finalize documentation.

## Deferred / explicitly out of scope

- Tide diagram internal color/palette changes.
- Broad component architecture refactors unrelated to surface/token migration.
- Large utility-framework rollout in one pass.

## Notes / verification log

- 2026-04-25: Added `appliance-vs-document-surface-plan.md` and this progress tracker. No implementation packages started yet.
