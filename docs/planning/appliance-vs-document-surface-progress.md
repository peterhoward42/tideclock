# Appliance vs Document surface progress

Cross-session checklist for [`appliance-vs-document-surface-plan.md`](./appliance-vs-document-surface-plan.md).

After completing a package, flip its checkbox and add a short verification note so future sessions can continue without re-deriving state.

## Baseline context

- [x] **Home route visual intent** — Home is intentionally appliance-like with no header; key controls should feel integrated into the instrument face.
- [x] **Document route visual intent** — Non-home routes use a low-key light monochrome style that should be preserved.
- [x] **Shared menu content** — `PrimaryMenuContent` is reused across home and non-home contexts, creating a mode-specific shell requirement.

## Current packages (source-of-truth checklist)

- [x] **`pkg-surface-contract`** — Introduce global semantic surface/text/border/focus tokens.
- [x] **`pkg-mode-switch`** — Add deterministic route-level mode marker (`appliance` vs `document`).
- [x] **`pkg-menu-shell`** — Make home and header menu shells mode-aware via tokens.
- [x] **`pkg-menu-content-tokenize`** — Tokenize shared menu content styles (no behavior/copy changes).
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
- 2026-04-25: Completed `pkg-surface-contract` in `src/app.css` by introducing semantic role tokens with `appliance`/`document` mode overrides and migrating app-shell/header/menu styles to token usage without changing layout behavior.
- 2026-04-25: Completed `pkg-mode-switch` by adding `src/ui/routeSurfaceMode.ts` and wiring `data-surface-mode` on `.app-frame` in `src/ui/App.svelte` (`home` => `appliance`; all other routes => `document`).
- 2026-04-25: Verification: `npm run test -- src/ui/routeSurfaceMode.test.ts` passed; touched-file lints are clean. Manual visual smoke across home + one non-home route still pending.
- 2026-04-25: Completed **`pkg-menu-shell`**: added `--surface-menu-flyout`, `--border-menu-flyout`, `--shadow-menu-flyout` on `.app-frame` (appliance overrides shadow to `--shadow-overlay-contrast`); wired `.nav-links` in `src/app.css` and `.home-menu-panel` in `HomeRouteTidePanels.svelte` to those tokens; aligned menu link row colors/hover in `PrimaryNavMenu.svelte` and `HomeRouteTidePanels.svelte` to `--text-primary` / `--surface-overlay-hover` so document-mode header menu stays legible. Manual: open menu on home + 2 document routes; confirm hover/focus still clear.
- 2026-04-25: Completed **`pkg-menu-content-tokenize`**: added `--surface-menu-content-control`, `--surface-menu-content-control-hover`, `--surface-menu-content-inset`, `--border-menu-content-inset`, `--text-menu-content-primary`, `--text-menu-content-status` on `.app-frame[data-surface-mode]` (document maps to overlay/panel/text roles; appliance keeps prior slate/dark inset/sky-status literals). `PrimaryMenuContent.svelte` now uses only these vars. Tests: `npm run test -- --run src/ui/routes/home/homeRouteInstallFlow.test.ts src/ui/routeSurfaceMode.test.ts` passed. Document-mode install controls now use dark text on light chips (legibility fix vs prior light-on-light literals).
