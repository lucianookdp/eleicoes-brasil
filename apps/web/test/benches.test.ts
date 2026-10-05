import { describe, expect, it } from 'vitest';
import { seatPositions, thresholds } from '../lib/benches';

describe('bancadas', () => {
  it('draws exactly one dot per seat', () => {
    for (const n of [54, 216, 513, 531]) expect(seatPositions(n).points).toHaveLength(n);
  });

  it('matches the Constitution for 513 deputies and 81 senators', () => {
    const t = Object.fromEntries(thresholds(513).map((r) => [r.source, [r.camara, r.senado]]));
    expect(t['CF, art. 69']).toEqual([257, 41]);
    expect(t['CF, art. 58, § 3º']).toEqual([171, 27]);
    expect(t['CF, art. 60, § 2º']).toEqual([308, 49]);
    expect(t['CF, arts. 51, 52 e 86']).toEqual([342, 54]);
  });
});
