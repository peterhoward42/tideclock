import { describe, expect, it } from "vitest";
import { TideExtreme } from "../core-models/TideExtreme";
import { TideExtremesAtLocation } from "../core-models/TideExtremesAtLocation";
import {
  isAtypicalTideExtremaPattern,
  TideExtremaPatternDetection,
} from "../time-services/isAtypicalTideExtremaPattern";
import {
  buildDiagramGenerationSpec,
  utcIsoToLocalCanonicalTimeLocal,
} from "./buildDiagramGenerationSpec";
import { createDiagramGenerationCollaborator } from "./diagramGenerationCollaborator";
import { buildDiagramDevPreviewAtypicalTideDay } from "./diagramDevPreviewAtypicalTideDay";
import {
  localCanonicalTimeNowFromMs,
  localTimeNowDatePrefixFromMs,
} from "./localWallClockReadoutFromMs";
import { deriveNextTideSemantics } from "./nextTideSemantics";

describe("buildDiagramDevPreviewAtypicalTideDay", () => {
  it("produces five strictly ascending extremes that classify as atypical", () => {
    const base = new TideExtremesAtLocation(50.8, -1.1, [
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

  it("hits atypical countdown copy through the same pipeline as Home", () => {
    const base = new TideExtremesAtLocation(50.8, -1.1, [
      new TideExtreme("low", "2026-03-23T12:00:00.000Z", 1),
    ]);
    const material = buildDiagramDevPreviewAtypicalTideDay({
      extremesAtLocation: base,
    });
    expect(material.kind).toBe("active");
    if (material.kind !== "active") return;
    const { extremesAtLocation, frozenEpochMs } = material;
    const timeNow = localCanonicalTimeNowFromMs(frozenEpochMs);
    const timeNowDatePrefix = localTimeNowDatePrefixFromMs(frozenEpochMs);
    const spec = buildDiagramGenerationSpec({
      extremesAtLocation,
      timeNow,
      timeNowDatePrefix,
      utcIsoToLocalCanonicalTime: utcIsoToLocalCanonicalTimeLocal,
      townName: "Lymington",
    });
    expect((spec.timeDelta as { atypicalTideSummary: boolean }).atypicalTideSummary).toBe(
      true,
    );
    const { nextTide } = deriveNextTideSemantics(spec);
    const withSemantic = buildDiagramGenerationSpec({
      extremesAtLocation,
      timeNow,
      timeNowDatePrefix,
      utcIsoToLocalCanonicalTime: utcIsoToLocalCanonicalTimeLocal,
      townName: "Lymington",
      derivedSemantics: { nextTide },
    });
    const { diagram } = createDiagramGenerationCollaborator().generate(withSemantic);
    const stripes = diagram.timeDeltaDiagram.countdownStripes;
    expect(stripes).not.toBeNull();
    expect(stripes!.map((s) => s.content)).toEqual([
      "Lymington",
      "Tricky tides today",
      "Use the markers",
      "",
    ]);
  });
});
