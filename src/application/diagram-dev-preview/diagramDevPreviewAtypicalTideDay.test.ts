import { describe, expect, it } from "vitest";
import { TideExtreme } from "../../core-models/TideExtreme";
import { TideExtremesAtLocation } from "../../core-models/TideExtremesAtLocation";
import {
  isAtypicalTideExtremaPattern,
  TideExtremaPatternDetection,
} from "../../time-services/isAtypicalTideExtremaPattern";
import {
  buildDiagramGenerationSpec,
  utcIsoToLocalCanonicalTimeLocal,
} from "../buildDiagramGenerationSpec";
import { buildDiagramDevPreviewAtypicalTideDay } from "./diagramDevPreviewAtypicalTideDay";
import {
  localCanonicalTimeNowFromMs,
  localBrhcDatePrefixFromMs,
} from "../localWallClockReadoutFromMs";

describe("buildDiagramDevPreviewAtypicalTideDay", () => {
  it("produces five strictly ascending extremes that classify as atypical", () => {
    const base = TideExtremesAtLocation.fromPossiblyUnordered(50.8, -1.1, [
      new TideExtreme("low", "2026-03-23T12:00:00.000Z", 1),
    ]);
    const preview = buildDiagramDevPreviewAtypicalTideDay({
      extremesAtLocation: base,
    });
    expect(preview.kind).toBe("active");
    if (preview.kind !== "active") return;
    expect(preview.extremesAtLocation.extremes).toHaveLength(5);
    const times = preview.extremesAtLocation.extremes.map((e) => Date.parse(e.timeUtc));
    for (let i = 1; i < times.length; i += 1) {
      expect(times[i]).toBeGreaterThan(times[i - 1]);
    }
    expect(isAtypicalTideExtremaPattern(preview.extremesAtLocation.extremes)).toBe(
      TideExtremaPatternDetection.MoreThanFourExtrema,
    );
  });

  it("builds a valid spec through the same pipeline as Home", () => {
    const base = TideExtremesAtLocation.fromPossiblyUnordered(50.8, -1.1, [
      new TideExtreme("low", "2026-03-23T12:00:00.000Z", 1),
    ]);
    const material = buildDiagramDevPreviewAtypicalTideDay({
      extremesAtLocation: base,
    });
    expect(material.kind).toBe("active");
    if (material.kind !== "active") return;
    const { extremesAtLocation, frozenEpochMs } = material;
    const timeNow = localCanonicalTimeNowFromMs(frozenEpochMs);
    const brhcDatePrefix = localBrhcDatePrefixFromMs(frozenEpochMs);
    const spec = buildDiagramGenerationSpec({
      extremesAtLocation,
      timeNow,
      brhcDatePrefix,
      utcIsoToLocalCanonicalTime: utcIsoToLocalCanonicalTimeLocal,
      townName: "Lymington",
    });
    expect(spec.timeNow).toBe(timeNow);
    expect(spec.brhcDatePrefix).toBe(brhcDatePrefix);
  });
});
