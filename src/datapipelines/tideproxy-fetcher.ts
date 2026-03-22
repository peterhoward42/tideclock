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

function parseTidesPayload(body: unknown): TideExtreme[] {
  if (typeof body !== "object" || body === null || !("tides" in body)) {
    throw new Error("Tide proxy response is missing tides");
  }

  const tides = (body as TideProxyTidesPayload).tides;
  if (!Array.isArray(tides)) {
    throw new Error("Tide proxy tides is not an array");
  }

  return tides.map(mapTideExtreme);
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
 * Returns a fetcher that loads extremes from the tide proxy GET /v1/tides API,
 * updates `model` via {@link TidePredictionsModel.setAll}, and returns that model.
 */
export function createTideProxyFetcher(options: {
  baseUrl: string;
  lat: number;
  lon: number;
  model: TidePredictionsModel;
}): Fetcher<TidePredictionsModel> {
  return async () => {
    const url = buildTidesUrl(options.baseUrl, options.lat, options.lon);
    const res = await fetch(url);
    let body: unknown;
    try {
      body = await res.json();
    } catch {
      throw new Error(`Tide proxy response was not JSON (status ${res.status})`);
    }

    if (!res.ok) {
      const detail = errorMessageFromBody(body);
      throw new Error(
        detail ?? `Tide proxy request failed with status ${res.status}`
      );
    }

    const extremes = parseTidesPayload(body);
    options.model.setAll(extremes);
    return options.model;
  };
}
