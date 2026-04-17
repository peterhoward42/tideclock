# tideclock

Tide clock web app (Vite + Svelte).

## Run locally

```bash
npm install
npm run dev
```

## Dev-only diagram previews

These previews only run when **`import.meta.env.DEV` is true** (i.e. `npm run dev`, not production or `vite preview`). They freeze the Home tide diagram (and matching clock readout) so you can inspect presentation branches without hunting for the right place, date, and time of day.

1. Start the dev server: `npm run dev`
2. Open the app in the browser (this app uses a **hash** router; query params belong **after `#/`**).
3. Paste one of these full URLs (each line is complete—no editing needed). Default host and port match `npm run dev` (`localhost:5173`).

http://localhost:5173/#/?diagramPreview=no-more-tides-today

http://localhost:5173/#/?diagramPreview=time-delta-short

http://localhost:5173/#/?diagramPreview=time-delta-medium

http://localhost:5173/#/?diagramPreview=atypical-tide-day

You should see an amber banner and the Home tide diagram adjusted for the selected scenario:

- **`no-more-tides-today`**: “no further tides today” branch after the last extreme of the civil day.
- **`time-delta-short`**: time frozen a few minutes before the next tide so short-interval occlusion rules apply with **both** Now label **and** Now radial line omitted (Δt strictly less than 5 minutes).
- **`time-delta-medium`**: time frozen a short while before the next tide so that the Now label is omitted but the Now radial line remains (5 minutes ≤ Δt < 1 hour).
- **`atypical-tide-day`**: replaces the loaded civil-day extremes with a **synthetic five-extrema “busy” day** (same local calendar day as the first loaded extreme) and freezes time in a countdown window so **atypical** centre copy (“Tricky tides today” / “Use the markers”) appears. Real fetch data is unchanged; only the diagram path sees the override.

Changing the URL after load updates the preview (hash / history navigation).

More detail: [`docs/planning/diagram-dev-preview-catalog.md`](docs/planning/diagram-dev-preview-catalog.md).

## Dev-only tide load UX previews

Same **DEV-only** guard as diagram previews (`npm run dev`). These simulate **runtime load-path** outcomes (failed load, stuck loading, empty civil-day slice) so you can check Home copy and layout without breaking the proxy or going offline. They short-circuit the shell fetch in `App.svelte`; implementation lives in [`src/application/tide-ux-dev-preview/tideUxDevPreviewCatalog.ts`](src/application/tide-ux-dev-preview/tideUxDevPreviewCatalog.ts).

Pick a **saved location** first (otherwise Home may still show the first-use empty state instead of tide panels). Then open one of:

http://localhost:5173/#/home?tideUxPreview=load-failed

http://localhost:5173/#/home?tideUxPreview=load-stuck

http://localhost:5173/#/home?tideUxPreview=no-extremes-today

You should see a **blue** banner on Home when a preview is active, plus:

- **`load-failed`**: same error panel as a failed tide refresh (“Tides could not be loaded…”).
- **`load-stuck`**: loading state never completes (infinite “Loading tides…”).
- **`no-extremes-today`**: successful load path with **zero** extremes for the day (“No tide extremes for this day.”).

Changing the URL after load re-runs the tide refresh so you can switch scenarios without a full reload.
