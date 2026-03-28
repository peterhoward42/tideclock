// Development loop (scenegen only): edit `spec.json` and/or `scene.mjs` (`buildScene`),
// then run `./iter.sh` from this directory (or `node gen.mjs`) to refresh `generated/scene.json`
// and `generated/preview.html`, which opens in the browser. Goal: tweak inputs or geometry
// code and see the same inline-SVG preview path documented in `docs/planning/graphics-workflow.md`.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildScene } from "./scene.mjs";
import { writePreviewHtml } from "./preview.mjs";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

const specPath = join(__dirname, "spec.json");
const outDir = join(__dirname, "generated");
const scenePath = join(outDir, "scene.json");
const previewPath = join(outDir, "preview.html");

const spec = JSON.parse(readFileSync(specPath, "utf8"));
const scene = buildScene(spec);

mkdirSync(outDir, { recursive: true });
writeFileSync(scenePath, JSON.stringify(scene, null, 2), "utf8");
writePreviewHtml(scene, previewPath);

console.error(`Wrote ${scenePath}`);
console.error(`Wrote ${previewPath}`);
