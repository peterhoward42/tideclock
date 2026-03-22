/**
 * HTTP client for the tide proxy GET `/v1/tides`: validates JSON, maps High/Low and fields into the shared {@link TidePredictionsModel}.
 */

import type {
  TideExtreme,
  TidePredictionsModel,
} from "../core-models/tide-predictions";
import type { Fetcher } from "./tideprediction-cache";

/** JSON body for a successful GET /v1/tides response (fields used by the client). */
interface TideProxyTidesPayload {
  tides: Array<{
    type: string;
    time: string;
    heightMetres: number;
  }>;
  /** ISO 8601 UTC; exclusive end of the forecast window (see tideproxy OpenAPI). */
  expiresAt: string;
}

function buildTidesUrl(baseUrl: string, lat: number, lon: number): string {
  const url = new URL(baseUrl);
  const path = url.pathname.replace(/\/$/, "");
  url.pathname = `${path}/v1/tides`;
  url.searchParams.set("lat", String(lat));
  url.searchParams.set("lon", String(lon));
  return url.toString();
}

function mapTideExtreme(raw: TideProxyTidesPayload["tides"][number]): TideExtreme {
  let type: TideExtreme["type"];
  if (raw.type === "High") {
    type = "high";
  } else if (raw.type === "Low") {
    type = "low";
  } else {
    throw new Error(`Invalid tide extreme type: ${raw.type}`);
  }

  const instant = new Date(raw.time);
  if (Number.isNaN(instant.getTime())) {
    throw new Error(`Invalid tide extreme time: ${raw.time}`);
  }

  return {
    type,
    time: instant.toISOString(),
    height: raw.heightMetres,
  };
}

function parseTidesSuccess(body: unknown): { extremes: TideExtreme[]; expiresAt: string } {
  if (typeof body !== "object" || body === null || !("tides" in body)) {
    throw new Error("Tide proxy response is missing tides");
  }

  const payload = body as TideProxyTidesPayload;
  const tides = payload.tides;
  if (!Array.isArray(tides)) {
    throw new Error("Tide proxy tides is not an array");
  }

  if (typeof payload.expiresAt !== "string") {
    throw new Error("Tide proxy response is missing expiresAt");
  }

  const expiresAt = payload.expiresAt;
  if (Number.isNaN(Date.parse(expiresAt))) {
    throw new Error(`Invalid tide proxy expiresAt: ${expiresAt}`);
  }

  return {
    extremes: tides.map(mapTideExtreme),
    expiresAt,
  };
}

function errorMessageFromBody(body: unknown): string | null {
  if (typeof body !== "object" || body === null || !("error" in body)) {
    return null;
  }
  const err = (body as { error?: { message?: unknown } }).error;
  if (typeof err !== "object" || err === null || typeof err.message !== "string") {
    return null;
  }
  return err.message;
}

/**
 * createTideProxyFetcher returns a {@link Fetcher} that GETs `/v1/tides`, mutates `model.extremes` / `expiresAt`, and returns the same `model` instance.
 */
export function createTideProxyFetcher(options: {
  baseUrl: string;
  lat: number;
  lon: number;
  model: TidePredictionsModel;
}): Fetcher<TidePredictionsModel> {
  return async () => {
    console.log("[tideclock] tide proxy: fetcher invoked — this means cache missed; issuing HTTP request");
    const url = buildTidesUrl(options.baseUrl, options.lat, options.lon);
    console.log("[tide proxy] request", url);
    const res = await fetch(url);
    let body: unknown;
    try {
      body = await res.json();
    } catch {
      console.log("[tide proxy] response (not JSON)", res.status);
      throw new Error(`Tide proxy response was not JSON (status ${res.status})`);
    }

    console.log("[tide proxy] response", {
      status: res.status,
      ok: res.ok,
      body,
    });

    if (!res.ok) {
      const detail = errorMessageFromBody(body);
      throw new Error(
        detail ?? `Tide proxy request failed with status ${res.status}`
      );
    }

    const { extremes, expiresAt } = parseTidesSuccess(body);
    options.model.extremes = extremes;
    options.model.expiresAt = expiresAt;
    return options.model;
  };
}
