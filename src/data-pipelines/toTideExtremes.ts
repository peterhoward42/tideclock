import { TideExtreme, type TideExtremeType } from '../core-models/TideExtreme';
import { TideExtremesAtLocation } from '../core-models/TideExtremesAtLocation';
import type { TideProxyV1Response, TideProxyV1TideExtreme } from './TideProxyV1Response';

export class TideProxyV1BuildError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TideProxyV1BuildError';
  }
}

export interface BuildTideExtremesAtLocationFromTideProxyV1ResponseParams {
  latitude: number;
  longitude: number;
  response: TideProxyV1Response;
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function assertValidCoordinates(latitude: number, longitude: number): void {
  if (!isFiniteNumber(latitude) || latitude < -90 || latitude > 90) {
    throw new TideProxyV1BuildError(
      `Invalid latitude "${latitude}". Expected a number in [-90, 90].`
    );
  }

  if (!isFiniteNumber(longitude) || longitude < -180 || longitude > 180) {
    throw new TideProxyV1BuildError(
      `Invalid longitude "${longitude}". Expected a number in [-180, 180].`
    );
  }
}

function mapExtremeType(type: unknown): TideExtremeType {
  if (type === 'High') {
    return 'high';
  }

  if (type === 'Low') {
    return 'low';
  }

  throw new TideProxyV1BuildError(
    `Invalid tide extreme type "${String(type)}". Expected "High" or "Low".`
  );
}

function assertValidUtcTimestamp(rawUtcTimestamp: unknown, index: number): string {
  if (typeof rawUtcTimestamp !== 'string' || rawUtcTimestamp.trim() === '') {
    throw new TideProxyV1BuildError(
      `Invalid tide extreme time at index ${index}. Expected a non-empty UTC timestamp string.`
    );
  }

  const parsedUtcTimestamp = Date.parse(rawUtcTimestamp);
  if (Number.isNaN(parsedUtcTimestamp)) {
    throw new TideProxyV1BuildError(
      `Invalid tide extreme time "${rawUtcTimestamp}" at index ${index}. Expected an ISO-8601 timestamp.`
    );
  }

  return rawUtcTimestamp;
}

function assertValidHeightMetres(rawHeightMetres: unknown, index: number): number {
  if (!isFiniteNumber(rawHeightMetres)) {
    throw new TideProxyV1BuildError(
      `Invalid tide extreme heightMetres at index ${index}. Expected a finite number.`
    );
  }

  return rawHeightMetres;
}

function validateResponseShape(response: TideProxyV1Response): void {
  if (!response || typeof response !== 'object') {
    throw new TideProxyV1BuildError('Invalid tide proxy response. Expected an object payload.');
  }

  if (!Array.isArray(response.tides)) {
    throw new TideProxyV1BuildError('Invalid tide proxy response. Expected "tides" to be an array.');
  }
}

function buildTideExtreme(extreme: TideProxyV1TideExtreme, index: number): TideExtreme {
  const type = mapExtremeType(extreme?.type);
  const timeUtc = assertValidUtcTimestamp(extreme?.time, index);
  const heightMetres = assertValidHeightMetres(extreme?.heightMetres, index);

  return new TideExtreme(type, timeUtc, heightMetres);
}

export function buildTideExtremesAtLocationFromTideProxyV1Response({
  latitude,
  longitude,
  response
}: BuildTideExtremesAtLocationFromTideProxyV1ResponseParams): TideExtremesAtLocation {
  assertValidCoordinates(latitude, longitude);
  validateResponseShape(response);

  const mappedExtremes = response.tides.map((extreme, index) => buildTideExtreme(extreme, index));
  return new TideExtremesAtLocation(latitude, longitude, mappedExtremes);
}
