# Rough spec for a hand element

## The `Hand` element

- New top-level named element: `Hand`.
- Child elements:
  - `BossCircle`
  - `PointerPip`
  - `SmallCircle`
  - `Extension`
  - `Projection`
  - `Arm`
- All hand geometry is constructed on the global now radial angle (`theta_now` from the main diagram spec).

## Geometric intent

### `BossCircle`

- Circle outline.
- Center at origin `(0,0)`.
- Radius from a hand input parameter (`bossCircleRadius`, k*R).

### `PointerPip`

- Pointer pip shape is intended to be visually identical in form to `TideMarks.TimePointer` and differ only by scale.
- Therefore, `PointerPip` uses the exact same geometric construction as `TideMarks.TimePointer` (same topology and same defining equations), evaluated at `theta_now`.
- Shape constraint: it is a uniform scale variant of the tide pointer silhouette (similarity transform), not an independently re-parameterized variant.
- Practical implication:
  - one hand scale factor controls pointer size;
  - divergence angle remains the same as tide pointer divergence;
  - all linear dimensions scale together.
- Add explicit hand input `pointerPipScale` (dimensionless, > 0), applied uniformly to all linear `PointerPip` dimensions relative to the tide-pointer reference shape.

### `SmallCircle`

- Circle outline.
- Radius from hand input parameter (`smallCircleRadius`, k*R).
- Center lies on the `theta_now` radial line.
- Placement is defined by tangency to the `PointerPip` head arc:
  - let the `PointerPip` head arc be the same selected cap arc used by `TideMarks.TimePointer` (arc between `Vertex2` and `Vertex3` that excludes `Vertex1`);
  - `SmallCircle` is tangent to that head arc on the inward side (toward origin).

### `Extension`

- Radial line on `theta_now`.
- Inner radius: `PointerPip` tip radius (the `Vertex1` point on the reference arc).
- Outer radius: inside-track radius (the "existing inner ring", i.e. `InsideTrackRadius * RefRadius`).

### `Projection`

- Radial line on `theta_now`.
- Inner radius: inside-track radius (`InsideTrackRadius * RefRadius`).
- Outer radius: reference arc radius (`RefRadius`).

### `Arm`

- Radial line on `theta_now`.
- Inner radius: outer edge of `BossCircle` (`bossCircleRadius`).
- Outer radius: inward edge of `SmallCircle` (`smallCircleCenterRadius - smallCircleRadius`).

## Open drafting points

- Final hand input object keys and validation rules (required fields, finite checks, >0 constraints) still to be aligned with strict-spec style.