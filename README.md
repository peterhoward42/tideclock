# tideclock

Tide clock web app (Vite + Svelte).

## Operator notice (production)

To show visitors that the app is unavailable (no tides, no navigation): edit **`src/ui/operatorNoticeConfig.ts`**, set **`OPERATOR_NOTICE_ACTIVE`** to **`true`**, commit, and **redeploy**. Set it back to **`false`** when done. Edit **`src/ui/operatorNoticeCopy.ts`** if you need different wording.

```bash
npm install
npm run dev
```

---

## Developer previews

Dev only (`npm run dev`; not production or `vite preview`). Paste a URL to force a Home diagram branch or a fake tide-load outcome.

**Diagram** (`diagramPreview`)

- http://localhost:5173/#/?diagramPreview=no-more-tides-today — no more tides today
- http://localhost:5173/#/?diagramPreview=time-delta-short — Now label + radial hidden (under 5 min before next)
- http://localhost:5173/#/?diagramPreview=time-delta-medium — Now label hidden, radial shown (5 min–1 hr)
- http://localhost:5173/#/?diagramPreview=atypical-tide-day — atypical / “Tricky tides today”

**Tide load** (`tideUxPreview`)

- http://localhost:5173/#/home?tideUxPreview=load-failed — load error
- http://localhost:5173/#/home?tideUxPreview=load-stuck — loading stuck
- http://localhost:5173/#/home?tideUxPreview=no-extremes-today — no extremes today
- http://localhost:5173/#/home?tideUxPreview=quota-exhausted — quota exhausted

Diagram catalog: [`docs/planning/diagram-dev-preview-catalog.md`](docs/planning/diagram-dev-preview-catalog.md).
