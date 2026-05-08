/**
 * Aggregates tools/towns2/coastal-geocoded/*.tsv into shipped app JSON:
 * - src/data/towns2.compact.json — compact Town rows (see src/data/townSchema.ts)
 *
 * Run: node tools/towns2/build-towns2-compact.mjs
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const geocodedDir = path.join(__dirname, 'coastal-geocoded');
const outCompact = path.join(__dirname, '../../src/data/towns2.compact.json');

function titleCaseToken(s) {
  if (s.length === 0) return s;
  return s[0].toUpperCase() + s.slice(1).toLowerCase();
}

function humanCountyFromStem(stem) {
  return stem
    .split('-')
    .map((w) => titleCaseToken(w))
    .join(' ');
}

function countryForCountyStem(stem) {
  if (stem === 'cork') return 'Ireland';
  return 'United Kingdom';
}

function parseTsv(text) {
  const lines = text.split(/\r?\n/).filter((l) => l.length > 0);
  if (lines.length === 0) return { header: [], rows: [] };
  const header = lines[0].split('\t');
  const rows = [];
  for (let i = 1; i < lines.length; i += 1) {
    const cols = lines[i].split('\t');
    const row = {};
    for (let j = 0; j < header.length; j += 1) {
      row[header[j]] = cols[j] ?? '';
    }
    rows.push(row);
  }
  return { header, rows };
}

const files = fs.readdirSync(geocodedDir).filter((f) => f.endsWith('.tsv')).sort();

const columns = [
  'id',
  'name',
  'lat',
  'lon',
  'localType',
  'county',
  'postcodeDistrict',
  'region',
  'country',
];

const rows = [];

for (const file of files) {
  const text = fs.readFileSync(path.join(geocodedDir, file), 'utf8');
  const { rows: tsvRows } = parseTsv(text);
  for (const r of tsvRows) {
    const status = (r.status ?? '').trim().toLowerCase();
    if (status !== 'resolved') continue;
    const latStr = (r.latitude ?? '').trim();
    const lonStr = (r.longitude ?? '').trim();
    if (latStr === '' || lonStr === '') continue;
    const lat = Number(latStr);
    const lon = Number(lonStr);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) continue;

    const countyFile = (r.county_file ?? '').trim();
    const stem = countyFile.replace(/\.txt$/i, '').toLowerCase();
    if (stem === '') continue;

    const lineIndex = (r.line_index ?? '').trim();
    const placeName = (r.place_name ?? '').trim();
    const featureKind = (r.feature_kind ?? '').trim();
    if (placeName === '') continue;

    const countyHuman = humanCountyFromStem(stem);
    const country = countryForCountyStem(stem);
    const id = `t2:${stem}:${lineIndex}`;

    rows.push([
      id,
      placeName,
      lat,
      lon,
      featureKind || 'place',
      countyHuman,
      '',
      '',
      country,
    ]);
  }
}

const doc = { v: 1, columns, rows };
fs.writeFileSync(outCompact, `${JSON.stringify(doc)}\n`, 'utf8');

console.log(
  `Wrote ${rows.length} towns from ${files.length} TSV files -> ${path.relative(process.cwd(), outCompact)}`,
);
