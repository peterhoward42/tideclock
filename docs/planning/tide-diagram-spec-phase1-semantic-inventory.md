# Tide Diagram Spec: Phase 1 Semantic Inventory

## Purpose

Phase 1 inventory for `docs/specs/tide-diagram.md` after Phase 0 relevance audit.

This table is the anti-regression backbone for rewrite phases: each retained normative statement is represented once, typed, and mapped from current source section to planned target section.

## Target section keys

- `TB-1` Role and boundaries
- `TB-2` Core conventions
- `TB-3` Global contract
- `TB-4` Scene model contracts
- `TB-5` Element specs
- `TB-6` Behavioral branches
- `TB-7` Interpretation and deferred topics

## Inventory

| Statement ID | Type | Current source section | Normative statement (condensed) | Target section |
| --- | --- | --- | --- | --- |
| S001 | naming contract | Role -> Host responsibilities | Diagram generator supports constrained `paintOrder.overrides`; no global numeric z-index model | TB-1 |
| S002 | naming contract | Role -> Host responsibilities | Named elements are exact-name contracts for targeted ordering and style behavior | TB-1 |
| S003 | required | Role -> Host responsibilities | Host provides external text/numeric values; viewport/canvas mapping policy remains host responsibility | TB-1 |
| S004 | error condition | Strict diagram input | Missing/wrong-type required host fields throw; no silent numeric defaults for layout keys | TB-3 |
| S005 | error condition | Strict diagram input | Invalid marker rows and invalid geometry/config values throw (not omit-element fallback) | TB-3 |
| S006 | required | Strict diagram input -> Derived behaviour | Product requires at least one tide extreme and non-empty `tideMarks.markers` | TB-3 |
| S007 | derivation | Strict diagram input -> Derived behaviour | `NoMoreTidesToday` branch is triggered by `timeNow` vs marker schedule, not by missing spec fields | TB-6 |
| S008 | required | Strict diagram input -> Derived behaviour | Optional `spec.semantic.nextTide` may drive next-tide timing; `tideMarks` remains required for TideMarks drawing | TB-3 |
| S009 | required | Strict diagram input | `canvas` must be object with finite `width` and `height` | TB-3 |
| S010 | required | Strict diagram input | `title` must be string | TB-3 |
| S011 | required | Strict diagram input -> paintOrder | `paintOrder` optional object; `overrides` optional array of override objects | TB-3 |
| S012 | required | Strict diagram input -> paintOrder | Override row: `name` non-empty string, `place` in `before|after`, `relativeTo` non-empty string | TB-3 |
| S013 | error condition | Strict diagram input -> paintOrder | Override validation: `name !== relativeTo`, no duplicate override names, referenced names must exist | TB-3 |
| S014 | error condition | Strict diagram input -> paintOrder | Override validation: each override must resolve uniquely among siblings; cyclic constraints are errors | TB-3 |
| S015 | derivation | Strict diagram input -> paintOrder | Omitted overrides preserve deterministic scene-child order | TB-3 |
| S016 | required | Strict diagram input | `refRadius`, `sweepRad`, `tickLabelTickLen`, `tickLabelSize`, `tickLabelClearance` are finite numbers; `tickLabelTickLen` is shorter than `annularBand.annularBandWidth` | TB-3 |
| S017 | required | Strict diagram input | `insideTrackRadius` finite and > 0; InsideTrack radius is `insideTrackRadius * refRadius` with RefArc center/sweep | TB-5 |
| S018 | required | Strict diagram input | `mainLabelRadius` finite and > 0; MainLabel radius is `mainLabelRadius * refRadius` concentric with RefArc/InsideTrack | TB-5 |
| S019 | required | Strict diagram input | `mainLabelTimeOffsetHours` finite and within [0, 12] | TB-3 |
| S020 | required | Strict diagram input | `tickLabelHours` array entries are integers in 0..24; empty array is syntactically valid | TB-3 |
| S021 | required | Strict diagram input | `tideMarks` required object with non-empty `markers` array | TB-3 |
| S022 | required | Strict diagram input -> tide markers | Marker row requires `heightText`, `highOrLow` in `{High,Low}`, canonical `time` | TB-5 |
| S023 | error condition | Strict diagram input -> tide markers | Marker time `24:00:00` is forbidden; sentinel reserved for RefArc endpoint only | TB-3 |
| S024 | required | Strict diagram input -> tide marks numeric | `tideHeightLabelRadius`, `tideTimeLabelRadius`, `tideHeightLabelSize`, `tideTimeLabelSize`, `tideMarkArrowDivergence`, `tideMarkArrowLineLen` are required finite numbers | TB-3 |
| S025 | error condition | Strict diagram input -> tide markers | Duplicate canonical marker times are errors | TB-3 |
| S026 | required | Strict diagram input -> hand | `hand` required object with finite positive `bossCircleRadius`, `smallCircleRadius`, `pointerPipScale`, and finite non-negative `pointerTipInset` | TB-3 |
| S027 | error condition | Strict diagram input -> hand | Generation fails when hand radial ordering constraints are violated | TB-5 |
| S028 | required | Strict diagram input -> time now label | `timeNowLabel` required object (`fontHeight`, `dateAboveTime` finite), plus required strings `timeNowLocation` and `timeNowDatePrefix` | TB-3 |
| S029 | required | Strict diagram input -> timeDelta | `timeDelta` required object with required `town`, `tidePhasePair`, `atypicalTideSummary`, `countdownLines` length 4, `emptyMessage` fields | TB-3 |
| S030 | required | Strict diagram input -> timeDelta | `tidePhasePair` enum is `out-low|in-high`; `atypicalTideSummary` required boolean | TB-3 |
| S031 | derivation | Strict diagram input -> timeDelta | Empty-day third stripe uses `countdownLines[2].belowOrigin` and `emptyMessage.fontHeight`; `emptyMessage.belowOrigin` reserved/validated only | TB-6 |
| S032 | required | Strict diagram input -> centreFrame | `centreFrame` required object; `frameArcRadius` finite number (`k·R`) | TB-3 |
| S033 | required | Strict diagram input -> annularBand | `annularBand` required object; `annularBandWidth` finite and > 0 | TB-3 |
| S034 | required | Strict diagram input -> homeMenuTrigger | `homeMenuTrigger` required object with finite positive `width`, `height`, `cornerRadius`, `labelSize`; required string `label` | TB-3 |
| S035 | error condition | Strict diagram input -> homeMenuTrigger | `cornerRadius <= min(width,height)/2` required for valid rounded rectangle | TB-3 |
| S036 | derivation | Strict diagram input -> homeMenuTrigger | Trigger position derived from tick-label bounds: left edge at leftmost tick-label bound, bottom edge at minimum tick-label-anchor Y | TB-5 |
| S037 | naming contract | Diagram elements | Top-level named elements list is contract (`TickMarks`, `TickLabels`, `TideMarks`, `Hand`, `TimeNow*`, `TimeDelta`, `CentreFrame`, `AnnularBand`, `InsideTrack`, `MainLabel`, `RefArc`, `HomeMenuTrigger`) | TB-4 |
| S038 | naming contract | Diagram elements -> Hand | Hand subgroup/leaf names are contract (`BossCircle`, `SmallCircle`, `Extension`, `Projection`, `Arm`, `PointerPip*`) | TB-4 |
| S039 | naming contract | Diagram elements -> TimeNowClock | TimeNowClock leaf names are contract (`TimeNowLabelHms`, `TimeNowLabelSecondsColon`, `TimeNowLabelSeconds`) | TB-4 |
| S040 | naming contract | Diagram elements -> TimeDelta | TimeDelta countdown and empty-day leaf names are contract (`TimeDeltaLocation`, `TimeDeltaPhase`, `TimeDeltaNext`, `TimeDeltaNextTime`, `NoMoreTidesToday`) | TB-4 |
| S041 | derivation | Diagram elements | No-next-marker case emits three TimeDelta leaves (location/phase/no-more-tides) rather than four countdown leaves | TB-6 |
| S042 | required | Diagram elements | `TimeDelta` and `CentreFrame` are independent named elements (no parent/child coupling) | TB-4 |
| S043 | naming contract | Style binding names | Style binding names are exact-match, case-sensitive, no alias/fallback | TB-4 |
| S044 | required | §Origin | Diagram origin O is RefArc center at (0,0); coordinates/angles are relative to O unless stated | TB-2 |
| S045 | required | §Sizing | `k·R` means `k * RefRadius`; linear sizing defaults to `k·R` unless overridden | TB-2 |
| S046 | required | §Axes | Axes orientation and directional vocabulary (`X` right, `Y` up, above/below) | TB-2 |
| S047 | required | §Polar | RefArc is contiguous circular arc centered at O with input radius and sweep | TB-2 |
| S048 | required | §Polar | Omitted circle gap centered on +Y; RefArc symmetric about -Y; CCW angle increase | TB-2 |
| S049 | required | §Polar | RefArc endpoints define `thetaLeft`/`thetaRight`; downstream geometry is RefArc-derived | TB-2 |
| S050 | required | §Polar -> InsideTrack | InsideTrack uses same O, `thetaLeft`, and sweep as RefArc at `insideTrackRadius * RefRadius` | TB-5 |
| S051 | derivation | §Polar -> MainLabel | MainLabel uses policy-based anchor side from larger vacant interval around `timeNow` and `mainLabelTimeOffsetHours` | TB-5 |
| S052 | derivation | §Polar -> MainLabel | Right-side choice when `t_now < 12`; otherwise left; anchor-time formula uses +/- offset | TB-5 |
| S053 | required | §Time and θ(t) | RefArc represents 24h from 00:00 (left endpoint) to 24:00 (right endpoint) | TB-2 |
| S054 | required | §Time and θ(t) | Canonical time format is strict `HH:MM:SS` with normal range 00:00:00..23:59:59 | TB-2 |
| S055 | required | §Time and θ(t) | `24:00:00` reserved sentinel only for RefArc right endpoint | TB-2 |
| S056 | derivation | §Time and θ(t) | Canonical-to-scalar `t = H + M/60 + S/3600`; normal times yield 0 <= t < 24, sentinel yields t=24 | TB-2 |
| S057 | derivation | §Time and θ(t) | Time-to-arc mapping is monotonic linear left-to-right along RefArc | TB-2 |
| S058 | derivation | §Time and θ(t) | `theta(t) = thetaLeft + (t/24)*(thetaRight-thetaLeft)`; used unless overridden | TB-2 |
| S059 | required | §Global timeNow | One global canonical `timeNow` input in `HH:MM:SS` | TB-3 |
| S060 | error condition | §Global timeNow | `timeNow = "24:00:00"` is invalid and generation must fail | TB-3 |
| S061 | derivation | §Global timeNow | `t_now` and `theta_now` derive from parsing and `theta(t)` | TB-3 |
| S062 | required | §Global timeNow | All “current time” element behavior must be expressed via `t_now`/`theta_now`; no second independent now | TB-3 |
| S063 | required | Radial lines and radial segments | Definitions of radial line vs radial segment; no intrinsic travel direction | TB-2 |
| S064 | required | Scene graph primitives | Allowed primitive families and current scope for model emission | TB-4 |
| S065 | required | Independent stroked curves | Line/arc/circle primitives are logical stroked curves (not filled) unless explicitly overridden | TB-4 |
| S066 | required | Independent stroked curves | Independent curves remain topologically distinct even if geometrically coincident | TB-4 |
| S067 | required | Independent stroked curves | AnnularBand is explicit exception: closed region with unified fill and stroke | TB-4 |
| S068 | required | Text Element | TextElement parameter set: text, font height, justification, baseline angle, anchor | TB-4 |
| S069 | required | TextElement defaults | Default baseline angle is 0 unless overridden | TB-4 |
| S070 | required | Text anchor Y | Text anchor Y follows shared diagram-space anchor convention; no em-box modeling in spec | TB-4 |
| S071 | required | Time now readout -> Shared inputs | `timeNowLabel` keys, `timeNowLocation`, `timeNowDatePrefix` drive TimeNow* elements | TB-5 |
| S072 | required | Time now readout -> Horizontal placement | TimeNow* elements are right-justified against AnnularBand +X bound; date is left-shifted before clock with fixed separator policy | TB-5 |
| S073 | required | Time now readout -> Vertical placement | `y_clock` equals minimum TickLabel anchor.y; date shares clock baseline; location baseline uses `dateAboveTime` + font-height relation | TB-5 |
| S074 | required | Time now readout -> Clock row text | TimeNowClock emits three leaves: `HH:MM`, `:`, `SS`; baseline angle 0 | TB-5 |
| S075 | naming contract | Time now readout -> Scene model | TimeNowLocation/TimeNowDate/TimeNowClock leaf/group structure and names are fixed contract | TB-4 |
| S076 | error condition | Time now readout -> Generator note | Tick labels must be non-empty when readout is used, else generation throws due to undefined `y_tick_min` | TB-3 |
| S077 | required | TimeDelta -> placement | Countdown stripes use corresponding `countdownLines[i]` geometry; anchor X fixed at 0 | TB-6 |
| S078 | required | TimeDelta -> placement | Empty-day rows 0/1 use `countdownLines[0/1]`; row 2 uses `countdownLines[2].belowOrigin` + `emptyMessage.fontHeight`; anchor X fixed at 0 | TB-6 |
| S079 | naming contract | TimeDelta -> Scene model | TimeDelta group switches to empty-day leaf set when no next marker exists | TB-4 |
| S080 | derivation | TimeDelta -> Copy/layout | Normal countdown copy rules for phase, interval, and `at HH:MM` from next marker at/after `timeNow` | TB-6 |
| S081 | derivation | TimeDelta -> Copy/layout | Host derivation policy for `tidePhasePair` from adjacent extrema including edge-segment fallback | TB-6 |
| S082 | derivation | TimeDelta -> Atypical pattern | `atypicalTideSummary=true` with next marker keeps 4 stripes but uses atypical copy (`Tricky tides today`, others empty) | TB-6 |
| S083 | derivation | TimeDelta -> Atypical pattern | `atypicalTideSummary` does not alter NoMoreTidesToday behavior | TB-6 |
| S084 | derivation | TimeDelta -> no-next-marker | No-next-marker case emits 3 stripes; third line `NoMoreTidesToday` content derives from `tidePhasePair` mapping | TB-6 |
| S085 | required | TimeDelta -> no-next-marker | Empty-day rows remain center-justified with baseline angle 0 and anchor X 0 | TB-6 |
| S086 | required | TimeDelta -> layout guidance | `countdownLines[*].belowOrigin` should keep copy inside CentreFrame chord region; no automatic coupling | TB-6 |
| S087 | required | CentreFrame | CentreFrame emits one closed circular segment and is not defined relative to TimeDelta | TB-5 |
| S088 | required | CentreFrame -> Scene model | CentreFrame named group contains one closed circular-segment primitive | TB-4 |
| S089 | required | CentreFrame -> Radius/endpoints | `R_frame = centreFrame.frameArcRadius * RefRadius`; center/sweep/orientation match RefArc | TB-5 |
| S090 | required | CentreFrame -> Closed boundary | Boundary is arc + chord closure with fill and stroke presentation | TB-5 |
| S091 | required | AnnularBand | AnnularBand is top-level region between concentric arcs and radial closures at `thetaLeft`/`thetaRight` | TB-5 |
| S092 | required | AnnularBand -> Geometry | Inner boundary coincides with RefArc; outer boundary radius is `RefRadius + AnnularBandWidth*RefRadius` | TB-5 |
| S093 | required | AnnularBand -> Geometry | End closures are radial segments, yielding one closed annular sector | TB-5 |
| S094 | required | AnnularBand -> Logical model | AnnularBand is a single drawable with fill and stroke on entire boundary | TB-4 |
| S095 | required | AnnularBand -> Logical model | RefArc remains separate top-level stroked arc despite geometric coincidence | TB-4 |
| S096 | required | AnnularBand -> Logical model | Intended host paint order for visual override: RefArc painted after AnnularBand | TB-1 |
| S097 | required | AnnularBand -> Input | `annularBand.annularBandWidth` required finite > 0 | TB-3 |
| S098 | naming contract | AnnularBand -> Scene model | AnnularBand group/leaf naming is part of exact-match style-binding contract | TB-4 |
| S099 | required | Tick marks | Tick mark is radial segment on ray `theta(t)` with radii `1.0*R` and `(1.0+k)*R` | TB-5 |
| S100 | required | Tick marks -> Placement | One tick per integer hour 0..24 inclusive; 0 and 24 are distinct endpoint ticks | TB-5 |
| S101 | required | TickLabel | TickLabel is TextElement tied to associated TickMark time/angle | TB-5 |
| S102 | required | TickLabel | TickLabel content is two-digit hour, center-justified, font `k·R`, baseline angle 0 | TB-5 |
| S103 | required | TickLabel | TickLabels generated only for host-selected subset of 0..24 | TB-5 |
| S104 | required | TickLabel | TickLabel anchor is tick outer endpoint plus polar clearance and Cartesian `(0, -0.5*FontHeight)` offset | TB-5 |
| S105 | required | TideMarks -> Count/time association | Marker count comes from host input; marker time parsed by canonical rules to derive `t` and `theta(t)` | TB-5 |
| S106 | error condition | TideMarks -> Count/time association | Marker `24:00:00` forbidden; duplicate canonical marker times error | TB-3 |
| S107 | required | TideMarks -> Count/time association | Marker `highOrLow` enum informs derived event descriptions (TimeDelta coupling) | TB-6 |
| S108 | required | TideMarks -> Logical structure | Each marker cluster emits direct children: height label, time label, time pointer subgroup | TB-4 |
| S109 | required | TideMarks -> Label layout | Both labels center-justified on marker polar axis at configured radii; baseline angle `theta + pi/2` | TB-5 |
| S110 | required | TideMarks -> Label layout | Label font heights use `tideHeightLabelSize` and `tideTimeLabelSize` multipliers | TB-5 |
| S111 | required | TideMarks -> Text rules | Height label text from host; time label synthesized `HH:MM` from canonical marker time | TB-5 |
| S112 | required | TimePointer | TimePointer construction uses divergence, line length, and circle-from-vertex geometry definitions | TB-5 |
| S113 | required | TimePointer -> Scene emission | Scene emits two side lines and one head arc choosing the arc not containing tip vertex | TB-5 |
| S114 | required | TimePointer -> presentation | TimePointer uses stroke-only primitives; fill is none | TB-4 |
| S115 | required | Hand | Hand is top-level element tied to global `timeNow` via `theta_now` | TB-5 |
| S116 | naming contract | Hand -> Scene model | Hand named group contains fixed leaf/subgroup names and stroke-only presentation | TB-4 |
| S117 | required | Hand -> PointerPip geometry | PointerPip reuses TimePointer geometry with substitutions (`t_now`, tip inset, linear scale, same divergence angle) | TB-5 |
| S118 | required | Hand -> PointerPip geometry | PointerPip is strict similarity to tide marker pointer, differing only by scale | TB-5 |
| S119 | required | Hand -> BossCircle | BossCircle center at O and radius `hand.bossCircleRadius * RefRadius` | TB-5 |
| S120 | required | Hand -> SmallCircle | SmallCircle on `theta_now` ray with inward tangency relation to PointerPip head arc | TB-5 |
| S121 | required | Hand -> Radial segments | Extension, Projection, Arm are colinear on `theta_now` ray with specified radius spans | TB-5 |
| S122 | error condition | Hand -> Radial segments | Radial ordering constraints (`r_tip < r_track < r_ref`, `r_boss < r_small_inner`) are required and failing them is an error | TB-5 |
| S123 | required | Notes on interpretation | Polar-coordinate conventions apply; ambiguity defaults to common conventions consistent with defined rules | TB-7 |

## Reconciliation notes

- Every retained Phase 0 cluster has at least one explicit statement row in this inventory.
- The non-normative `o todo` tail section is intentionally omitted from this table (handled as deferred planning content).
- Phase 2 should preserve statement IDs while moving prose under the target outline.
