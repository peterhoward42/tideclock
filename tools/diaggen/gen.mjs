// Development loop (diagram -> scene -> preview): edit `input.json` and/or modules in
// `src/diagram-generation/` (`layout`, `mapping`, `model`, `presets`), then run `./iter.sh`
// here (or `node gen.mjs`).
// Writes `generated/diagram.json`, then maps to a scene and writes `../scenegen/generated/scene.json`
// plus the shared `../scenegen/generated/preview.html` (same preview as scenegen). If you later
// run `tools/scenegen/gen.mjs`, it overwrites that scene with the direct scenegen pipeline—use
// scenegen’s loop only when iterating the scene graph without the diagram step.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  buildDiagram,
  loadStyleModel,
  STATIC_STYLE_MODEL,
  tideDiagramToScene,
} from "../../src/diagram-generation/index.mjs";
import { writePreviewHtml } from "../scenegen/preview.mjs";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

const inputPath = join(__dirname, "input.json");
const outDir = join(__dirname, "generated");
const diagramPath = join(outDir, "diagram.json");

const scenegenDir = join(__dirname, "..", "scenegen");
const scenePath = join(scenegenDir, "generated", "scene.json");
const previewPath = join(scenegenDir, "generated", "preview.html");

const input = JSON.parse(readFileSync(inputPath, "utf8"));
// Load-time validation for compile-time name -> style bindings.
const styleRuntime = loadStyleModel(STATIC_STYLE_MODEL);
const diagram = buildDiagram(input);
const scene = tideDiagramToScene(diagram);

mkdirSync(outDir, { recursive: true });
mkdirSync(join(scenegenDir, "generated"), { recursive: true });

writeFileSync(diagramPath, JSON.stringify(diagram, null, 2), "utf8");
writeFileSync(scenePath, JSON.stringify(scene, null, 2), "utf8");
writePreviewHtml(scene, previewPath, { styleRuntime });
