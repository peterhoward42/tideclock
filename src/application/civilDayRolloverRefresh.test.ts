import { describe, expect, it } from 'vitest';
import {
  type CivilDayRolloverRefreshInput,
  shouldTriggerCivilDayRolloverRefresh,
} from './civilDayRolloverRefresh';

describe('shouldTriggerCivilDayRolloverRefresh', () => {
  const base = {
    hasSelectedTown: true,
    tideLoadIsLoading: false,
    currentCivilDayStartMs: 2,
    lastSuccessfulLoadCivilDayStartMs: 1,
    lastRolloverAttemptCivilDayStartMs: undefined,
  } satisfies CivilDayRolloverRefreshInput;

  it('returns false when no town', () => {
    expect(
      shouldTriggerCivilDayRolloverRefresh({
        ...base,
        hasSelectedTown: false,
      })
    ).toBe(false);
  });

  it('returns false while loading', () => {
    expect(
      shouldTriggerCivilDayRolloverRefresh({
        ...base,
        tideLoadIsLoading: true,
      })
    ).toBe(false);
  });

  it('returns false before any successful load baseline exists', () => {
    expect(
      shouldTriggerCivilDayRolloverRefresh({
        ...base,
        lastSuccessfulLoadCivilDayStartMs: undefined,
      })
    ).toBe(false);
  });

  it('returns false when civil day matches last successful load', () => {
    expect(
      shouldTriggerCivilDayRolloverRefresh({
        ...base,
        currentCivilDayStartMs: 1,
        lastSuccessfulLoadCivilDayStartMs: 1,
      })
    ).toBe(false);
  });

  it('returns true when civil day advanced since last successful load', () => {
    expect(shouldTriggerCivilDayRolloverRefresh(base)).toBe(true);
  });

  it('returns false when a rollover attempt for this civil day already ran', () => {
    expect(
      shouldTriggerCivilDayRolloverRefresh({
        ...base,
        lastRolloverAttemptCivilDayStartMs: 2,
      })
    ).toBe(false);
  });
});
