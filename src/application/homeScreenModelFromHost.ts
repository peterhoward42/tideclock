import type { TideExtremesAtLocation } from '../core-models/TideExtremesAtLocation';
import {
  defaultClockSceneModel,
  type ClockSceneModel,
  type ClockTideEventInstant,
} from '../clock-presentation/clockSceneModel';
import type { HomeScreenModel } from '../clock-presentation/homeScreenModel';
import { loadCurrentLocation, type CurrentLocationLoader } from '../data-pipelines/currentLocation';
import type { DiagramGenerationCollaborator } from './diagramGenerationCollaborator';

function tideEventsFromExtremes(extremes: TideExtremesAtLocation | undefined): readonly ClockTideEventInstant[] {
  if (extremes === undefined) {
    return [];
  }
  return extremes.extremes.map((e) => ({ kind: e.type, timeUtc: e.timeUtc }));
}

function clockSceneWithTideExtremes(tideExtremes: TideExtremesAtLocation | undefined): ClockSceneModel {
  return {
    ...defaultClockSceneModel,
    tideEvents: tideEventsFromExtremes(tideExtremes),
  };
}

/**
 * Builds the home-route presentation bundle from host-held state (e.g. persisted location, loaded
 * tide snapshot). Call after writes like {@link storeCurrentLocation} or when tide data arrives so
 * the home subtree reacts through props.
 */
export function homeScreenModelFromHost(params: {
  loader: CurrentLocationLoader;
  tideExtremes?: TideExtremesAtLocation | undefined;
  diagramGeneration: DiagramGenerationCollaborator;
}): HomeScreenModel {
  loadCurrentLocation(params);
  return {
    clockScene: clockSceneWithTideExtremes(params.tideExtremes),
    diagramGeneration: params.diagramGeneration,
  };
}
