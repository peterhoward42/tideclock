# Towns2 canonical data pipeline

Towns2 is the canonical source-of-truth pipeline for shipped location data.

Data flow:

1. Curated county/coastal place inputs live in `tools/towns2/coastal/*.txt`.
2. Geocoding output for those inputs lives in `tools/towns2/coastal-geocoded/*.tsv`.
3. Build script `tools/towns2/build-towns2-compact.mjs` compiles the geocoded TSVs.
4. Shipped runtime artifacts are written to:
   - `src/data/towns2.compact.json`
   - `src/data/towns2-search-lines.json`

To regenerate shipped artifacts, run:

```bash
npm run build-towns2-data
```
