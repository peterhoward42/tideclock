<!-- TODO: Revisit this README — restore project overview, setup, and other docs once diagram dev previews settle. -->

# Dev-only diagram preview (no more tides today)

This preview only runs when **`import.meta.env.DEV` is true** (i.e. `npm run dev`, not production or `vite preview`).

1. Start the dev server: `npm run dev`
2. Open the app in the browser (this app uses a **hash** router; query params belong **after `#/`**).
3. Append: **`?diagramPreview=no-more-tides-today`**

Example:

```text
http://localhost:5173/#/?diagramPreview=no-more-tides-today
```

You should see an amber banner and the Home tide diagram frozen in the “no more tides today” presentation branch (after the last extreme of the civil day). Changing the URL after load updates the preview (hash / history navigation).
