import { afterEach, describe, expect, it, vi } from "vitest";
import { createTidePredictionsModel } from "../core-models/tide-predictions";
import { createTideProxyFetcher } from "./tideproxy-fetcher";

describe("createTideProxyFetcher", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("maps each API tide into the model (values taken from the response body)", async () => {
    // Stand in for a real proxy response: shape is stable; numbers and times vary per request.
    const apiTides = [
      {
        type: "High",
        time: "2025-01-15T12:00:00.000Z",
        heightMetres: 7.891234,
      },
      {
        type: "Low",
        time: "2025-01-15T18:00:00.000Z",
        heightMetres: 0.429876,
      },
    ] as const;

    const model = createTidePredictionsModel();
    const fetcher = createTideProxyFetcher({
      baseUrl: "https://example.com/tides-proxy",
      lat: 51.5,
      lon: -0.1,
      model,
    });

    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({ tides: apiTides }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      )
    );

    const out = await fetcher();

    expect(out).toBe(model);
    const got = model.getAll();
    expect(got).toHaveLength(apiTides.length);
    for (let i = 0; i < apiTides.length; i++) {
      const raw = apiTides[i];
      expect(got[i].type).toBe(raw.type === "High" ? "high" : "low");
      expect(got[i].height).toBe(raw.heightMetres);
      expect(got[i].time.toISOString()).toBe(raw.time);
    }
  });

  it("uses API error message when the response is not ok", async () => {
    const model = createTidePredictionsModel();
    const fetcher = createTideProxyFetcher({
      baseUrl: "http://127.0.0.1:8080",
      lat: 0,
      lon: 0,
      model,
    });

    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          error: {
            code: "INVALID_QUERY",
            message: "missing required query parameter lat",
          },
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      )
    );

    await expect(fetcher()).rejects.toThrow(
      "missing required query parameter lat"
    );
  });

  it("builds the request URL from baseUrl path and query", async () => {
    const model = createTidePredictionsModel();
    const fetcher = createTideProxyFetcher({
      baseUrl: "https://example.com/tides-proxy",
      lat: 1.25,
      lon: -2.5,
      model,
    });

    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ tides: [] }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    );

    await fetcher();

    expect(fetchMock).toHaveBeenCalledWith(
      "https://example.com/tides-proxy/v1/tides?lat=1.25&lon=-2.5"
    );
  });
});
