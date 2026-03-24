import townsCompactJson from './towns.compact.json';

/** One settlement row after hydration from `towns.compact.json`. */
export type Town = {
  id: string;
  name: string;
  lat: number;
  lon: number;
  localType: string;
  county: string;
  postcodeDistrict: string;
  region: string;
  country: string;
};

const REQUIRED_COLUMNS = [
  'id',
  'name',
  'lat',
  'lon',
  'localType',
  'county',
  'postcodeDistrict',
  'region',
  'country',
] as const;

type RequiredColumn = (typeof REQUIRED_COLUMNS)[number];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function columnIndexMap(columns: unknown): Map<string, number> {
  if (!Array.isArray(columns) || columns.some((c) => typeof c !== 'string')) {
    throw new Error('towns compact: columns must be an array of strings');
  }
  const map = new Map<string, number>();
  for (let i = 0; i < columns.length; i += 1) {
    map.set(columns[i] as string, i);
  }
  return map;
}

function requireIndices(map: Map<string, number>): Record<RequiredColumn, number> {
  const out = {} as Record<RequiredColumn, number>;
  for (const name of REQUIRED_COLUMNS) {
    const idx = map.get(name);
    if (idx === undefined) {
      throw new Error(`towns compact: missing column "${name}"`);
    }
    out[name] = idx;
  }
  return out;
}

function asString(value: unknown, field: string, rowIndex: number): string {
  if (typeof value !== 'string') {
    throw new Error(`towns compact: row ${rowIndex} field "${field}" must be a string`);
  }
  return value;
}

function asNumber(value: unknown, field: string, rowIndex: number): number {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    throw new Error(`towns compact: row ${rowIndex} field "${field}" must be a finite number`);
  }
  return value;
}

/**
 * Turns the compact `v`/`columns`/`rows` JSON into plain town records.
 * Call once at module load; exported for tests.
 */
export function hydrateTownsCompact(doc: unknown): Town[] {
  if (!isRecord(doc)) {
    throw new Error('towns compact: root must be an object');
  }
  if (doc.v !== 1) {
    throw new Error(`towns compact: unsupported v ${String(doc.v)}`);
  }
  const map = columnIndexMap(doc.columns);
  const idx = requireIndices(map);
  const rows = doc.rows;
  if (!Array.isArray(rows)) {
    throw new Error('towns compact: rows must be an array');
  }

  const towns: Town[] = [];
  for (let rowIndex = 0; rowIndex < rows.length; rowIndex += 1) {
    const row = rows[rowIndex];
    if (!Array.isArray(row)) {
      throw new Error(`towns compact: row ${rowIndex} must be an array`);
    }
    const maxIdx = Math.max(...Object.values(idx));
    if (row.length <= maxIdx) {
      throw new Error(`towns compact: row ${rowIndex} has length ${row.length}, need > ${maxIdx}`);
    }
    towns.push({
      id: asString(row[idx.id], 'id', rowIndex),
      name: asString(row[idx.name], 'name', rowIndex),
      lat: asNumber(row[idx.lat], 'lat', rowIndex),
      lon: asNumber(row[idx.lon], 'lon', rowIndex),
      localType: asString(row[idx.localType], 'localType', rowIndex),
      county: asString(row[idx.county], 'county', rowIndex),
      postcodeDistrict: asString(row[idx.postcodeDistrict], 'postcodeDistrict', rowIndex),
      region: asString(row[idx.region], 'region', rowIndex),
      country: asString(row[idx.country], 'country', rowIndex),
    });
  }
  return towns;
}

/** All towns from the committed compact JSON, hydrated at module load. */
export const bakedTowns: readonly Town[] = hydrateTownsCompact(townsCompactJson);
