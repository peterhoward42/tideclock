#!/usr/bin/env python3
"""
Build a compact static JSON artefact from Ordnance Survey Open Names CSV tiles.

Expects the OS Open Names CSV product: per-tile files, usually under a Data/
subfolder. This tool searches --input recursively for *.csv (skips
OS_Open_Names_Headers.csv). Download from OS Data Hub / OS Open Names product docs.

Many OS tile files have no header row (column names are only in Doc/OS_Open_Names_Headers.csv).
This script auto-detects that case and applies the fixed column order from the product spec.

Settlement filter: local_type must match one of --local-types (default: Town, City);
matching is case-insensitive.
Coordinates: GEOMETRY_X / GEOMETRY_Y are British National Grid (EPSG:27700);
output lat/lon are WGS84 (EPSG:4326).

Output shape (columnar — keys appear once, each row is positional):
  {
    "v": 1,
    "columns": ["id", "name", "lat", "lon", ...],
    "rows": [ [...], ... ]
  }

A tiny TypeScript helper can zip columns with rows if you prefer objects at runtime.
"""

from __future__ import annotations

import argparse
import csv
import gzip
import json
import sys
from collections import Counter
from pathlib import Path

from pyproj import Transformer

# Default metadata columns (iterate later by editing COLUMN_KEYS or adding flags).
COLUMN_KEYS = [
    "id",
    "name",
    "lat",
    "lon",
    "localType",
    "county",
    "postcodeDistrict",
    "region",
    "country",
]

# Per-tile CSV column order (OS Open Names NamedPlace supply). Used when the tile has no header row.
OS_OPEN_NAMES_TILE_FIELDNAMES = (
    "Id",
    "names_uri",
    "name1",
    "name2",
    "name1_lang",
    "name2_lang",
    "type",
    "local_type",
    "GEOMETRY_X",
    "GEOMETRY_Y",
    "most_detail_view_res",
    "least_detail_view_res",
    "mbr_xmin",
    "mbr_ymin",
    "mbr_xmax",
    "mbr_ymax",
    "postcode_district",
    "postcode_district_uri",
    "populated_place",
    "populated_place_uri",
    "populated_place_type",
    "district_borough",
    "district_borough_uri",
    "district_borough_type",
    "county_unitary",
    "county_unitary_uri",
    "county_unitary_type",
    "region",
    "region_uri",
    "country",
    "country_uri",
    "related_spatial_object",
    "same_as_dbpedia",
    "same_as_geonames",
)


def _csv_first_row_looks_like_header(first_cells: list[str]) -> bool:
    if not first_cells:
        return False
    first = first_cells[0].strip().lstrip("\ufeff").lower()
    return first == "id"


def _dict_reader_for_tile(f) -> csv.DictReader:
    first_line = f.readline()
    f.seek(0)
    if not first_line.strip():
        return csv.DictReader(f, fieldnames=OS_OPEN_NAMES_TILE_FIELDNAMES)
    first_cells = next(csv.reader([first_line]), [])
    if _csv_first_row_looks_like_header(first_cells):
        return csv.DictReader(f)
    return csv.DictReader(f, fieldnames=OS_OPEN_NAMES_TILE_FIELDNAMES)


def _norm_keys(row: dict[str, str]) -> dict[str, str]:
    out: dict[str, str] = {}
    for k, v in row.items():
        if k is None:
            continue
        out[k.strip().lower()] = (v or "").strip()
    return out


def _get(row_norm: dict[str, str], *candidates: str) -> str:
    for c in candidates:
        v = row_norm.get(c.lower())
        if v is not None and v != "":
            return v
    return ""


def _parse_float(s: str) -> float | None:
    try:
        return float(s)
    except (TypeError, ValueError):
        return None


def _is_tile_csv(path: Path) -> bool:
    name = path.name.lower()
    if name == "os_open_names_headers.csv":
        return False
    return path.suffix.lower() == ".csv"


def iter_tile_csvs(input_dir: Path) -> list[Path]:
    # Tiles usually live under .../Data/*.csv; downloads are often pointed at the product root.
    paths = sorted(p for p in input_dir.rglob("*.csv") if p.is_file() and _is_tile_csv(p))
    return paths


