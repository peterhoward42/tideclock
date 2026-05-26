# tideclock

Tide clock web app (Vite + Svelte).

## Operator notice (production)

To show visitors that the app is unavailable (no tides, no navigation): edit **`src/ui/operatorNoticeConfig.ts`**, set **`OPERATOR_NOTICE_ACTIVE`** to **`true`**, commit, and **redeploy**. Set it back to **`false`** when done. Edit **`src/ui/operatorNoticeCopy.ts`** if you need different wording.

```bash
npm install
npm run dev
```

---

## Developer previews — how to use them

**When they work:** only in a **dev** build (`npm run dev`). They are disabled in production builds and in `vite preview`, so they never ship as a user feature by accident.

**What they are:** special **query parameters** on the URL that force specific Home-route behaviour (frozen diagram branches or fake tide-load outcomes) so you can review UI without waiting on the right tide, time, or network.

### Steps

1. Run **`npm run dev`** and open the app (default **http://localhost:5173**).
2. This app uses a **hash router**. Put the query string **inside the hash**, after `#`, not before it.  
   **Good:** `http://localhost:5173/#/home?diagramPreview=…`  
   **Wrong:** `http://localhost:5173/?diagramPreview=…#/home` (the preview helpers will not see the params.)
3. **Diagram** previews: you only need to be on **Home** with tides already loaded (pick a coastal place once if prompted).  
   **Tide load** previews: same — pick a **saved location** first, or Home may show the “first use” screen instead of loading / error / empty panels.
4. Paste a **full example URL** from the tables below, or edit the address bar: add `?param=value`, or join two params with **`&`**.

Changing the hash (or using back/forward) **updates the preview without a full page reload**.

---

### 1. Diagram previews (`diagramPreview`)

**Param name:** `diagramPreview`  
**What it does:** freezes time and/or patches extremes **only for the diagram pipeline** so layout and copy branches are easy to see.  
**On screen:** **amber** banner on Home.

| Paste this URL (dev server) | Scenario |
| --- | --- |
| http://localhost:5173/#/?diagramPreview=no-more-tides-today | After last extreme of the day (“no further tides today” style branch). |
| http://localhost:5173/#/?diagramPreview=time-delta-short | “Now” frozen shortly before next tide — **both** Now label **and** Now radial line hidden (strictly under five minutes before next). |
| http://localhost:5173/#/?diagramPreview=time-delta-medium | Now label hidden, radial line still shown (five minutes to one hour before next). |
| http://localhost:5173/#/?diagramPreview=atypical-tide-day | Synthetic busy day + atypical centre copy (“Tricky tides today”). Fetched data unchanged; diagram path only. |

`#/?…` and `#/home?…` both land on Home; use whichever you prefer.

More detail: [`docs/planning/diagram-dev-preview-catalog.md`](docs/planning/diagram-dev-preview-catalog.md).

---

### 2. Tide load UX previews (`tideUxPreview`)

**Param name:** `tideUxPreview`  
**What it does:** skips the real storage/proxy load in the shell and returns a **fixed outcome** so Home shows the same panels as real network / empty-data cases.  
**On screen:** **blue** banner on Home.  
**Code:** [`src/application/tide-dev-preview/previewCatalog.ts`](src/application/tide-dev-preview/previewCatalog.ts).

| Paste this URL (dev server) | What you should see on Home |
| --- | --- |
| http://localhost:5173/#/home?tideUxPreview=load-failed | Error panel: tides could not be loaded. |
| http://localhost:5173/#/home?tideUxPreview=load-stuck | “Loading tides…” stays forever. |
| http://localhost:5173/#/home?tideUxPreview=no-extremes-today | Success path with zero extremes: “No tide extremes for this day.” |
| http://localhost:5173/#/home?tideUxPreview=quota-exhausted | Quota panel: “Tide data is paused” (simulated operator credit exhaustion). |

Operator notes (WorldTides dashboard, same-day reload vs next-day rollover): [`docs/planning/quota-response.md`](docs/planning/quota-response.md).

---

### Adding a new scenario later

1. **Diagram:** add an id to [`src/application/diagram-dev-preview/previewCatalog.ts`](src/application/diagram-dev-preview/previewCatalog.ts), implement the patch/freeze in a small module under that folder, and wire it in [`resolveForHome.ts`](src/application/diagram-dev-preview/resolveForHome.ts).  
2. **Tide load:** add an id and branch in [`previewCatalog.ts`](src/application/tide-dev-preview/previewCatalog.ts); the shell already calls `tidePreviewMaybeOverrideLoad` from `App.svelte`.

Then add one README row and (for diagram work) extend the planning doc if you keep using it.
