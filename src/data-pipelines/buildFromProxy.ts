import { TideExtreme, type TideExtremeType } from '../core-models/TideExtreme';
import { TideExtremesAtLocation } from '../core-models/TideExtremesAtLocation';
import type { ProxyV1Extreme, TideProxyV1Response } from './proxyV1Types';

export class ProxyV1BuildError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ProxyV1BuildError';
  }
}

export interface BuildExtremesFromProxyParams {
  latitude: number;
  longitude: number;
  response: TideProxyV1Response;
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function assertValidCoordinates(latitude: number, longitude: number): void {
  if (!isFiniteNumber(latitude) || latitude < -90 || latitude > 90) {
    throw new ProxyV1BuildError(
      `Invalid latitude "${latitude}". Expected a number in [-90, 90].`
    );
  }

  if (!isFiniteNumber(longitude) || longitude < -180 || longitude > 180) {
    throw new ProxyV1BuildError(
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

  throw new ProxyV1BuildError(
    `Invalid tide extreme type "${String(type)}". Expected "High" or "Low".`
  );
}

function assertValidUtcTimestamp(rawUtcTimestamp: unknown, index: number): string {
  if (typeof rawUtcTimestamp !== 'string' || rawUtcTimestamp.trim() === '') {
    throw new ProxyV1BuildError(
      `Invalid tide extreme time at index ${index}. Expected a non-empty UTC timestamp string.`
    );
  }

  const parsedUtcTimestamp = Date.parse(rawUtcTimestamp);
  if (Number.isNaN(parsedUtcTimestamp)) {
    throw new ProxyV1BuildError(
      `Invalid tide extreme time "${rawUtcTimestamp}" at index ${index}. Expected an ISO-8601 timestamp.`
    );
  }

  return rawUtcTimestamp;
}

function assertValidHeightMetres(rawHeightMetres: unknown, index: number): number {
  if (!isFiniteNumber(rawHeightMetres)) {
    throw new ProxyV1BuildError(
      `Invalid tide extreme heightMetres at index ${index}. Expected a finite number.`
    );
  }

  return rawHeightMetres;
}

function validateResponseShape(response: TideProxyV1Response): void {
  if (!response || typeof response !== 'object') {
    throw new ProxyV1BuildError('Invalid tide proxy response. Expected an object payload.');
  }

  if (!Array.isArray(response.tides)) {
    throw new ProxyV1BuildError('Invalid tide proxy response. Expected "tides" to be an array.');
  }
}

function mapOneExtreme(extreme: ProxyV1Extreme, index: number): TideExtreme {
  const type = mapExtremeType(extreme?.type);
  const timeUtc = assertValidUtcTimestamp(extreme?.time, index);
  const heightMetres = assertValidHeightMetres(extreme?.heightMetres, index);

  return new TideExtreme(type, timeUtc, heightMetres);
}

export function buildExtremesFromProxy({
  latitude,
  longitude,
  response
}: BuildExtremesFromProxyParams): TideExtremesAtLocation {
  assertValidCoordinates(latitude, longitude);
  validateResponseShape(response);

  const mappedExtremes = response.tides.map((extreme, index) => mapOneExtreme(extreme, index));
  return new TideExtremesAtLocation(latitude, longitude, mappedExtremes);
}
