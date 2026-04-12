#!/usr/bin/env python3
"""
Non-exhaustive smoke checks for tools/towns2/coastal batch output.

Exits non-zero on structural failures (missing artefacts, state drift, orphans).
Prints warnings for soft format issues (dupes, blanks, suspiciously short lists).

Run from repo root or pass --repo-root.
"""

from __future__ import annotations

import argparse
import re
import sys
from collections import Counter
from pathlib import Path


REGION_HEADERS: dict[str, str] = {
    "England:": "england",
    "Wales:": "wales",
    "Scotland:": "scotland",
    "Ireland (Republic):": "ireland_republic",
    "Northern Ireland:": "northern_ireland",
}


def county_stem(name: str) -> str:
    return name.strip().lower().replace(" ", "-")


def parse_canonical_queue(md_path: Path) -> dict[str, list[str]]:
    lines = md_path.read_text(encoding="utf-8").splitlines()
    current: str | None = None
    out: dict[str, list[str]] = {v: [] for v in REGION_HEADERS.values()}
    num = re.compile(r"^\d+\.\s+(.+)$")
    for raw in lines:
        s = raw.strip()
        if s in REGION_HEADERS:
            current = REGION_HEADERS[s]
            continue
        if not current:
            continue
        m = num.match(s)
        if m:
            out[current].append(m.group(1).strip())
    return out


def parse_done_lists(state_path: Path) -> tuple[bool, dict[str, list[str]]]:
    text = state_path.read_text(encoding="utf-8")
    qe = re.search(r"^queue_exhausted:\s*(\S+)", text, re.MULTILINE)
    exhausted = bool(qe and qe.group(1).strip().lower() == "true")
    done: dict[str, list[str]] = {}
    for key in REGION_HEADERS.values():
        m = re.search(rf"^[ \t]*{key}:\s*\[(.*?)\]\s*$", text, re.MULTILINE | re.DOTALL)
        if not m:
            raise ValueError(f"could not parse done list for {key} in {state_path}")
        inner = m.group(1).strip()
        if not inner:
            done[key] = []
        else:
            done[key] = [p.strip() for p in inner.split(",")]
    return exhausted, done


def soft_scan_file(path: Path) -> list[tuple[str, str]]:
    """Return (severity, message) issues for one artefact."""
    issues: list[tuple[str, str]] = []
    raw_lines = path.read_text(encoding="utf-8").splitlines()
    non_empty = [ln for ln in raw_lines if ln.strip()]
    blank_count = len(raw_lines) - len(non_empty)
    if blank_count:
        issues.append(("WARN", f"{blank_count} blank line(s)"))

    for i, ln in enumerate(raw_lines, start=1):
        if ln.lstrip().startswith("#"):
            issues.append(("WARN", f"line {i}: starts with '#' (spec: no section headings)"))
        if re.search(r"(?i)\bpass\s*[123]\b", ln):
            issues.append(("WARN", f"line {i}: looks like a pass label"))

    folded = [ln.strip().casefold() for ln in non_empty]
    dupes = [k for k, v in Counter(folded).items() if v > 1]
    if dupes:
        preview = ", ".join(repr(d) for d in dupes[:5])
        extra = f" (+{len(dupes) - 5} more)" if len(dupes) > 5 else ""
        issues.append(("WARN", f"case-insensitive duplicate line(s): {preview}{extra}"))

    for i, ln in enumerate(non_empty, start=1):
        if "[" in ln and "]" in ln:
            issues.append(("WARN", f"line {i}: contains '[' and ']' (spec: place names only; strip county tags)"))

    return issues


def main() -> int:
    ap = argparse.ArgumentParser(description="Smoke-check coastal batch artefacts and state.")
    ap.add_argument(
        "--repo-root",
        type=Path,
        default=None,
        help="Repository root (default: infer from script location)",
    )
    ap.add_argument(
        "--min-lines",
        type=int,
        default=50,
        help="Warn when a county file has fewer non-empty lines (default: 50)",
    )
    args = ap.parse_args()

    repo = args.repo_root
    if repo is None:
        repo = Path(__file__).resolve().parents[3]
    towns2 = repo / "tools" / "towns2"
    queue_md = towns2 / "prompt-colateral" / "coastal_county_queue.md"
    state_yaml = towns2 / "state" / "coastal_queue_state.yaml"
    coastal_dir = towns2 / "coastal"

    errors: list[str] = []
    warnings: list[str] = []

    if not queue_md.is_file():
        errors.append(f"missing canonical queue: {queue_md}")
        print("\n".join(errors), file=sys.stderr)
        return 1
    if not state_yaml.is_file():
        errors.append(f"missing state file: {state_yaml}")
        print("\n".join(errors), file=sys.stderr)
        return 1
    if not coastal_dir.is_dir():
        errors.append(f"missing coastal directory: {coastal_dir}")
        print("\n".join(errors), file=sys.stderr)
        return 1

    canonical = parse_canonical_queue(queue_md)
    try:
        exhausted, done = parse_done_lists(state_yaml)
    except ValueError as e:
        errors.append(str(e))
        print("\n".join(errors), file=sys.stderr)
        return 1

    if not exhausted:
        errors.append("queue_exhausted is not true (batch may not be finished)")

    for region, canon_list in canonical.items():
        a, b = set(canon_list), set(done.get(region, []))
        if a != b:
            only_canon = sorted(a - b)
            only_done = sorted(b - a)
            errors.append(
                f"region {region}: done list does not match coastal_county_queue.md "
                f"(only in canonical: {only_canon}; only in done: {only_done})"
            )

    expected_stems: set[str] = set()
    for region, names in canonical.items():
        for name in names:
            stem = county_stem(name)
            expected_stems.add(stem)
            artefact = coastal_dir / f"{stem}.txt"
            if not artefact.is_file():
                errors.append(f"missing artefact for {name} ({region}): {artefact}")
            elif artefact.stat().st_size == 0:
                errors.append(f"empty artefact for {name}: {artefact}")

    on_disk = {p.stem for p in coastal_dir.glob("*.txt")}
    orphans = sorted(on_disk - expected_stems)
    if orphans:
        errors.append(f"unexpected coastal/*.txt not in canonical queue: {orphans}")

    # Soft scans (only if hard structure is OK enough to read files).
    line_counts: list[tuple[str, int]] = []
    if not errors:
        for stem in sorted(expected_stems):
            path = coastal_dir / f"{stem}.txt"
            if not path.is_file():
                continue
            raw = path.read_text(encoding="utf-8").splitlines()
            n = len([ln for ln in raw if ln.strip()])
            line_counts.append((stem, n))
            if n < args.min_lines:
                warnings.append(f"{stem}.txt: only {n} non-empty lines (threshold {args.min_lines})")
            for sev, msg in soft_scan_file(path):
                if sev == "WARN":
                    warnings.append(f"{path.name}: {msg}")

    # Summary stats (always useful when passing).
    if line_counts:
        counts = sorted(n for _, n in line_counts)
        lo, hi = counts[0], counts[-1]
        mid = counts[len(counts) // 2]
        print(
            f"Coastal smoke check: {len(line_counts)} county files, "
            f"non-empty lines min/median/max = {lo}/{mid}/{hi}"
        )

    if warnings:
        print("Warnings:", file=sys.stderr)
        for w in warnings:
            print(f"  - {w}", file=sys.stderr)

    if errors:
        print("Errors:", file=sys.stderr)
        for e in errors:
            print(f"  - {e}", file=sys.stderr)
        return 1

    print("OK: canonical queue, done lists, artefacts, and queue_exhausted look consistent.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
