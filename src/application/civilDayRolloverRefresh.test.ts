import { describe, expect, it } from 'vitest';
import {
  type RolloverRefreshInput,
  shouldTriggerRolloverRefresh,
} from './civilDayRolloverRefresh';

describe('shouldTriggerRolloverRefresh', () => {
  const base = {
    hasSelectedTown: true,
    tideLoadIsLoading: false,
    currentCivilDayStartMs: 2,
    lastSuccessfulLoadCivilDayStartMs: 1,
    lastRolloverAttemptCivilDayStartMs: undefined,
  } satisfies RolloverRefreshInput;

  it('returns false when no town', () => {
    expect(
      shouldTriggerRolloverRefresh({
        ...base,
        hasSelectedTown: false,
      })
    ).toBe(false);
  });

  it('returns false while loading', () => {
    expect(
      shouldTriggerRolloverRefresh({
        ...base,
        tideLoadIsLoading: true,
      })
    ).toBe(false);
  });

  it('returns false before any successful load baseline exists', () => {
    expect(
      shouldTriggerRolloverRefresh({
        ...base,
        lastSuccessfulLoadCivilDayStartMs: undefined,
      })
    ).toBe(false);
  });

  it('returns false when civil day matches last successful load', () => {
    expect(
      shouldTriggerRolloverRefresh({
        ...base,
        currentCivilDayStartMs: 1,
        lastSuccessfulLoadCivilDayStartMs: 1,
      })
    ).toBe(false);
  });

  it('returns true when civil day advanced since last successful load', () => {
    expect(shouldTriggerRolloverRefresh(base)).toBe(true);
  });

  it('returns false when a rollover attempt for this civil day already ran', () => {
    expect(
      shouldTriggerRolloverRefresh({
        ...base,
        lastRolloverAttemptCivilDayStartMs: 2,
      })
    ).toBe(false);
  });
});
