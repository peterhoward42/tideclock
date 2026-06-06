import { describe, expect, it } from 'vitest';

import {
  USAGE_SPAN_EVENT_NAMES,
  USAGE_SPAN_MILESTONES,
} from './usageSpanEvents';

describe('usageSpanEvents', () => {
  it('Given the retention catalog When counted Then exposes fifteen span events per anchor family', () => {
    const visitEvents = USAGE_SPAN_EVENT_NAMES.filter((name) => name.startsWith('v_'));
    const customEvents = USAGE_SPAN_EVENT_NAMES.filter((name) => name.startsWith('c_'));

    expect(visitEvents).toEqual([
      'v_w1',
      'v_w2',
      'v_w3',
      'v_m1',
      'v_m2',
      'v_m3',
      'v_m4',
      'v_m5',
      'v_m6',
      'v_m7',
      'v_m8',
      'v_m9',
      'v_m10',
      'v_m11',
      'v_m12',
    ]);
    expect(customEvents).toEqual(
      visitEvents.map((name) => `c_${name.slice(2)}`),
    );
    expect(USAGE_SPAN_MILESTONES).toHaveLength(30);
  });
});