def build_rows(
    input_dir: Path,
    local_types: frozenset[str],
    local_types_lower: frozenset[str],
    transformer: Transformer,
    verbose: bool,
) -> tuple[list[list[object]], Counter[str]]:
    rows_out: list[list[object]] = []
    seen_ids: set[str] = set()
    lt_seen: Counter[str] = Counter()

    paths = iter_tile_csvs(input_dir)
    if verbose:
        print(f"Found {len(paths)} tile CSV file(s) under {input_dir}", file=sys.stderr)

    for path in paths:
        with path.open(newline="", encoding="utf-8-sig", errors="replace") as f:
            reader = _dict_reader_for_tile(f)
            if reader.fieldnames is None:
                continue
            for raw in reader:
                n = _norm_keys(raw)
                lt = _get(n, "local_type", "localtype")
                if lt:
                    lt_seen[lt] += 1
                if not lt or lt.lower() not in local_types_lower:
                    continue
                rec_id = _get(n, "id")
                if not rec_id or rec_id in seen_ids:
                    continue
                name = _get(n, "name1", "name_1")
                if not name:
                    continue
                x = _parse_float(_get(n, "geometry_x", "GEOMETRY_X"))
                y = _parse_float(_get(n, "geometry_y", "GEOMETRY_Y"))
                if x is None or y is None:
                    continue
                lon, lat = transformer.transform(x, y)
                seen_ids.add(rec_id)
                rows_out.append(
                    [
                        rec_id,
                        name,
                        round(lat, 6),
                        round(lon, 6),
                        lt,
                        _get(n, "county_unitary", "county"),
                        _get(n, "postcode_district"),
                        _get(n, "region"),
                        _get(n, "country"),
                    ]
                )
    return rows_out, lt_seen


def main(argv: list[str] | None = None) -> int:
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument(
        "--input",
        type=Path,
        required=True,
        help="Directory containing OS Open Names tile CSV files (*.csv).",
    )
    p.add_argument(
        "--output",
        type=Path,
        required=True,
        help="Output JSON path (.json or .json.gz).",
    )
    p.add_argument(
        "--local-types",
        default="Town,City",
        help="Comma-separated local_type values to keep (default: Town,City).",
    )
    p.add_argument(
        "--gzip",
        action="store_true",
        help="Write gzip-compressed JSON (.json.gz recommended).",
    )
    p.add_argument(
        "--verbose",
        action="store_true",
        help="Log tile count; if no rows match, print local_type frequency hints.",
    )
    args = p.parse_args(argv)

    input_dir = args.input
    if not input_dir.is_dir():
        print(f"Input is not a directory: {input_dir}", file=sys.stderr)
        return 2

    local_types = frozenset(s.strip() for s in args.local_types.split(",") if s.strip())
    if not local_types:
        print("No local types after parsing --local-types.", file=sys.stderr)
        return 2
    local_types_lower = frozenset(x.lower() for x in local_types)

    transformer = Transformer.from_crs("EPSG:27700", "EPSG:4326", always_xy=True)
    rows, lt_seen = build_rows(
        input_dir, local_types, local_types_lower, transformer, args.verbose
    )
    rows.sort(key=lambda r: (str(r[1]).lower(), str(r[0])))

    if not rows and lt_seen:
        print(
            "No rows matched --local-types. Most common local_type values in input:",
            file=sys.stderr,
        )
        for lt, c in lt_seen.most_common(40):
            print(f"  {lt!r}: {c}", file=sys.stderr)

    payload = {"v": 1, "columns": COLUMN_KEYS, "rows": rows}

    args.output.parent.mkdir(parents=True, exist_ok=True)
    text = json.dumps(payload, separators=(",", ":"), ensure_ascii=False)
    if args.gzip or str(args.output).endswith(".gz"):
        args.output.write_bytes(gzip.compress(text.encode("utf-8"), mtime=0))
    else:
        args.output.write_text(text + "\n", encoding="utf-8")

    print(f"Wrote {len(rows)} rows to {args.output}", file=sys.stderr)
    if not rows and not lt_seen:
        paths = iter_tile_csvs(input_dir)
        if paths:
            with paths[0].open(newline="", encoding="utf-8-sig", errors="replace") as f:
                sample = _dict_reader_for_tile(f)
                row0 = next(iter(sample), None)
                print(
                    f"No local_type values seen in scan. First tile ({paths[0].name}) "
                    f"fieldnames={sample.fieldnames!r} first row keys sample={list((row0 or {}).keys())[:5]!r}",
                    file=sys.stderr,
                )
        else:
            print(
                "No tile CSV files found under --input (expected **/*.csv, e.g. …/Data/*.csv).",
                file=sys.stderr,
            )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
