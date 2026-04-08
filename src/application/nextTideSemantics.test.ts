import { describe, expect, it } from 'vitest';
import {
  type DeriveNextTideSemanticsSpec,
  deriveNextTideSemantics,
} from './nextTideSemantics';

function specWithMarkers(
  timeNow: string,
  markers: Array<{ time: string; highOrLow: string }>,
): DeriveNextTideSemanticsSpec {
  return {
    timeNow,
    tideMarks: {
      markers: markers.map((m) => ({
        time: m.time,
        heightText: '0 m',
        highOrLow: m.highOrLow,
      })),
    },
  };
}

describe('deriveNextTideSemantics', () => {
  it('throws when markers array is empty', () => {
    const spec = specWithMarkers('12:00:00', []);
    expect(() => deriveNextTideSemantics(spec)).toThrow(/non-empty/);
  });

  it('returns null nextTide when every marker is strictly before timeNow', () => {
    const spec = specWithMarkers('18:00:00', [
      { time: '04:00:00', highOrLow: 'Low' },
      { time: '10:00:00', highOrLow: 'High' },
    ]);
    const out = deriveNextTideSemantics(spec);
    expect(out.nextTide).toBeNull();
  });

  it('at civil-day start (00:00:00), next event is the first marker of the day', () => {
    const spec = specWithMarkers('00:00:00', [
      { time: '06:12:00', highOrLow: 'High' },
      { time: '12:30:00', highOrLow: 'Low' },
    ]);
    const out = deriveNextTideSemantics(spec);
    expect(out.nextTide).toEqual({
      secondsSinceMidnight: 6 * 3600 + 12 * 60,
      kind: 'High',
      timeDeltaIntervalText: '6h 12m',
    });
  });

  it('treats marker at exactly timeNow as the next event (inclusive midnight boundary)', () => {
    const spec = specWithMarkers('06:12:00', [
      { time: '06:12:00', highOrLow: 'High' },
      { time: '12:00:00', highOrLow: 'Low' },
    ]);
    const out = deriveNextTideSemantics(spec);
    expect(out.nextTide).toEqual({
      secondsSinceMidnight: 6 * 3600 + 12 * 60,
      kind: 'High',
      timeDeltaIntervalText: '0h 0m',
    });
  });

  it('uses custom timeNow label in parse errors', () => {
    expect(() =>
      deriveNextTideSemantics(
        {
          timeNow: '99:00:00',
          tideMarks: {
            markers: [{ time: '12:00:00', heightText: '0 m', highOrLow: 'High' }],
          },
        },
        { timeNowLabel: 'clock.now' },
      ),
    ).toThrow(/clock\.now/);
  });
});
