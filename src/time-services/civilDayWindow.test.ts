import { describe, expect, it } from 'vitest';
import { CivilDayWindow } from './civilDayWindow';

describe('CivilDayWindow', () => {
  it('stores defensive copies of constructor dates', () => {
    const start = new Date(2026, 2, 23, 0, 0, 0, 0);
    const end = new Date(2026, 2, 24, 0, 0, 0, 0);
    const window = new CivilDayWindow(start, end);

    start.setHours(12);
    end.setHours(12);

    expect(window.startLocal).toEqual(new Date(2026, 2, 23, 0, 0, 0, 0));
    expect(window.endLocalExclusive).toEqual(new Date(2026, 2, 24, 0, 0, 0, 0));
  });

  it('rejects endLocalExclusive that is not strictly after startLocal', () => {
    const start = new Date(2026, 2, 23, 0, 0, 0, 0);
    expect(() => new CivilDayWindow(start, new Date(start.getTime()))).toThrow(
      /endLocalExclusive must be strictly after startLocal/
    );
    expect(() => new CivilDayWindow(start, new Date(2026, 2, 22, 0, 0, 0, 0))).toThrow(
      /endLocalExclusive must be strictly after startLocal/
    );
  });
});
