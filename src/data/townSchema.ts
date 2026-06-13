/**
 * townSchema.ts — Shared town row shape and compact-table hydration for shipped
 * towns2 JSON (`towns2.compact.json`).
 */

/** One settlement row after hydration from a compact towns JSON document. */
export type Town = {
  readonly name: string;
  readonly lat: number;
  readonly lon: number;
  readonly localType: string;
  readonly county: string;
  readonly postcodeDistrict: string;
  readonly region: string;
  readonly country: string;
};

/** Trim, lower-case, collapse internal spaces — shared by picker prefix search and URL place lookup. */
export function normalizeTownSearchText(input: string): string {
  return input.trim().toLowerCase().replace(/\s+/g, ' ');
}

/** Stable lookup key for a place within the shipped corpus. */
export function townPlaceCountyKey(town: Pick<Town, 'name' | 'county'>): string {
  return `${normalizeTownSearchText(town.name)}|${normalizeTownSearchText(town.county)}`;
}

/** Unique picker row key; disambiguates rare duplicate name/county pairs. */
export function townPickerRowKey(town: Pick<Town, 'name' | 'county' | 'lat' | 'lon'>): string {
  return `${townPlaceCountyKey(town)}|${town.lat}|${town.lon}`;
}

const REQUIRED_COLUMNS = [
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
type TownCompactColumnIndices = Record<RequiredColumn, number>;

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

function requireIndices(map: Map<string, number>): TownCompactColumnIndices {
  const out = {} as TownCompactColumnIndices;
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
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new Error(`towns compact: row ${rowIndex} field "${field}" must be a finite number`);
  }
  return value;
}

/** Turns compact `v`/`columns`/`rows` JSON into plain town records. */
export function hydrateTownsCompact(doc: unknown): readonly Town[] {
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
