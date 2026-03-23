#!/usr/bin/env python3
"""
Build a compact static JSON artefact from Ordnance Survey Open Names CSV tiles.

Expects the extracted product layout: a folder of per-tile CSV files (typically
under .../Data/*.csv). Download from OS Data Hub / OS Open Names product docs.

Settlement filter: local_type must be one of --local-types (default: Town, City).
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


def _norm_keys(row: dict[str, str]) -> dict[str, str]:
    return {k.strip().lower(): (v or "").strip() for k, v in row.items()}


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


def iter_tile_csvs(input_dir: Path) -> list[Path]:
    paths = sorted(input_dir.glob("*.csv"))
    return [p for p in paths if p.is_file()]


def build_rows(
    input_dir: Path,
    local_types: frozenset[str],
    transformer: Transformer,
) -> list[list[object]]:
    rows_out: list[list[object]] = []
    seen_ids: set[str] = set()

    for path in iter_tile_csvs(input_dir):
        with path.open(newline="", encoding="utf-8-sig", errors="replace") as f:
            reader = csv.DictReader(f)
            if reader.fieldnames is None:
                continue
            for raw in reader:
                n = _norm_keys(raw)
                lt = _get(n, "local_type", "localtype")
                if lt not in local_types:
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
    return rows_out


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
    args = p.parse_args(argv)

    input_dir = args.input
    if not input_dir.is_dir():
        print(f"Input is not a directory: {input_dir}", file=sys.stderr)
        return 2

    local_types = frozenset(s.strip() for s in args.local_types.split(",") if s.strip())
    if not local_types:
        print("No local types after parsing --local-types.", file=sys.stderr)
        return 2

    transformer = Transformer.from_crs("EPSG:27700", "EPSG:4326", always_xy=True)
    rows = build_rows(input_dir, local_types, transformer)
    rows.sort(key=lambda r: (str(r[1]).lower(), str(r[0])))

    payload = {"v": 1, "columns": COLUMN_KEYS, "rows": rows}

    args.output.parent.mkdir(parents=True, exist_ok=True)
    text = json.dumps(payload, separators=(",", ":"), ensure_ascii=False)
    if args.gzip or str(args.output).endswith(".gz"):
        args.output.write_bytes(gzip.compress(text.encode("utf-8"), mtime=0))
    else:
        args.output.write_text(text + "\n", encoding="utf-8")

    print(f"Wrote {len(rows)} rows to {args.output}", file=sys.stderr)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
