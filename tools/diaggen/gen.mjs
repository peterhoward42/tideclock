import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildDiagram } from "./buildDiagram.mjs";
import { tideDiagramToScene } from "./toScene.mjs";
import { writePreviewHtml } from "../scenegen/preview.mjs";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

const specPath = join(__dirname, "spec.json");
const outDir = join(__dirname, "generated");
const diagramPath = join(outDir, "diagram.json");

const scenegenDir = join(__dirname, "..", "scenegen");
const scenePath = join(scenegenDir, "generated", "scene.json");
const previewPath = join(scenegenDir, "generated", "preview.html");

const spec = JSON.parse(readFileSync(specPath, "utf8"));
const diagram = buildDiagram(spec);
const scene = tideDiagramToScene(diagram);

mkdirSync(outDir, { recursive: true });
mkdirSync(join(scenegenDir, "generated"), { recursive: true });

writeFileSync(diagramPath, JSON.stringify(diagram, null, 2), "utf8");
writeFileSync(scenePath, JSON.stringify(scene, null, 2), "utf8");
writePreviewHtml(scene, previewPath);

console.error(`Wrote ${diagramPath}`);
console.error(`Wrote ${scenePath}`);
console.error(`Wrote ${previewPath}`);
