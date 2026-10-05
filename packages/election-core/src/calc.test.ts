import { describe, expect, it } from 'vitest';
import { area, parseAreaKey } from './areas';
import {
  candidateDeltas,
  countedPct,
  isRegression,
  percent,
  progressDelta,
  rankCandidates,
  rankForDisplay,
} from './calc';
import { assignColors } from './colors';
import { emptyProgress } from './domain';
import { checkProgress } from './quality';
import { brasiliaToUtc, formatClock } from './time';

describe('percent', () => {
  it('returns null instead of NaN or Infinity', () => {
    expect(percent(1, 0)).toBeNull();
    expect(percent(null, 10)).toBeNull();
    expect(percent(Number.NaN, 10)).toBeNull();
    expect(percent(25, 100)).toBe(25);
  });
});

describe('countedPct', () => {
  it('prefers the provider figure and falls back to the ratio', () => {
    expect(countedPct({ sectionsCountedPct: 41.28, sectionsCounted: 1, sectionsTotal: 2 })).toBe(41.28);
    expect(countedPct({ sectionsCountedPct: null, sectionsCounted: 1, sectionsTotal: 4 })).toBe(25);
  });
});

describe('candidateDeltas', () => {
  it('computes vote and percentage-point changes; unknown previous is null', () => {
    const d = candidateDeltas(
      [
        ['a', 100, 50],
        ['b', 100, 50],
      ],
      [
        ['a', 150, 60],
        ['b', 100, 40],
        ['c', 5, null],
      ],
    );
    expect(d.get('a')).toEqual({ votes: 50, pp: 10 });
    expect(d.get('b')).toEqual({ votes: 0, pp: -10 });
    expect(d.get('c')).toEqual({ votes: null, pp: null });
  });
});

describe('progressDelta', () => {
  it('reports sections added between snapshots', () => {
    const prev = { ...emptyProgress(), sectionsCounted: 10, sectionsTotal: 100, turnout: 1000 };
    const curr = { ...prev, sectionsCounted: 25, turnout: 2500 };
    expect(progressDelta(prev, curr)).toEqual({
      sectionsAdded: 15,
      turnoutAdded: 1500,
      countedPctChange: 15,
    });
    expect(progressDelta(null, curr).sectionsAdded).toBeNull();
  });
});

describe('rankCandidates', () => {
  it('orders by votes, then ballot number', () => {
    const r = rankCandidates([
      { votes: 1, number: '20' },
      { votes: 5, number: '30' },
      { votes: 1, number: '13' },
    ]);
    expect(r.map((c) => c.number)).toEqual(['30', '13', '20']);
  });
});

describe('areas', () => {
  it('round-trips area keys and pads codes', () => {
    expect(area.city('SP', '7107').key).toBe('sp-07107');
    expect(parseAreaKey('sp-71072-z0001')).toMatchObject({
      type: 'zone',
      state: 'SP',
      cityCode: '71072',
      zone: '0001',
    });
    expect(parseAreaKey('br')?.type).toBe('country');
    expect(parseAreaKey('xx')).toBeNull();
    expect(parseAreaKey('sp;drop table')).toBeNull();
  });
});

describe('time', () => {
  it('converts Brasília local time to UTC', () => {
    expect(brasiliaToUtc('04/10/2026', '20:43:12')).toBe('2026-10-04T23:43:12.000Z');
    expect(brasiliaToUtc('', '20:00:00')).toBeNull();
    expect(brasiliaToUtc('2026-10-04', '20:00:00')).toBeNull();
    expect(formatClock('2026-10-04T23:43:12.000Z')).toBe('20:43:12');
  });
});

describe('quality', () => {
  it('flags counted sections above the total', () => {
    const issues = checkProgress({ ...emptyProgress(), sectionsTotal: 10, sectionsCounted: 11 });
    expect(issues.map((i) => i.code)).toContain('counted-exceeds-total');
  });
});

describe('assignColors', () => {
  it('gives every candidate the party colour, whatever the ranking', () => {
    const ranked = Array.from({ length: 12 }, (_, i) => ({
      key: String(i),
      party: { abbreviation: i === 11 ? 'NOVO' : 'XYZ' },
    }));
    expect(assignColors(ranked).get('11')).toBe('#F26522');
    expect(assignColors([{ key: 'm', party: { abbreviation: 'MISSÃO' } }]).get('m')).toBe('#F5A400');
  });

  it('never gives two candidates in the same race the same colour', () => {
    const colors = assignColors([
      { key: '1', party: { abbreviation: 'PT' } },
      { key: '2', party: { abbreviation: 'PT' } },
      { key: '3', party: { abbreviation: 'XYZ' } },
    ]);
    expect(new Set(colors.values()).size).toBe(3);
  });
});

describe('rankForDisplay', () => {
  it('never puts annulled votes ahead of valid ones', () => {
    const r = rankForDisplay([
      { votes: 100, number: '1', voteDestination: 'Anulado sub judice' },
      { votes: 90, number: '2', voteDestination: 'Válido' },
      { votes: 80, number: '3', voteDestination: null },
      { votes: 95, number: '4', voteDestination: 'Anulado' },
    ]);
    expect(r.map((c) => c.number)).toEqual(['2', '3', '1', '4']);
  });
});

describe('isRegression', () => {
  it('flags a file that takes an area clearly back', () => {
    expect(isRegression(100, 0)).toBe(true);
    expect(isRegression(87.5, 40)).toBe(true);
  });
  it('lets progress, equal files and small re-totalling drops through', () => {
    expect(isRegression(40, 41)).toBe(false);
    expect(isRegression(100, 100)).toBe(false);
    expect(isRegression(100, 99.4)).toBe(false);
    expect(isRegression(null, 0)).toBe(false);
    expect(isRegression(50, null)).toBe(false);
  });
});
