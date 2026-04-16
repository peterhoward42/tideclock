<!-- TODO: Revisit this README — restore project overview, setup, and other docs once diagram dev previews settle. -->

# Dev-only diagram previews

These previews only run when **`import.meta.env.DEV` is true** (i.e. `npm run dev`, not production or `vite preview`).

1. Start the dev server: `npm run dev`
2. Open the app in the browser (this app uses a **hash** router; query params belong **after `#/`**).
3. Append one of:
   - **`?diagramPreview=no-more-tides-today`**
   - **`?diagramPreview=time-delta-short`**
   - **`?diagramPreview=time-delta-medium`**

Example:

```text
http://localhost:5173/#/?diagramPreview=no-more-tides-today
```

You should see an amber banner and the Home tide diagram frozen for the selected scenario:

- **`no-more-tides-today`**: “no further tides today” branch after the last extreme of the civil day.
- **`time-delta-short`**: time frozen a few minutes before the next tide so short-interval occlusion rules apply with **both** Now label **and** Now radial line omitted (Δt strictly less than 5 minutes).
- **`time-delta-medium`**: time frozen a short while before the next tide so that the Now label is omitted but the Now radial line remains (5 minutes ≤ Δt < 1 hour).

Changing the URL after load updates the preview (hash / history navigation).
